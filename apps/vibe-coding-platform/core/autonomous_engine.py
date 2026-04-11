# ABOUTME: The core autonomous agent execution engine — the Rube Goldberg machine.
# Orchestrates the complete ralph-loop: analyze → plan → build → validate → package.
# Long-running, fully autonomous, zero human intervention after START is pressed.
# Publishes real-time events to the session store for SSE streaming to the UI.

import asyncio
import json
import os
from dataclasses import dataclass, field
from typing import Any, Optional

from core.agent_sdk import AgentSDK
from core.file_manager import FileManager
from core.prd_processor import PRDProcessor
from core.sandbox_manager import SandboxManager
from core.session_store import SessionStore


@dataclass
class EngineConfig:
    session_id: str
    prd_text: str
    plan: dict
    answers: dict
    max_iterations: int
    workspace_path: str
    context_files: list[dict] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)
    mcp_servers: list[str] = field(default_factory=list)


PHASES = ["analyze", "plan", "build", "validate", "package"]

PHASE_LABELS = {
    "analyze": "Analyzing PRD",
    "plan":    "Planning architecture",
    "build":   "Building code",
    "validate":"Validating & testing",
    "package": "Packaging deliverable",
}


class AutonomousEngine:
    """
    The Rube Goldberg machine.
    Drop in a PRD, press START, walk away.
    The engine loops until done or max_iterations reached.
    """

    def __init__(self, config: EngineConfig):
        self.config = config
        self.file_manager = FileManager(config.workspace_path)
        self.prd_processor = PRDProcessor()
        self._stopped = False
        self._paused = False

    async def _emit(self, event_type: str, payload: dict) -> None:
        await SessionStore.publish(self.config.session_id, event_type, payload)

    async def _emit_phase(self, phase: str) -> None:
        await self._emit("phase_start", {
            "phase": phase,
            "label": PHASE_LABELS.get(phase, phase),
            "phases": PHASES,
        })
        await SessionStore.update(self.config.session_id, status=f"running:{phase}")

    async def _emit_output(self, text: str) -> None:
        await self._emit("agent_output", {"text": text})

    async def _emit_tool(self, name: str, inputs: dict) -> None:
        await self._emit("tool_use", {"tool": name, "inputs": inputs})

    async def _emit_tool_result(self, name: str, result: Any) -> None:
        preview = str(result)[:500] if result else ""
        await self._emit("tool_result", {"tool": name, "preview": preview})

    async def _emit_iteration(self, iteration: int, total: int, status: str) -> None:
        await self._emit("iteration", {
            "current": iteration,
            "total": total,
            "status": status,
            "progress_pct": int((iteration / total) * 100),
        })
        await SessionStore.update(
            self.config.session_id,
            current_iteration=iteration,
        )

    async def run(self) -> dict:
        """Main entry point. Runs the full autonomous loop."""
        await self._emit("engine_start", {
            "session_id": self.config.session_id,
            "max_iterations": self.config.max_iterations,
            "phases": PHASES,
        })

        try:
            result = await self._execute_loop()
            await self._emit("engine_complete", result)
            await SessionStore.update(
                self.config.session_id,
                status="complete",
                result=result,
            )
            return result
        except asyncio.CancelledError:
            await self._emit("engine_stopped", {"reason": "cancelled"})
            await SessionStore.update(self.config.session_id, status="stopped")
            raise
        except Exception as e:
            error = str(e)
            await self._emit("engine_error", {"error": error})
            await SessionStore.update(self.config.session_id, status="error")
            return {"success": False, "error": error, "files": []}

    async def _execute_loop(self) -> dict:
        """The ralph-loop: iterate until complete or budget exhausted."""
        cfg = self.config
        iteration = 0

        # Build the persistent system prompt once
        system_prompt = self.prd_processor.build_agent_system_prompt(
            prd_text=cfg.prd_text,
            plan=cfg.plan,
            answers=cfg.answers,
            max_iterations=cfg.max_iterations,
            current_iteration=iteration,
            context_files=cfg.context_files,
        )

        sdk = AgentSDK(tool_executor=self.file_manager.execute_tool)

        # Phase 1: Analyze
        await self._emit_phase("analyze")
        analyze_prompt = (
            f"Review this PRD and confirm your understanding. "
            f"List the 5 most critical implementation decisions you will make.\n\n"
            f"PRD:\n{cfg.prd_text[:3000]}"
        )
        await sdk.run(
            system_prompt=system_prompt,
            user_message=analyze_prompt,
            on_text=lambda t: asyncio.ensure_future(self._emit_output(t)),
            on_tool_use=lambda n, i: asyncio.ensure_future(self._emit_tool(n, i)),
            on_tool_result=lambda n, r: asyncio.ensure_future(self._emit_tool_result(n, r)),
            max_tokens=4096,
        )

        # Phase 2: Plan — write PLAN.md to workspace
        await self._emit_phase("plan")
        plan_prompt = (
            f"Write a PLAN.md file to the workspace that breaks down the implementation "
            f"into specific files to create. Then create the initial project structure "
            f"(directories, package.json or pyproject.toml, etc.)."
        )
        await sdk.run(
            system_prompt=system_prompt,
            user_message=plan_prompt,
            on_text=lambda t: asyncio.ensure_future(self._emit_output(t)),
            on_tool_use=lambda n, i: asyncio.ensure_future(self._emit_tool(n, i)),
            on_tool_result=lambda n, r: asyncio.ensure_future(self._emit_tool_result(n, r)),
            max_tokens=8192,
        )

        # Phase 3: Build — the main ralph-loop
        await self._emit_phase("build")
        build_complete = False

        for iteration in range(1, cfg.max_iterations + 1):
            if self._stopped:
                break

            # Handle pause
            while self._paused:
                await asyncio.sleep(1)

            await self._emit_iteration(iteration, cfg.max_iterations, "running")

            # Read current state of workspace for context
            files_list = await self.file_manager.list_files(".")
            complete_exists = await self._check_complete(sdk, system_prompt)

            if complete_exists:
                build_complete = True
                break

            # Build prompt for this iteration
            iteration_prompt = (
                f"Iteration {iteration}/{cfg.max_iterations}.\n\n"
                f"Current workspace:\n{files_list}\n\n"
                f"Continue building. Focus on the next incomplete part. "
                f"Write complete, working code. Run tests when relevant. "
                f"When the entire product is built and working, write COMPLETE.md."
            )

            await sdk.run(
                system_prompt=system_prompt,
                user_message=iteration_prompt,
                on_text=lambda t: asyncio.ensure_future(self._emit_output(t)),
                on_tool_use=lambda n, i: asyncio.ensure_future(self._emit_tool(n, i)),
                on_tool_result=lambda n, r: asyncio.ensure_future(self._emit_tool_result(n, r)),
                max_tokens=16384,
            )

            # Check for completion after each iteration
            complete_exists = await self._check_complete(sdk, system_prompt)
            if complete_exists:
                build_complete = True
                break

        # Phase 4: Validate
        await self._emit_phase("validate")
        await sdk.run(
            system_prompt=system_prompt,
            user_message=(
                "Run any tests that exist. Fix any errors you find. "
                "Verify the project runs correctly. Report what you validated."
            ),
            on_text=lambda t: asyncio.ensure_future(self._emit_output(t)),
            on_tool_use=lambda n, i: asyncio.ensure_future(self._emit_tool(n, i)),
            on_tool_result=lambda n, r: asyncio.ensure_future(self._emit_tool_result(n, r)),
            max_tokens=8192,
        )

        # Phase 5: Package
        await self._emit_phase("package")
        await sdk.run(
            system_prompt=system_prompt,
            user_message=(
                "Write a README.md that explains what was built, how to run it, "
                "and what each key file does. Keep it clear and concise."
            ),
            on_text=lambda t: asyncio.ensure_future(self._emit_output(t)),
            on_tool_use=lambda n, i: asyncio.ensure_future(self._emit_tool(n, i)),
            on_tool_result=lambda n, r: asyncio.ensure_future(self._emit_tool_result(n, r)),
            max_tokens=4096,
        )

        # Collect results
        files = await self.file_manager.get_all_files()
        readme = next((f["content"] for f in files if f["path"] == "README.md"), "")

        return {
            "success": build_complete,
            "iterations_used": iteration,
            "files": [{"path": f["path"], "content": f["content"][:5000]} for f in files],
            "file_count": len(files),
            "readme": readme,
            "workspace_path": cfg.workspace_path,
        }

    async def _check_complete(self, sdk: AgentSDK, system_prompt: str) -> bool:
        """Check if COMPLETE.md exists in the workspace."""
        result = await self.file_manager.run_command("test -f COMPLETE.md && echo YES || echo NO")
        return "YES" in result

    def stop(self) -> None:
        self._stopped = True

    def pause(self) -> None:
        self._paused = True

    def resume(self) -> None:
        self._paused = False
