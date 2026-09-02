#!/usr/bin/env python3
"""Real smoke / acceptance test against Google Drive (needs credentials).

Runs the mandatory acceptance flow:
  1. list the authorized root
  2. find the 'BANCO SHINE' folder
  3. search 'STORIE BANCO SHINE.png' inside it and take the real File_ID
  4. eduinfo_get_asset on that id -> file downloaded, mime image/png, bytes > 0
  5. an out-of-scope file id must be DENIED

Usage:
    export NAR_DRIVE_CREDENTIALS_FILE=/home/hermes/.hermes/secrets/nar_drive_sa.json
    python scripts/smoke_test.py [--out-of-scope-id <drive_file_id>]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from nar_drive_mcp.config import Config  # noqa: E402
from nar_drive_mcp.drive import DriveClient  # noqa: E402
from nar_drive_mcp.scope import ScopeError  # noqa: E402
from nar_drive_mcp.service import NarDriveService  # noqa: E402

TARGET_FOLDER = "BANCO SHINE"
TARGET_FILE = "STORIE BANCO SHINE.png"
# A well known public Drive id that is NOT under the authorized root.
DEFAULT_OUT_OF_SCOPE = "root"


def find_folder(service: NarDriveService, name: str) -> dict | None:
    for match in service.search(name, page_size=50)["matches"]:
        if match["is_folder"] and match["name"].strip().upper() == name.upper():
            return match
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-of-scope-id", default=DEFAULT_OUT_OF_SCOPE)
    parser.add_argument("--folder", default=TARGET_FOLDER)
    parser.add_argument("--file", default=TARGET_FILE)
    args = parser.parse_args()

    config = Config.from_env()
    service = NarDriveService(config, DriveClient(config))
    failures = 0

    root_listing = service.list_folder()
    print(f"ROOT_SCOPE_TEST: OK — {root_listing['count']} item(s) under "
          f"{root_listing['folder']['name']} ({config.root_folder_id})")

    folder = find_folder(service, args.folder)
    if not folder:
        print(f"SEARCH_TEST: FAIL — folder {args.folder!r} not found in the authorized tree")
        return 1
    print(f"SEARCH_TEST: folder found — {args.folder} id={folder['id']} path={folder.get('path')}")

    matches = service.search(args.file, folder_id=folder["id"])["matches"]
    exact = [m for m in matches if m["name"].strip().upper() == args.file.upper()]
    if not exact:
        print(f"SEARCH_TEST: FAIL — {args.file!r} not found under {args.folder}")
        return 1
    asset = exact[0]
    print(f"SEARCH_TEST: OK — File_ID={asset['id']} path={asset.get('path')}")

    payload, path, _inline = service.get_asset(asset["id"])
    ok_mime = payload.get("mime_type") == "image/png"
    ok_bytes = payload.get("bytes", 0) > 0
    ok_file = bool(path) and Path(path).is_file()
    print(
        "ASSET_DOWNLOAD_TEST: "
        f"{'OK' if (ok_mime and ok_bytes and ok_file) else 'FAIL'} — "
        f"path={payload.get('local_path')} mime={payload.get('mime_type')} "
        f"bytes={payload.get('bytes')}"
    )
    failures += 0 if (ok_mime and ok_bytes and ok_file) else 1

    try:
        service.get_asset(args.out_of_scope_id)
        print(f"OUT_OF_SCOPE_DENY_TEST: FAIL — {args.out_of_scope_id} was NOT denied")
        failures += 1
    except ScopeError as exc:
        print(f"OUT_OF_SCOPE_DENY_TEST: OK — DENIED ({exc})")

    print("SMOKE_TEST:", "PASS" if failures == 0 else "FAIL")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
