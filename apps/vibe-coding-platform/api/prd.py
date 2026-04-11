# ABOUTME: PRD processing API routes.
# POST /api/prd/clarify — generate clarifying questions for a PRD
# POST /api/prd/plan    — generate implementation plan from PRD + answers

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.prd_processor import PRDProcessor
from core.session_store import SessionStore

router = APIRouter()
_processor = PRDProcessor()


class ClarifyRequest(BaseModel):
    prd_text: str


class PlanRequest(BaseModel):
    session_id: str
    prd_text: str
    answers: dict[str, str]
    skills: list[str] = []
    mcp_servers: list[str] = []


@router.post("/prd/clarify")
async def clarify(req: ClarifyRequest):
    """Generate targeted clarifying questions for the given PRD."""
    if not req.prd_text.strip():
        raise HTTPException(status_code=400, detail="prd_text is required")
    questions = await _processor.generate_questions(req.prd_text)
    return {"questions": questions}


@router.post("/prd/plan")
async def generate_plan(req: PlanRequest):
    """Generate implementation plan and save it to the session."""
    plan = await _processor.generate_plan(
        prd_text=req.prd_text,
        answers=req.answers,
        skills=req.skills,
        mcp_servers=req.mcp_servers,
    )
    # Persist plan to session
    if req.session_id:
        await SessionStore.update(
            req.session_id,
            plan=plan,
            status="ready",
        )
    return {"plan": plan}
