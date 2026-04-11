# ABOUTME: Session CRUD API routes.
# POST /api/session/create — creates session from PRD + config
# GET  /api/session/{id}  — returns current session state

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import json

from core.session_store import SessionStore
from core.sandbox_manager import SandboxManager

router = APIRouter()


@router.post("/session/create")
async def create_session(
    prd_text: str = Form(...),
    max_iterations: int = Form(25),
    skills: str = Form("[]"),
    mcp_servers: str = Form("[]"),
    context_files: str = Form("[]"),
):
    """Create a new session from PRD text and configuration."""
    config = {
        "skills": json.loads(skills),
        "mcp_servers": json.loads(mcp_servers),
        "context_files": json.loads(context_files),
    }
    session = await SessionStore.create(
        prd_text=prd_text,
        config=config,
        max_iterations=max_iterations,
    )
    # Create workspace
    workspace = SandboxManager.create_workspace(session["id"])
    await SessionStore.update(session["id"], workspace_path=workspace)
    return {"session_id": session["id"], "status": session["status"]}


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get current session state."""
    session = await SessionStore.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    # Don't send full file contents over this endpoint
    if session.get("result") and "files" in (session["result"] or {}):
        session["result"]["files"] = [
            {"path": f["path"]} for f in session["result"]["files"]
        ]
    return session


@router.get("/session/{session_id}/files")
async def get_session_files(session_id: str):
    """Get list of all generated files for a completed session."""
    session = await SessionStore.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    result = session.get("result") or {}
    return {"files": result.get("files", [])}


@router.get("/session/{session_id}/file")
async def get_file_content(session_id: str, path: str):
    """Get content of a specific generated file."""
    from core.file_manager import FileManager
    from core.sandbox_manager import SandboxManager

    session = await SessionStore.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    workspace = session.get("workspace_path") or SandboxManager.get_workspace(session_id)
    fm = FileManager(workspace)
    content = await fm.read_file(path)
    return {"path": path, "content": content}


@router.get("/session/{session_id}/download")
async def download_workspace(session_id: str):
    """Download the entire workspace as a ZIP file."""
    import tempfile
    import os
    from fastapi.responses import FileResponse
    from core.file_manager import FileManager
    from core.sandbox_manager import SandboxManager

    session = await SessionStore.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    workspace = session.get("workspace_path") or SandboxManager.get_workspace(session_id)
    fm = FileManager(workspace)

    tmp = tempfile.mktemp(suffix="")
    zip_path = await fm.make_zip(tmp)

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=f"rube-goldberg-build-{session_id[:8]}.zip",
    )
