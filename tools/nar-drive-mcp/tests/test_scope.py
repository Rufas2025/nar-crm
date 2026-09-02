import pytest

from fakes import ROOT, FakeDrive, sample_tree
from nar_drive_mcp.scope import ScopeError, ScopeGuard


@pytest.fixture()
def guard():
    drive = FakeDrive(sample_tree())
    return ScopeGuard(root_id=ROOT, provider=drive.get_metadata, max_depth=8)


def test_root_is_in_scope(guard):
    assert guard.is_in_scope(ROOT)
    assert guard.ancestry(ROOT) == (ROOT,)


def test_direct_child_in_scope(guard):
    assert guard.ancestry("ASSETS") == (ROOT, "ASSETS")


def test_deep_descendant_in_scope(guard):
    assert guard.ancestry("DEEPFILE") == (ROOT, "ASSETS", "SHINE", "DEEP1", "DEEP2", "DEEPFILE")
    assert guard.path_of("STORIE") == "Eduinfo_2026_nar/ASSETS/BANCO SHINE/STORIE BANCO SHINE.png"


def test_file_outside_root_is_denied(guard):
    assert not guard.is_in_scope("OUTSIDE_FILE")
    with pytest.raises(ScopeError):
        guard.assert_in_scope("OUTSIDE_FILE")


def test_folder_outside_root_is_denied(guard):
    with pytest.raises(ScopeError):
        guard.assert_in_scope("OUTSIDE_FOLDER")


def test_unknown_id_is_denied(guard):
    with pytest.raises(ScopeError):
        guard.assert_in_scope("does-not-exist")


def test_orphan_without_parents_is_denied(guard):
    with pytest.raises(ScopeError):
        guard.assert_in_scope("ORPHAN")


def test_parent_cycle_is_denied(guard):
    with pytest.raises(ScopeError):
        guard.assert_in_scope("CYCLE_A")


def test_trashed_item_is_denied(guard):
    with pytest.raises(ScopeError):
        guard.assert_in_scope("TRASHED")


@pytest.mark.parametrize("bad", ["", "   ", None, 123])
def test_invalid_ids_are_denied(guard, bad):
    with pytest.raises(ScopeError):
        guard.ancestry(bad)


def test_provider_failure_fails_closed():
    def boom(_file_id):
        raise RuntimeError("network down")

    guard = ScopeGuard(root_id=ROOT, provider=boom)
    assert not guard.is_in_scope("anything")


def test_depth_limit_fails_closed():
    from nar_drive_mcp.scope import FileMeta

    chain = {ROOT: FileMeta(id=ROOT, name="root", mime_type="application/vnd.google-apps.folder")}
    previous = ROOT
    for index in range(10):
        node = f"N{index}"
        chain[node] = FileMeta(
            id=node,
            name=node,
            mime_type="application/vnd.google-apps.folder",
            parents=(previous,),
        )
        previous = node
    drive = FakeDrive(chain)
    shallow = ScopeGuard(root_id=ROOT, provider=drive.get_metadata, max_depth=3)
    assert not shallow.is_in_scope("N9")
    deep = ScopeGuard(root_id=ROOT, provider=drive.get_metadata, max_depth=32)
    assert deep.is_in_scope("N9")


def test_ancestry_is_cached(guard):
    guard.ancestry("DEEPFILE")
    calls_before = len(guard._cache)
    guard.ancestry("DEEPFILE")
    assert len(guard._cache) == calls_before


def test_multi_parent_resolves_through_the_in_scope_parent():
    from nar_drive_mcp.scope import FileMeta

    tree = sample_tree()
    tree["MULTI"] = FileMeta(
        id="MULTI",
        name="shared.png",
        mime_type="image/png",
        parents=("OUTSIDE_FOLDER", "SHINE"),
    )
    drive = FakeDrive(tree)
    guard = ScopeGuard(root_id=ROOT, provider=drive.get_metadata)
    assert guard.ancestry("MULTI") == (ROOT, "ASSETS", "SHINE", "MULTI")
