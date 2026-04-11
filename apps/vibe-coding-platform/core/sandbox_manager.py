# ABOUTME: Sandbox workspace manager for isolated agent execution environments.
# Creates per-session workspaces and manages their lifecycle.

import os
import shutil
from pathlib import Path

WORKSPACE_BASE = Path(os.getenv("WORKSPACE_DIR", "./workspaces")).resolve()


class SandboxManager:
    @staticmethod
    def create_workspace(session_id: str) -> str:
        """Create an isolated workspace directory for a session."""
        path = WORKSPACE_BASE / session_id
        path.mkdir(parents=True, exist_ok=True)
        return str(path)

    @staticmethod
    def get_workspace(session_id: str) -> str:
        path = WORKSPACE_BASE / session_id
        return str(path)

    @staticmethod
    def workspace_exists(session_id: str) -> bool:
        return (WORKSPACE_BASE / session_id).exists()

    @staticmethod
    def cleanup_workspace(session_id: str) -> None:
        path = WORKSPACE_BASE / session_id
        if path.exists():
            shutil.rmtree(path)
