"""Thin read-only Google Drive client.

Only read methods exist here. The credentials are requested with the
`drive.readonly` scope, so write/upload/delete/move/share calls are impossible
even if some future caller tried.
"""

from __future__ import annotations

import io
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from .config import READONLY_SCOPES, Config
from .scope import FOLDER_MIME, FileMeta

FILE_FIELDS = "id, name, mimeType, parents, size, trashed, modifiedTime"


class DriveError(RuntimeError):
    """Drive API failure (never carries credentials or tokens)."""


def escape_query_value(value: str) -> str:
    """Escape a literal for a Drive `q` string."""
    return value.replace("\\", "\\\\").replace("'", "\\'")


def _to_meta(payload: dict) -> FileMeta:
    size = payload.get("size")
    return FileMeta(
        id=payload["id"],
        name=payload.get("name", ""),
        mime_type=payload.get("mimeType", ""),
        parents=tuple(payload.get("parents") or ()),
        size=int(size) if size is not None else None,
        trashed=bool(payload.get("trashed", False)),
        modified_time=payload.get("modifiedTime"),
    )


class DriveClient:
    """Read-only wrapper around the Drive v3 API."""

    def __init__(self, config: Config, service=None):
        self._config = config
        self._service = service or self._build_service(config)

    @staticmethod
    def _build_service(config: Config):
        credentials = service_account.Credentials.from_service_account_file(
            str(config.credentials_file), scopes=list(READONLY_SCOPES)
        )
        if config.impersonate_subject:
            credentials = credentials.with_subject(config.impersonate_subject)
        try:  # static discovery avoids a network round-trip at startup
            return build(
                "drive",
                "v3",
                credentials=credentials,
                cache_discovery=False,
                static_discovery=True,
            )
        except TypeError:  # older google-api-python-client
            return build("drive", "v3", credentials=credentials, cache_discovery=False)

    # ---- reads ----------------------------------------------------------
    def get_metadata(self, file_id: str) -> FileMeta:
        payload = (
            self._service.files()
            .get(fileId=file_id, fields=FILE_FIELDS, supportsAllDrives=True)
            .execute()
        )
        return _to_meta(payload)

    def list_children(self, folder_id: str, page_size: int, page_token: str | None = None):
        response = (
            self._service.files()
            .list(
                q=f"'{escape_query_value(folder_id)}' in parents and trashed = false",
                fields=f"nextPageToken, files({FILE_FIELDS})",
                pageSize=page_size,
                pageToken=page_token,
                orderBy="folder,name",
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )
        files = [_to_meta(item) for item in response.get("files", [])]
        return files, response.get("nextPageToken")

    def search(self, query: str, page_size: int, page_token: str | None = None):
        term = escape_query_value(query)
        response = (
            self._service.files()
            .list(
                q=f"(name contains '{term}' or fullText contains '{term}') and trashed = false",
                fields=f"nextPageToken, files({FILE_FIELDS})",
                pageSize=page_size,
                pageToken=page_token,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )
        files = [_to_meta(item) for item in response.get("files", [])]
        return files, response.get("nextPageToken")

    def download(self, file_id: str, destination: Path, max_bytes: int) -> int:
        """Download a binary file to `destination`. Returns bytes written."""
        request = self._service.files().get_media(fileId=file_id, supportsAllDrives=True)
        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(buffer, request, chunksize=4 * 1024 * 1024)
        done = False
        while not done:
            _status, done = downloader.next_chunk()
            if buffer.tell() > max_bytes:
                raise DriveError(
                    f"file exceeds NAR_DRIVE_MAX_DOWNLOAD_BYTES ({max_bytes} bytes)"
                )
        data = buffer.getvalue()
        destination.write_bytes(data)
        destination.chmod(0o600)
        return len(data)


def is_native_google_doc(mime_type: str) -> bool:
    return mime_type.startswith("application/vnd.google-apps.") and mime_type != FOLDER_MIME
