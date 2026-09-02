"""Configuration loading. Secrets never come from source, only env / env-file."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

# Pasta raiz autorizada (Eduinfo_2026_nar). Não é segredo: é apenas um escopo.
DEFAULT_ROOT_FOLDER_ID = "1WcIuTx8ydx-8umN3PiFQ9OPJGtnG6EpL"
DEFAULT_ROOT_FOLDER_NAME = "Eduinfo_2026_nar"

READONLY_SCOPES = ("https://www.googleapis.com/auth/drive.readonly",)


class ConfigError(RuntimeError):
    """Raised when the server cannot start with a safe configuration."""


def _load_env_file(path: Path) -> None:
    """Minimal KEY=VALUE loader (no dependency). Existing env vars win."""
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError:
        return
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _int_env(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or not raw.strip():
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} must be an integer") from exc


@dataclass(frozen=True)
class Config:
    root_folder_id: str
    credentials_file: Path
    impersonate_subject: str | None
    cache_dir: Path
    default_page_size: int
    max_page_size: int
    max_ancestry_depth: int
    max_search_scan: int
    max_download_bytes: int
    inline_image_max_bytes: int
    asset_ttl_seconds: int

    @staticmethod
    def from_env() -> "Config":
        env_file = os.environ.get("NAR_DRIVE_ENV_FILE")
        if env_file:
            _load_env_file(Path(env_file).expanduser())

        creds = os.environ.get("NAR_DRIVE_CREDENTIALS_FILE") or os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS"
        )
        if not creds:
            raise ConfigError(
                "NAR_DRIVE_CREDENTIALS_FILE is not set "
                "(path to the read-only service account JSON key)"
            )
        credentials_file = Path(creds).expanduser()
        if not credentials_file.is_file():
            raise ConfigError(f"credentials file not found: {credentials_file}")

        hermes_home = Path(
            os.environ.get("HERMES_HOME", Path.home() / ".hermes")
        ).expanduser()
        cache_dir = Path(
            os.environ.get("NAR_DRIVE_CACHE_DIR", hermes_home / "cache" / "nar_drive")
        ).expanduser()

        root = os.environ.get("NAR_DRIVE_ROOT_FOLDER_ID", DEFAULT_ROOT_FOLDER_ID).strip()
        if not root:
            raise ConfigError("NAR_DRIVE_ROOT_FOLDER_ID must not be empty")

        subject = os.environ.get("NAR_DRIVE_IMPERSONATE_SUBJECT") or None

        return Config(
            root_folder_id=root,
            credentials_file=credentials_file,
            impersonate_subject=subject,
            cache_dir=cache_dir,
            default_page_size=_int_env("NAR_DRIVE_DEFAULT_PAGE_SIZE", 50),
            max_page_size=_int_env("NAR_DRIVE_MAX_PAGE_SIZE", 200),
            max_ancestry_depth=_int_env("NAR_DRIVE_MAX_ANCESTRY_DEPTH", 32),
            max_search_scan=_int_env("NAR_DRIVE_MAX_SEARCH_SCAN", 500),
            max_download_bytes=_int_env("NAR_DRIVE_MAX_DOWNLOAD_BYTES", 512 * 1024 * 1024),
            inline_image_max_bytes=_int_env("NAR_DRIVE_INLINE_IMAGE_MAX_BYTES", 4 * 1024 * 1024),
            asset_ttl_seconds=_int_env("NAR_DRIVE_ASSET_TTL_SECONDS", 3600),
        )
