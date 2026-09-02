"""MCP stdio server exposing three read-only Drive tools to Hermes/Rufas."""

from __future__ import annotations

import json
import logging
import sys

import mcp.types as types

from . import __version__
from .config import Config, ConfigError
from .drive import DriveClient, DriveError
from .scope import ScopeError
from .service import NarDriveService, encode_inline

try:  # mcp >= 2.x
    from mcp.server.mcpserver import MCPServer as _Server
except ImportError:  # mcp 1.x
    from mcp.server.fastmcp import FastMCP as _Server  # type: ignore

logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    format="%(asctime)s nar_drive_mcp %(levelname)s %(message)s",
)
log = logging.getLogger("nar_drive_mcp")

_service: NarDriveService | None = None

server = _Server(
    name="nar_drive",
    version=__version__,
    instructions=(
        "Read-only access to the authorized Google Drive folder "
        "'Eduinfo_2026_nar' and everything below it. Use eduinfo_list to browse, "
        "eduinfo_search to find files by name, and eduinfo_get_asset to fetch a "
        "file (image/PDF/video) as a local temporary file. Anything outside the "
        "authorized folder is denied."
    ),
)


def get_service() -> NarDriveService:
    global _service
    if _service is None:
        config = Config.from_env()
        _service = NarDriveService(config, DriveClient(config))
        log.info(
            "nar_drive ready (root=%s, cache=%s)", config.root_folder_id, config.cache_dir
        )
    return _service


def _as_text(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2)


def _error(kind: str, message: str) -> str:
    return _as_text({"status": kind, "error": message})


def _guarded(fn):
    """Translate internal failures into safe, secret-free tool errors."""
    try:
        return fn()
    except ScopeError as exc:
        return _error("denied", str(exc))
    except (ValueError, ConfigError) as exc:
        return _error("invalid_request", str(exc))
    except DriveError as exc:
        return _error("drive_error", str(exc))
    except Exception:  # noqa: BLE001 - fail closed, never leak internals
        log.exception("unexpected failure")
        return _error("error", "unexpected server failure; see stderr log")


@server.tool(
    name="eduinfo_list",
    description=(
        "List the direct children of an authorized Drive folder. Without "
        "folder_id, lists the authorized root (Eduinfo_2026_nar). Read-only."
    ),
)
def eduinfo_list(folder_id: str | None = None, page_size: int | None = None) -> str:
    return _guarded(lambda: _as_text(get_service().list_folder(folder_id, page_size)))


@server.tool(
    name="eduinfo_search",
    description=(
        "Search files by name/content recursively inside the authorized tree. "
        "Optionally restrict to a subfolder with folder_id. Read-only."
    ),
)
def eduinfo_search(
    query: str, folder_id: str | None = None, page_size: int | None = None
) -> str:
    return _guarded(lambda: _as_text(get_service().search(query, folder_id, page_size)))


@server.tool(
    name="eduinfo_get_asset",
    description=(
        "Download one in-scope file (PNG/JPG/WebP/PDF/MP4 and other binaries) to "
        "a private temporary path and return its metadata. Images are also "
        "returned inline when small enough. Read-only."
    ),
)
def eduinfo_get_asset(file_id: str) -> list[types.ContentBlock] | str:
    try:
        payload, _path, inline = get_service().get_asset(file_id)
    except ScopeError as exc:
        return _error("denied", str(exc))
    except (ValueError, ConfigError) as exc:
        return _error("invalid_request", str(exc))
    except DriveError as exc:
        return _error("drive_error", str(exc))
    except Exception:  # noqa: BLE001
        log.exception("unexpected failure in eduinfo_get_asset")
        return _error("error", "unexpected server failure; see stderr log")

    blocks: list[types.ContentBlock] = [types.TextContent(type="text", text=_as_text(payload))]
    if inline:
        blocks.append(
            types.ImageContent(
                type="image", data=encode_inline(inline), mimeType=payload["mime_type"]
            )
        )
    return blocks


def main() -> None:
    try:
        get_service()  # fail fast on bad configuration/credentials
    except ConfigError as exc:
        log.error("configuration error: %s", exc)
        raise SystemExit(2) from exc
    server.run("stdio")


if __name__ == "__main__":
    main()
