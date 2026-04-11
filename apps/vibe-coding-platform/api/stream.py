# ABOUTME: SSE streaming endpoint for real-time agent event delivery.
# GET /api/session/{id}/stream — long-lived SSE connection that pushes
# all engine events (phase changes, output chunks, iteration ticks) to the browser.
# Supports reconnection: replays recent events for new connections.

import json
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from core.session_store import SessionStore

router = APIRouter()


@router.get("/session/{session_id}/stream")
async def stream_session(session_id: str, request: Request):
    """
    Server-Sent Events endpoint.
    Replays recent events then streams live ones indefinitely.
    Browser reconnects automatically on disconnect.
    """
    async def generator():
        async for event in SessionStore.subscribe(session_id):
            if await request.is_disconnected():
                break
            yield {
                "event": event["type"],
                "data": json.dumps(event["payload"]),
            }

    return EventSourceResponse(
        generator(),
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
