# ABOUTME: Agent execution control routes.
# POST /api/session/{id}/start  — launch the autonomous engine in background
# POST /api/session/{id}/pause  — pause after current iteration
# POST /api/session/{id}/stop   — stop immediately

import asyncio
import json
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from core.autonomous_engine import AutonomousEngine, EngineConfig
from core.session_store import SessionStore
from core.sandbox_manager import SandboxManager

router = APIRouter()

# Running engines keyed by session_id
_engines: dict[str, AutonomousEngine] = {}
_tasks: dict[str, asyncio.Task] = {}


class StartRequest(BaseModel):
    max_iterations: int = 25


@router.post("/session/{session_id}/start")
async def start_session(
    session_id: str,
    req: StartRequest,
    background_tasks: BackgroundTasks,
):
    """Launch the autonomous engine for this session."""
    session = await SessionStore.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session_id in _engines:
        raise HTTPException(status_code=409, detail="Session already running")

    workspace = session.get("workspace_path") or SandboxManager.create_workspace(session_id)

    config = EngineConfig(
        session_id=session_id,
        prd_text=session["prd_text"] or "",
        plan=session.get("plan") or {},
        answers=(session.get("config") or {}).get("answers", {}),
        max_iterations=req.max_iterations,
        workspace_path=workspace,
        context_files=(session.get("config") or {}).get("context_files", []),
        skills=(session.get("config") or {}).get("skills", []),
        mcp_servers=(session.get("config") or {}).get("mcp_servers", []),
    )

    engine = AutonomousEngine(config)
    _engines[session_id] = engine

    async def run_engine():
        try:
            await engine.run()
        finally:
            _engines.pop(session_id, None)
            _tasks.pop(session_id, None)

    task = asyncio.create_task(run_engine())
    _tasks[session_id] = task

    await SessionStore.update(session_id, status="running", max_iterations=req.max_iterations)
    return {"status": "started", "session_id": session_id}


@router.post("/session/{session_id}/pause")
async def pause_session(session_id: str):
    """Pause after current iteration completes."""
    engine = _engines.get(session_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Session not running")
    engine.pause()
    await SessionStore.update(session_id, status="paused")
    return {"status": "paused"}


@router.post("/session/{session_id}/resume")
async def resume_session(session_id: str):
    """Resume a paused session."""
    engine = _engines.get(session_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Session not running")
    engine.resume()
    await SessionStore.update(session_id, status="running")
    return {"status": "resumed"}


@router.post("/session/{session_id}/stop")
async def stop_session(session_id: str):
    """Stop the session immediately."""
    engine = _engines.get(session_id)
    if engine:
        engine.stop()
    task = _tasks.get(session_id)
    if task:
        task.cancel()
    await SessionStore.update(session_id, status="stopped")
    return {"status": "stopped"}
