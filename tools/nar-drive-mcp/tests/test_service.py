from pathlib import Path

import pytest

from fakes import ROOT, FakeDrive, sample_tree
from nar_drive_mcp.assets import AssetStore, extension_for
from nar_drive_mcp.config import Config
from nar_drive_mcp.drive import escape_query_value
from nar_drive_mcp.scope import ScopeError
from nar_drive_mcp.service import NarDriveService

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"0" * 64


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
        max_download_bytes=1024,
        inline_image_max_bytes=1024,
        asset_ttl_seconds=60,
    )
    drive = FakeDrive(sample_tree(), payloads={"STORIE": PNG_BYTES, "OUTSIDE_FILE": PNG_BYTES})
    return NarDriveService(config, drive, AssetStore(config.cache_dir, 60))


def test_list_defaults_to_root(service):
    result = service.list_folder()
    assert result["folder"]["id"] == ROOT
    assert {item["name"] for item in result["items"]} == {"ASSETS"}


def test_list_subfolder_in_scope(service):
    result = service.list_folder("SHINE")
    names = {item["name"] for item in result["items"]}
    assert "STORIE BANCO SHINE.png" in names
    assert all(item["id"] != "TRASHED" for item in result["items"])


def test_list_outside_root_is_denied(service):
    with pytest.raises(ScopeError):
        service.list_folder("OUTSIDE_FOLDER")


def test_list_rejects_non_folder(service):
    with pytest.raises(ScopeError):
        service.list_folder("STORIE")


def test_search_never_returns_out_of_scope_matches(service):
    result = service.search("STORIE BANCO SHINE.png")
    ids = {match["id"] for match in result["matches"]}
    assert ids == {"STORIE"}
    assert "OUTSIDE_FILE" not in ids
    assert result["matches"][0]["path"].startswith("Eduinfo_2026_nar/")


def test_search_restricted_to_subtree(service):
    assert {m["id"] for m in service.search("STORIE", folder_id="DEEP1")["matches"]} == {
        "DEEPFILE"
    }
    assert {m["id"] for m in service.search("STORIE", folder_id="SHINE")["matches"]} == {
        "STORIE",
        "DEEPFILE",
    }


def test_search_scope_folder_must_be_in_scope(service):
    with pytest.raises(ScopeError):
        service.search("STORIE", folder_id="OUTSIDE_FOLDER")


def test_search_requires_query(service):
    with pytest.raises(ValueError):
        service.search("   ")


def test_get_asset_downloads_in_scope_file(service):
    payload, path, inline = service.get_asset("STORIE")
    assert payload["status"] == "downloaded"
    assert payload["mime_type"] == "image/png"
    assert payload["bytes"] == len(PNG_BYTES) > 0
    assert path.exists() and path.read_bytes() == PNG_BYTES
    assert path.suffix == ".png"
    assert inline == PNG_BYTES


def test_downloaded_file_is_private(service):
    _payload, path, _inline = service.get_asset("STORIE")
    assert oct(path.stat().st_mode)[-3:] == "600"
    assert oct(path.parent.stat().st_mode)[-3:] == "700"


def test_get_asset_outside_root_is_denied(service):
    with pytest.raises(ScopeError):
        service.get_asset("OUTSIDE_FILE")
    assert service.client.downloads == []


def test_get_asset_rejects_folder(service):
    with pytest.raises(ScopeError):
        service.get_asset("SHINE")


def test_get_asset_rejects_trashed(service):
    with pytest.raises(ScopeError):
        service.get_asset("TRASHED")


def test_native_google_doc_is_not_downloaded(service):
    from nar_drive_mcp.scope import FileMeta

    service.client.files["DOC"] = FileMeta(
        id="DOC",
        name="plano",
        mime_type="application/vnd.google-apps.document",
        parents=("SHINE",),
    )
    payload, path, inline = service.get_asset("DOC")
    assert payload["status"] == "unsupported_native_google_doc"
    assert path is None and inline is None


def test_page_size_is_clamped(service):
    assert service._clamp_page_size(None) == 50
    assert service._clamp_page_size(10_000) == 200
    assert service._clamp_page_size(0) == 50
    assert service._clamp_page_size(-5) == 1


def test_asset_store_purges_expired(tmp_path: Path):
    import os
    import time

    store = AssetStore(tmp_path / "c", ttl_seconds=1)
    stale = store.new_path("image/png", "a.png")
    stale.write_bytes(b"x")
    os.utime(stale, (time.time() - 10, time.time() - 10))
    store.purge_expired()
    assert not stale.exists()


def test_asset_names_are_unpredictable(service):
    first = service.store.new_path("image/png", "a.png").name
    second = service.store.new_path("image/png", "a.png").name
    assert first != second and len(first) >= 32


def test_extension_fallbacks():
    assert extension_for("image/png", "x") == ".png"
    assert extension_for("application/pdf", "x") == ".pdf"
    assert extension_for("video/mp4", "x") == ".mp4"
    assert extension_for("application/octet-stream", "x.weird") == ".weird"


def test_query_escaping_blocks_injection():
    assert escape_query_value("a'b") == "a\\'b"
    assert escape_query_value("a\\b") == "a\\\\b"
