"""Ancestry / scope enforcement.

Every id the agent touches must be the authorized root folder or a descendant
of it, at any depth. The guard is pure logic over a metadata provider so it can
be unit-tested without touching Google Drive.

Fail closed: anything we cannot fully prove to be inside the tree is DENIED.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Iterable

FOLDER_MIME = "application/vnd.google-apps.folder"


class ScopeError(PermissionError):
    """The requested id is not provably inside the authorized root tree."""


@dataclass(frozen=True)
class FileMeta:
    id: str
    name: str
    mime_type: str
    parents: tuple[str, ...] = ()
    size: int | None = None
    trashed: bool = False
    modified_time: str | None = None

    @property
    def is_folder(self) -> bool:
        return self.mime_type == FOLDER_MIME

    def to_dict(self) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "mime_type": self.mime_type,
            "is_folder": self.is_folder,
            "parents": list(self.parents),
        }
        if self.size is not None:
            data["size"] = self.size
        if self.modified_time:
            data["modified_time"] = self.modified_time
        return data


# A provider maps a file id to its metadata; it raises on unknown ids.
MetadataProvider = Callable[[str], FileMeta]


@dataclass
class ScopeGuard:
    root_id: str
    provider: MetadataProvider
    max_depth: int = 32
    _cache: dict[str, FileMeta] = field(default_factory=dict, repr=False)
    _verdicts: dict[str, tuple[str, ...] | None] = field(default_factory=dict, repr=False)

    # ---- metadata -------------------------------------------------------
    def meta(self, file_id: str) -> FileMeta:
        """Cached metadata lookup. Any provider failure becomes a ScopeError."""
        if file_id in self._cache:
            return self._cache[file_id]
        try:
            meta = self.provider(file_id)
        except ScopeError:
            raise
        except Exception as exc:  # fail closed, never leak provider internals
            raise ScopeError(f"cannot resolve metadata for id {file_id!r}") from exc
        if meta is None or meta.id != file_id:
            raise ScopeError(f"inconsistent metadata for id {file_id!r}")
        self._cache[file_id] = meta
        return meta

    def prime(self, metas: Iterable[FileMeta]) -> None:
        """Seed the cache with metadata already fetched (list/search results)."""
        for meta in metas:
            self._cache.setdefault(meta.id, meta)

    # ---- ancestry -------------------------------------------------------
    def ancestry(self, file_id: str) -> tuple[str, ...]:
        """Return the id chain root..file, or raise ScopeError.

        Walks upwards through parents (breadth-first, since a Drive item may
        have several parents). Fails closed on unknown ids, trashed items,
        parentless items, cycles and depth overflow.
        """
        if not isinstance(file_id, str) or not file_id.strip():
            raise ScopeError("file_id must be a non-empty string")
        file_id = file_id.strip()

        if file_id in self._verdicts:
            cached = self._verdicts[file_id]
            if cached is None:
                raise ScopeError(f"id {file_id!r} is outside the authorized root")
            return cached

        parent_of: dict[str, str] = {}
        queue: list[tuple[str, int]] = [(file_id, 0)]
        visited: set[str] = {file_id}
        while queue:
            node, depth = queue.pop(0)
            if node == self.root_id:
                chain = [node]
                while chain[-1] != file_id:
                    chain.append(parent_of[chain[-1]])
                result = tuple(chain)
                self._verdicts[file_id] = result
                return result
            if depth >= self.max_depth:
                continue
            try:
                meta = self.meta(node)
            except ScopeError:
                continue  # unresolvable branch: never counts as in-scope
            if meta.trashed:
                continue
            for parent in meta.parents:
                if parent in visited:
                    continue  # already queued, or a cycle
                visited.add(parent)
                parent_of[parent] = node
                queue.append((parent, depth + 1))

        self._verdicts[file_id] = None
        raise ScopeError(f"id {file_id!r} is outside the authorized root")

    def is_in_scope(self, file_id: str) -> bool:
        try:
            self.ancestry(file_id)
            return True
        except ScopeError:
            return False

    def assert_in_scope(self, file_id: str) -> FileMeta:
        """Raise ScopeError unless file_id is the root or a descendant."""
        self.ancestry(file_id)
        meta = self.meta(file_id)
        if meta.trashed:
            raise ScopeError(f"id {file_id!r} is trashed")
        return meta

    def path_of(self, file_id: str) -> str:
        """Human readable path from the authorized root, e.g. 'root/a/b.png'."""
        names = []
        for node_id in self.ancestry(file_id):
            try:
                names.append(self.meta(node_id).name)
            except ScopeError:
                names.append(node_id)
        return "/".join(names)
