#!/usr/bin/env python3
"""Start the MCP over stdio and check that the three tools are discoverable.

Does not talk to Google Drive: it only proves the server process boots, speaks
MCP and advertises its tools. Useful before registering it in Hermes.

    python scripts/mcp_selftest.py
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {"eduinfo_list", "eduinfo_search", "eduinfo_get_asset"}


def _send(proc, message):
    proc.stdin.write(json.dumps(message) + "\n")
    proc.stdin.flush()


def _read(proc):
    while True:
        line = proc.stdout.readline()
        if not line:
            raise RuntimeError("server closed stdout")
        line = line.strip()
        if not line:
            continue
        message = json.loads(line)
        if "id" in message:
            return message


def main() -> int:
    env = dict(os.environ, PYTHONPATH=str(ROOT))
    proc = subprocess.Popen(
        [sys.executable, "-m", "nar_drive_mcp.server"],
        cwd=ROOT,
        env=env,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        _send(
            proc,
            {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": {"name": "nar-drive-selftest", "version": "1.0.0"},
                },
            },
        )
        init = _read(proc)
        server_name = init["result"]["serverInfo"]["name"]
        _send(proc, {"jsonrpc": "2.0", "method": "notifications/initialized"})
        _send(proc, {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
        tools = {tool["name"] for tool in _read(proc)["result"]["tools"]}
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()

    print(f"MCP_START_STATUS: OK (server={server_name})")
    print(f"TOOLS_DISCOVERED: {sorted(tools)}")
    missing = EXPECTED - tools
    if missing:
        print(f"FAIL: missing tools {sorted(missing)}")
        return 1
    print("SELFTEST: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
