# Zero Human Intervention - Autonomous Invention Builder

**Web app for non-coders to build digital inventions using AI.**

## What It Does

1. **User Input**: Describe your invention in plain English
2. **AI Analysis**: Agent analyzes requirements and designs architecture  
3. **Autonomous Build**: Generates complete working code
4. **Self-Validation**: Runs tests, fixes errors automatically
5. **Delivery**: Provides working application

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Interface                         │
│              /website/app/builder/page.tsx                   │
│   [User describes invention] → [Real-time progress display]  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route (SSE Stream)                    │
│             /website/app/api/autonomous/build                │
│   [Streams state updates] → [Phases, tasks, progress]        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Autonomous Engine Core                      │
│               /src/autonomous/engine.ts                      │
│                                                              │
│   Phase 1: Analyze → LLM analyzes requirements              │
│   Phase 2: Plan → Generates implementation tasks            │
│   Phase 3: Build → Writes code (with auto-retry on error)   │
│   Phase 4: Validate → Tests + Lints (with auto-fix)         │
│   Phase 5: Package → Documentation + Delivery               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ├─────────────┐
                      ▼             ▼
              ┌──────────────┬─────────────────┐
              │ LLM          │ File System     │
              │ Orchestrator │ Manager         │
              │ (Claude)     │ (Workspace)     │
              └──────────────┴─────────────────┘
```

## Files Created

### Backend Engine
- `src/autonomous/engine.ts` - Core autonomous loop
- `src/autonomous/llm-orchestrator.ts` - Claude integration
- `src/autonomous/file-system-manager.ts` - Code generation workspace
- `src/autonomous/types.ts` - Type definitions
- `src/autonomous/index.ts` - Exports

### Web Interface  
- `website/app/builder/page.tsx` - Main UI
- `website/app/api/autonomous/build/route.ts` - API endpoint
- `website/lib/autonomous-engine.ts` - Web adapter

## How It Works

### Autonomous Loop

```typescript
User Input
    ↓
Analyze (LLM determines architecture)
    ↓
Plan (LLM breaks down into tasks)
    ↓
Build (LLM generates code for each task)
    ├─ Auto-retry on failure (up to 5 times)
    └─ Uses LLM to fix errors
    ↓
Validate (Runs tests + linter)
    ├─ Auto-fix lint errors
    └─ Auto-fix test failures
    ↓
Package (Generate docs + deliver)
    └─ Ready-to-use application
```

### Zero Human Intervention

- **Self-Correcting**: Automatically fixes errors using LLM
- **Auto-Validation**: Runs tests and linters automatically
- **Iterative Refinement**: Retries failed tasks up to 5 times
- **Complete Generation**: No placeholders or TODOs in output

## Usage

### Start the Web App

```bash
cd website
npm install
npm run dev
```

Open `http://localhost:3000/builder`

### Example Inventions

- "A weather dashboard with 7-day forecast and location search"
- "A recipe finder app with ingredient-based search"
- "A personal budget tracker with charts"
- "A markdown note-taking app with tags"

### Environment Setup

Create `.env` in `/website`:

```bash
ANTHROPIC_API_KEY=your_key_here
```

## Key Features

✅ **No code required** - Just describe what you want
✅ **Fully autonomous** - Zero human decisions needed  
✅ **Self-validating** - Runs tests automatically
✅ **Self-correcting** - Fixes errors automatically
✅ **Real-time progress** - Watch AI build your invention
✅ **Complete delivery** - Get working application

## Technical Stack

- **Frontend**: Next.js, React, shadcn/ui
- **Backend**: Node.js API routes with SSE streaming
- **AI**: Claude Sonnet 4 (Anthropic)
- **Code Generation**: Autonomous LLM orchestration
- **Testing**: Vitest (auto-generated tests)
- **Validation**: ESLint (auto-fixed)

## Next Steps

1. Add deployment integrations (Vercel, Netlify)
2. Support multiple framework outputs (React, Vue, Svelte)
3. Add database generation (Prisma, Drizzle)
4. Enable authentication scaffolding
5. Add API generation capabilities

## Development

```bash
# Type check
bun run typecheck

# Build
bun run build

# Run web app
cd website && npm run dev
```

Built as **zero human intervention AI agent** that builds **digital inventions** for **non-coders**.
