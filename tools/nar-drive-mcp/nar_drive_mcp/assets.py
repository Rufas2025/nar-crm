"""Private, short-lived local storage for downloaded assets.

Files land in a 0700 directory with unpredictable names and are purged when
they expire (checked on every use) and again on process exit.
"""

from __future__ import annotations

import atexit
import mimetypes
import os
import secrets
import time
from pathlib import Path

_SAFE_EXTENSIONS = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
}


def extension_for(mime_type: str, name: str) -> str:
    if mime_type in _SAFE_EXTENSIONS:
        return _SAFE_EXTENSIONS[mime_type]
    suffix = Path(name or "").suffix
    if suffix and len(suffix) <= 10 and suffix.isalnum() is False and suffix[1:].isalnum():
        return suffix
    return mimetypes.guess_extension(mime_type or "") or ".bin"


class AssetStore:
    def __init__(self, directory: Path, ttl_seconds: int):
        self.directory = Path(directory)
        self.ttl_seconds = ttl_seconds
        self.directory.mkdir(parents=True, exist_ok=True)
        os.chmod(self.directory, 0o700)
        atexit.register(self.purge_all)

    def new_path(self, mime_type: str, name: str) -> Path:
        self.purge_expired()
        return self.directory / f"{secrets.token_hex(16)}{extension_for(mime_type, name)}"

    def purge_expired(self) -> int:
        cutoff = time.time() - self.ttl_seconds
        removed = 0
        for entry in self._entries():
            try:
                if entry.stat().st_mtime < cutoff:
                    entry.unlink()
                    removed += 1
            except OSError:
                continue
        return removed

    def purge_all(self) -> None:
        for entry in self._entries():
            try:
                entry.unlink()
            except OSError:
                continue

    def _entries(self):
        try:
            return [p for p in self.directory.iterdir() if p.is_file()]
        except OSError:
            return []
