#!/usr/bin/env bash
# ABOUTME: Automated first-time sandbox setup for the Vibe Coding Platform.
# Run once to install all dependencies and configure the environment.
# No human intervention needed after this runs.

set -euo pipefail

BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

print_step() { echo -e "${CYAN}▶ $1${RESET}"; }
print_ok()   { echo -e "${GREEN}✓ $1${RESET}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${RESET}"; }
print_err()  { echo -e "${RED}✗ $1${RESET}"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║     RUBE GOLDBERG — FIRST TIME SETUP                ║${RESET}"
echo -e "${BOLD}║     Automated sandbox configuration                 ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── 1. Python check ────────────────────────────────────────────────────────────
print_step "Checking Python 3.11+..."
if ! command -v python3 &>/dev/null; then
    print_err "Python 3 not found. Install Python 3.11+ and re-run."
    exit 1
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
REQUIRED="3.11"
if python3 -c "import sys; exit(0 if sys.version_info >= (3,11) else 1)"; then
    print_ok "Python $PYTHON_VERSION found"
else
    print_err "Python $PYTHON_VERSION found but 3.11+ required"
    exit 1
fi

# ── 2. Virtual environment ─────────────────────────────────────────────────────
print_step "Setting up virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    print_ok "Created .venv"
else
    print_ok ".venv already exists"
fi

source .venv/bin/activate

# ── 3. Install Python dependencies ────────────────────────────────────────────
print_step "Installing Python dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
print_ok "Dependencies installed"

# ── 4. Environment file ────────────────────────────────────────────────────────
print_step "Configuring environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_warn ".env created from template — add your ANTHROPIC_API_KEY"
else
    print_ok ".env already exists"
fi

# ── 5. Workspace directory ─────────────────────────────────────────────────────
print_step "Creating workspace directories..."
mkdir -p workspaces
print_ok "workspaces/ ready"

# ── 6. Initialize SQLite database ─────────────────────────────────────────────
print_step "Initializing session database..."
python3 - <<'EOF'
import asyncio, aiosqlite, os
async def init():
    db_path = os.getenv("DB_PATH", "sessions.db")
    async with aiosqlite.connect(db_path) as db:
        await db.execute("""
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
        await db.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        await db.commit()
    print("Database initialized.")
asyncio.run(init())
EOF
print_ok "sessions.db ready"

# ── 7. Check for API key ───────────────────────────────────────────────────────
print_step "Checking API key..."
if grep -q "your_anthropic_api_key_here" .env 2>/dev/null; then
    print_warn "ANTHROPIC_API_KEY not set in .env — add it before running"
else
    print_ok "ANTHROPIC_API_KEY configured"
fi

echo ""
echo -e "${BOLD}${GREEN}Setup complete!${RESET}"
echo ""
echo -e "Start the server:  ${CYAN}source .venv/bin/activate && uvicorn main:app --reload${RESET}"
echo -e "Then open:         ${CYAN}http://localhost:8000${RESET}"
echo ""
