# ABOUTME: Async SQLite session store for the Rube Goldberg platform.
# Persists agent sessions across restarts. Supports concurrent SSE subscribers
# so the live run page gets real-time event push without polling.

import asyncio
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Optional

import aiosqlite

DB_PATH = os.getenv("DB_PATH", "sessions.db")

# In-memory pub/sub: session_id -> list of asyncio.Queue
_subscribers: dict[str, list[asyncio.Queue]] = {}


class SessionStore:
    _db: Optional[aiosqlite.Connection] = None

    @classmethod
    async def initialize(cls) -> None:
        cls._db = await aiosqlite.connect(DB_PATH)
        cls._db.row_factory = aiosqlite.Row
        await cls._db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                status TEXT NOT NULL DEFAULT 'intake',
                prd_text TEXT,
                config TEXT,
                plan TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                max_iterations INTEGER DEFAULT 25,
                current_iteration INTEGER DEFAULT 0,
                workspace_path TEXT,
                result TEXT
            )
        """)
        await cls._db.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        await cls._db.commit()

    @classmethod
    async def close(cls) -> None:
        if cls._db:
            await cls._db.close()

    @classmethod
    def _now(cls) -> str:
        return datetime.now(timezone.utc).isoformat()

    # ── Session CRUD ──────────────────────────────────────────────────────────

    @classmethod
    async def create(
        cls,
        prd_text: str,
        config: dict,
        max_iterations: int = 25,
    ) -> dict:
        session_id = str(uuid.uuid4())
        now = cls._now()
        await cls._db.execute(
            """INSERT INTO sessions
               (id, status, prd_text, config, created_at, updated_at, max_iterations)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (session_id, "intake", prd_text, json.dumps(config), now, now, max_iterations),
        )
        await cls._db.commit()
        return await cls.get(session_id)

    @classmethod
    async def get(cls, session_id: str) -> Optional[dict]:
        async with cls._db.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ) as cursor:
            row = await cursor.fetchone()
        if row is None:
            return None
        d = dict(row)
        d["config"] = json.loads(d["config"]) if d["config"] else {}
        d["plan"] = json.loads(d["plan"]) if d["plan"] else None
        d["result"] = json.loads(d["result"]) if d["result"] else None
        return d

    @classmethod
    async def update(cls, session_id: str, **fields) -> None:
        fields["updated_at"] = cls._now()
        # Serialize JSON fields
        for key in ("config", "plan", "result"):
            if key in fields and not isinstance(fields[key], str):
                fields[key] = json.dumps(fields[key])
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        values = list(fields.values()) + [session_id]
        await cls._db.execute(
            f"UPDATE sessions SET {set_clause} WHERE id = ?", values
        )
        await cls._db.commit()

    # ── Event pub/sub ─────────────────────────────────────────────────────────

    @classmethod
    async def publish(cls, session_id: str, event_type: str, payload: dict) -> None:
        """Persist event and push to all SSE subscribers for this session."""
        now = cls._now()
        await cls._db.execute(
            "INSERT INTO events (session_id, event_type, payload, created_at) VALUES (?, ?, ?, ?)",
            (session_id, event_type, json.dumps(payload), now),
        )
        await cls._db.commit()

        event = {"type": event_type, "payload": payload, "timestamp": now}
        for queue in _subscribers.get(session_id, []):
            await queue.put(event)

    @classmethod
    async def subscribe(cls, session_id: str) -> AsyncGenerator[dict, None]:
        """Async generator that yields events for an SSE connection."""
        queue: asyncio.Queue = asyncio.Queue()
        _subscribers.setdefault(session_id, []).append(queue)
        try:
            # Replay recent events first (last 200)
            async with cls._db.execute(
                "SELECT event_type, payload, created_at FROM events "
                "WHERE session_id = ? ORDER BY id DESC LIMIT 200",
                (session_id,),
            ) as cursor:
                rows = list(reversed(await cursor.fetchall()))
            for row in rows:
                yield {
                    "type": row["event_type"],
                    "payload": json.loads(row["payload"]),
                    "timestamp": row["created_at"],
                    "replayed": True,
                }
            # Then stream live events
            while True:
                event = await asyncio.wait_for(queue.get(), timeout=30)
                if event is None:  # sentinel to close
                    break
                yield event
        except asyncio.TimeoutError:
            yield {"type": "heartbeat", "payload": {}, "timestamp": cls._now()}
        finally:
            subs = _subscribers.get(session_id, [])
            if queue in subs:
                subs.remove(queue)

    @classmethod
    async def close_subscribers(cls, session_id: str) -> None:
        for queue in _subscribers.get(session_id, []):
            await queue.put(None)
        _subscribers.pop(session_id, None)
