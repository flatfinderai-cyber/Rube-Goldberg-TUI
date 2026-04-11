# ABOUTME: FastAPI application entry point for the Rube Goldberg Vibe Coding Platform.
# Mounts all API routers, serves Jinja2 templates, and handles static files.
# Python backend — zero Node.js dependency.

import os
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

load_dotenv()

from api.session import router as session_router
from api.prd import router as prd_router
from api.stream import router as stream_router
from api.control import router as control_router
from core.session_store import SessionStore

BASE_DIR = Path(__file__).parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup, clean up on shutdown."""
    await SessionStore.initialize()
    yield
    await SessionStore.close()


app = FastAPI(
    title="Rube Goldberg — Vibe Coding Platform",
    description="Autonomous AI coding agent. Set it. Walk away. It builds.",
    version="1.0.0",
    lifespan=lifespan,
)

# Static files
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

# Templates
templates = Jinja2Templates(directory=BASE_DIR / "templates")

# API routers
app.include_router(session_router, prefix="/api")
app.include_router(prd_router, prefix="/api")
app.include_router(stream_router, prefix="/api")
app.include_router(control_router, prefix="/api")


# ── Page routes ────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def intake_page(request: Request):
    """Intake wizard — PRD upload, clarifying questions, plan + launch."""
    return templates.TemplateResponse("intake.html", {"request": request})


@app.get("/run/{session_id}", response_class=HTMLResponse)
async def run_page(request: Request, session_id: str):
    """Live execution dashboard — Rube Goldberg machine + SSE output."""
    return templates.TemplateResponse("run.html", {
        "request": request,
        "session_id": session_id,
    })


@app.get("/results/{session_id}", response_class=HTMLResponse)
async def results_page(request: Request, session_id: str):
    """Results page — generated files, docs, download."""
    return templates.TemplateResponse("results.html", {
        "request": request,
        "session_id": session_id,
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("DEBUG", "false").lower() == "true",
    )
