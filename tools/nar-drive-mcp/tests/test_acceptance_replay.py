"""Acceptance replay: real Drive topology, offline.

The ids/parents/mime/size below were read from the live Drive tree
(Eduinfo_2026_nar) and are replayed through the real ScopeGuard/NarDriveService
code paths. This proves the scope decisions of the mandatory acceptance test
without credentials. The live end-to-end run is scripts/smoke_test.py.
"""

from pathlib import Path

import pytest

from fakes import FakeDrive
from nar_drive_mcp.assets import AssetStore
from nar_drive_mcp.config import DEFAULT_ROOT_FOLDER_ID, Config
from nar_drive_mcp.scope import FOLDER_MIME, FileMeta, ScopeError
from nar_drive_mcp.service import NarDriveService

ROOT = DEFAULT_ROOT_FOLDER_ID                       # Eduinfo_2026_nar
SHINE = "1YnUv4uTMeaNm0AMBng29T_lrd61lVT48"          # BANCO SHINE (filho da root)
STORIE = "1DZnAIBCDw9uF1RC4JXqKfO9SCWvI96ww"         # STORIE BANCO SHINE.png (in scope)
OUT_FOLDER = "19-4rpHGaD_nJKiVutaLmbs0YZa0NHWNp"     # BANCO SHINE fora da root
OUT_FILE = "1NX2Qdpqn-qa84uo3cZndIrszqQ4dCKkD"       # STORIE BANCO SHINE.png fora da root
OUT_PARENT = "1mVpLk7IH62OwZQgqkAh44vmmfujAGl6w"

# PNG real mínimo (1x1) usado como payload do replay.
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000a49444154789c6360000002000100ffff0300000600"
    "05572bd1e20000000049454e44ae426082"
)

TREE = {
    ROOT: FileMeta(id=ROOT, name="Eduinfo_2026_nar", mime_type=FOLDER_MIME),
    SHINE: FileMeta(id=SHINE, name="BANCO SHINE", mime_type=FOLDER_MIME, parents=(ROOT,)),
    STORIE: FileMeta(
        id=STORIE,
        name=" STORIE BANCO SHINE.png",
        mime_type="image/png",
        parents=(SHINE,),
        size=1174390,
    ),
    OUT_PARENT: FileMeta(id=OUT_PARENT, name="pasta externa", mime_type=FOLDER_MIME),
    OUT_FOLDER: FileMeta(
        id=OUT_FOLDER, name="BANCO SHINE", mime_type=FOLDER_MIME, parents=(OUT_PARENT,)
    ),
    OUT_FILE: FileMeta(
        id=OUT_FILE,
        name="STORIE BANCO SHINE.png",
        mime_type="image/png",
        parents=(OUT_FOLDER,),
        size=1174390,
    ),
}


@pytest.fixture()
def service(tmp_path: Path):
    config = Config(
        root_folder_id=ROOT,
        credentials_file=tmp_path / "fake.json",
        impersonate_subject=None,
        cache_dir=tmp_path / "cache",
        default_page_size=50,
        max_page_size=200,
        max_ancestry_depth=32,
        max_search_scan=500,
        max_download_bytes=8 * 1024 * 1024,
        inline_image_max_bytes=4 * 1024 * 1024,
        asset_ttl_seconds=60,
    )
    drive = FakeDrive(TREE, payloads={STORIE: PNG_BYTES, OUT_FILE: PNG_BYTES})
    return NarDriveService(config, drive, AssetStore(config.cache_dir, 60))


def test_banco_shine_is_reachable_from_root(service):
    assert SHINE in {item["id"] for item in service.list_folder()["items"]}


def test_search_returns_only_the_in_scope_storie(service):
    matches = service.search("STORIE BANCO SHINE.png")["matches"]
    assert {m["id"] for m in matches} == {STORIE}
    assert matches[0]["path"] == "Eduinfo_2026_nar/BANCO SHINE/ STORIE BANCO SHINE.png"


def test_get_asset_delivers_the_png(service):
    payload, path, inline = service.get_asset(STORIE)
    assert payload["status"] == "downloaded"
    assert payload["mime_type"] == "image/png"
    assert payload["bytes"] > 0
    assert Path(path).is_file() and Path(path).suffix == ".png"
    assert inline == PNG_BYTES


def test_out_of_scope_twin_is_denied(service):
    for out_of_scope in (OUT_FILE, OUT_FOLDER, OUT_PARENT):
        with pytest.raises(ScopeError):
            service.guard.assert_in_scope(out_of_scope)
    with pytest.raises(ScopeError):
        service.get_asset(OUT_FILE)
    assert service.client.downloads == []
