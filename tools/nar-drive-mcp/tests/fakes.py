"""In-memory Drive double used by the scope/ancestry unit tests."""

from __future__ import annotations

from pathlib import Path

from nar_drive_mcp.scope import FOLDER_MIME, FileMeta

ROOT = "ROOT"


class FakeDrive:
    """Minimal stand-in for DriveClient."""

    def __init__(self, files: dict[str, FileMeta], payloads: dict[str, bytes] | None = None):
        self.files = files
        self.payloads = payloads or {}
        self.metadata_calls: list[str] = []
        self.downloads: list[str] = []

    def get_metadata(self, file_id: str) -> FileMeta:
        self.metadata_calls.append(file_id)
        if file_id not in self.files:
            raise KeyError(f"404 {file_id}")
        return self.files[file_id]

    def list_children(self, folder_id: str, page_size: int, page_token=None):
        children = [
            meta
            for meta in self.files.values()
            if folder_id in meta.parents and not meta.trashed
        ]
        return children[:page_size], None

    def search(self, query: str, page_size: int, page_token=None):
        hits = [
            meta
            for meta in self.files.values()
            if query.lower() in meta.name.lower() and not meta.trashed
        ]
        return hits[:page_size], None

    def download(self, file_id: str, destination: Path, max_bytes: int) -> int:
        self.downloads.append(file_id)
        data = self.payloads.get(file_id, b"")
        if len(data) > max_bytes:
            raise RuntimeError("too big")
        destination.write_bytes(data)
        return len(data)


def folder(fid: str, name: str, parents: tuple[str, ...] = ()) -> FileMeta:
    return FileMeta(id=fid, name=name, mime_type=FOLDER_MIME, parents=parents)


def png(fid: str, name: str, parents: tuple[str, ...], size: int = 10) -> FileMeta:
    return FileMeta(id=fid, name=name, mime_type="image/png", parents=parents, size=size)


def sample_tree() -> dict[str, FileMeta]:
    """ROOT/ASSETS/BANCO_SHINE/storie.png plus out-of-scope siblings."""
    metas = [
        folder(ROOT, "Eduinfo_2026_nar"),
        folder("ASSETS", "ASSETS", (ROOT,)),
        folder("SHINE", "BANCO SHINE", ("ASSETS",)),
        png("STORIE", "STORIE BANCO SHINE.png", ("SHINE",), size=2048),
        folder("DEEP1", "n1", ("SHINE",)),
        folder("DEEP2", "n2", ("DEEP1",)),
        png("DEEPFILE", "deep STORIE.png", ("DEEP2",)),
        FileMeta(
            id="TRASHED",
            name="STORIE BANCO SHINE.png",
            mime_type="image/png",
            parents=("SHINE",),
            trashed=True,
        ),
        folder("OUTSIDE_FOLDER", "Outra Pasta"),
        png("OUTSIDE_FILE", "STORIE BANCO SHINE.png", ("OUTSIDE_FOLDER",)),
        png("ORPHAN", "orfao.png", ()),
        folder("CYCLE_A", "a", ("CYCLE_B",)),
        folder("CYCLE_B", "b", ("CYCLE_A",)),
    ]
    return {meta.id: meta for meta in metas}
