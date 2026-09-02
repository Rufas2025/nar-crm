"""Business logic for the three tools, independent of the MCP transport."""

from __future__ import annotations

import base64
from pathlib import Path

from .assets import AssetStore
from .config import Config
from .drive import DriveClient, is_native_google_doc
from .scope import FileMeta, ScopeError, ScopeGuard


class NarDriveService:
    def __init__(self, config: Config, client: DriveClient, store: AssetStore | None = None):
        self.config = config
        self.client = client
        self.store = store or AssetStore(config.cache_dir, config.asset_ttl_seconds)
        self.guard = ScopeGuard(
            root_id=config.root_folder_id,
            provider=client.get_metadata,
            max_depth=config.max_ancestry_depth,
        )

    # ---- helpers --------------------------------------------------------
    def _clamp_page_size(self, page_size: int | None) -> int:
        if not page_size:
            return self.config.default_page_size
        return max(1, min(int(page_size), self.config.max_page_size))

    def _describe(self, meta: FileMeta, with_path: bool = False) -> dict:
        data = meta.to_dict()
        if with_path:
            try:
                data["path"] = self.guard.path_of(meta.id)
            except ScopeError:
                pass
        return data

    # ---- tools ----------------------------------------------------------
    def list_folder(self, folder_id: str | None = None, page_size: int | None = None) -> dict:
        target = (folder_id or self.config.root_folder_id).strip()
        meta = self.guard.assert_in_scope(target)
        if not meta.is_folder:
            raise ScopeError(f"id {target!r} is not a folder")
        size = self._clamp_page_size(page_size)
        children, next_token = self.client.list_children(target, size)
        self.guard.prime(children)
        return {
            "folder": self._describe(meta, with_path=True),
            "count": len(children),
            "items": [self._describe(child) for child in children],
            "next_page_token": next_token,
        }

    def search(
        self,
        query: str,
        folder_id: str | None = None,
        page_size: int | None = None,
    ) -> dict:
        if not query or not query.strip():
            raise ValueError("query must not be empty")
        subtree = (folder_id or self.config.root_folder_id).strip()
        self.guard.assert_in_scope(subtree)

        wanted = self._clamp_page_size(page_size)
        matches: list[dict] = []
        scanned = 0
        page_token = None
        while len(matches) < wanted and scanned < self.config.max_search_scan:
            batch, page_token = self.client.search(
                query.strip(), page_size=min(100, self.config.max_page_size), page_token=page_token
            )
            if not batch:
                break
            self.guard.prime(batch)
            for candidate in batch:
                scanned += 1
                try:
                    chain = self.guard.ancestry(candidate.id)
                except ScopeError:
                    continue  # fora da root: nunca retornado
                if subtree not in chain:
                    continue
                matches.append(self._describe(candidate, with_path=True))
                if len(matches) >= wanted:
                    break
            if not page_token:
                break
        return {
            "query": query.strip(),
            "scope_folder_id": subtree,
            "count": len(matches),
            "scanned": scanned,
            "matches": matches,
        }

    def get_asset(self, file_id: str) -> tuple[dict, Path | None, bytes | None]:
        """Return (payload, local_path, inline_bytes) for an in-scope file."""
        target = (file_id or "").strip()
        meta = self.guard.assert_in_scope(target)
        if meta.is_folder:
            raise ScopeError(f"id {target!r} is a folder, not an asset")

        payload = self._describe(meta, with_path=True)
        if is_native_google_doc(meta.mime_type):
            payload["status"] = "unsupported_native_google_doc"
            payload["detail"] = (
                "Native Google Docs/Sheets/Slides are out of scope for V1 "
                "(binary assets only)."
            )
            return payload, None, None

        destination = self.store.new_path(meta.mime_type, meta.name)
        written = self.client.download(target, destination, self.config.max_download_bytes)
        destination.chmod(0o600)
        payload.update(
            {
                "status": "downloaded",
                "local_path": str(destination),
                "bytes": written,
                "expires_in_seconds": self.config.asset_ttl_seconds,
            }
        )
        inline: bytes | None = None
        if (
            meta.mime_type.startswith("image/")
            and written > 0
            and written <= self.config.inline_image_max_bytes
        ):
            inline = destination.read_bytes()
            payload["inline"] = "image"
        return payload, destination, inline


def encode_inline(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")
