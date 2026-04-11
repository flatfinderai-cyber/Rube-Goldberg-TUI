# ABOUTME: File system operations for the agent workspace sandbox.
# All agent file I/O is scoped to an isolated workspace directory.
# Provides the tool execution backend for agent_sdk.py tool calls.

import asyncio
import os
import shutil
from pathlib import Path
from typing import Any

import aiofiles


class FileManager:
    """Manages files within a single session's isolated workspace."""

    def __init__(self, workspace_path: str):
        self.workspace = Path(workspace_path).resolve()
        self.workspace.mkdir(parents=True, exist_ok=True)

    def _safe_path(self, relative: str) -> Path:
        """Resolve path and ensure it stays within workspace."""
        target = (self.workspace / relative.lstrip("/")).resolve()
        if not str(target).startswith(str(self.workspace)):
            raise ValueError(f"Path escape attempt: {relative}")
        return target

    async def read_file(self, path: str) -> str:
        target = self._safe_path(path)
        if not target.exists():
            return f"[error: file not found: {path}]"
        async with aiofiles.open(target, "r", encoding="utf-8", errors="replace") as f:
            return await f.read()

    async def write_file(self, path: str, content: str) -> str:
        target = self._safe_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(target, "w", encoding="utf-8") as f:
            await f.write(content)
        return f"Written {len(content)} bytes to {path}"

    async def list_files(self, directory: str = ".") -> str:
        target = self._safe_path(directory)
        if not target.exists():
            return f"[error: directory not found: {directory}]"
        lines = []
        for item in sorted(target.iterdir()):
            rel = item.relative_to(self.workspace)
            prefix = "📁 " if item.is_dir() else "📄 "
            lines.append(f"{prefix}{rel}")
        return "\n".join(lines) if lines else "(empty directory)"

    async def create_directory(self, path: str) -> str:
        target = self._safe_path(path)
        target.mkdir(parents=True, exist_ok=True)
        return f"Created directory: {path}"

    async def run_command(self, command: str, timeout: int = 60) -> str:
        """Run a shell command inside the workspace directory."""
        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                cwd=str(self.workspace),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                env={**os.environ, "HOME": str(self.workspace)},
            )
            try:
                stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=timeout)
                output = stdout.decode("utf-8", errors="replace")
                return_code = proc.returncode
                return f"[exit {return_code}]\n{output}"
            except asyncio.TimeoutError:
                proc.kill()
                return f"[error: command timed out after {timeout}s]"
        except Exception as e:
            return f"[error: {e}]"

    async def get_all_files(self) -> list[dict]:
        """Return all files as list of {path, content} dicts."""
        files = []
        for item in self.workspace.rglob("*"):
            if item.is_file() and ".git" not in item.parts:
                rel = str(item.relative_to(self.workspace))
                try:
                    async with aiofiles.open(item, "r", encoding="utf-8", errors="replace") as f:
                        content = await f.read()
                    files.append({"path": rel, "content": content})
                except Exception:
                    pass
        return files

    async def make_zip(self, output_path: str) -> str:
        """Zip the entire workspace for download."""
        shutil.make_archive(output_path, "zip", self.workspace)
        return f"{output_path}.zip"

    async def execute_tool(self, name: str, inputs: dict) -> Any:
        """Dispatch a tool call from the agent to the right method."""
        if name == "read_file":
            return await self.read_file(inputs["path"])
        elif name == "write_file":
            return await self.write_file(inputs["path"], inputs["content"])
        elif name == "list_files":
            return await self.list_files(inputs.get("directory", "."))
        elif name == "create_directory":
            return await self.create_directory(inputs["path"])
        elif name == "run_command":
            return await self.run_command(inputs["command"], inputs.get("timeout", 60))
        else:
            return f"[error: unknown tool: {name}]"
