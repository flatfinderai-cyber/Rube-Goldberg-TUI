# Agent Instructions

This file provides guidance to Claude Code AI coding agents working in the Rube Goldberg TUI codebase.

## Project Overview

**Rube Goldberg TUI** is an AI Agent Loop Orchestrator - a terminal UI and web platform for orchestrating AI coding agents (Claude Code, OpenCode, GitHub Copilot) to work through task lists autonomously.

**Key concepts:**
- **Agents**: AI coding assistants that execute tasks (see `src/plugins/agents/`)
- **Trackers**: Task/issue backends like Beads, JSON PRDs (see `src/plugins/trackers/`)
- **Engine**: The iteration loop that selects tasks, executes agents, and detects completion
- **TUI**: React-based terminal interface using OpenTUI framework

## Critical Coding Rules

1. **Code Quality**
   - Prioritize simple, clean, and maintainable solutions over clever or complex ones.
   - Make the smallest reasonable changes to achieve the desired outcome.
   - Never make unrelated code changes; document issues for later instead.
   - Preserve code comments unless you can prove they are actively false.
   - Start all code files with a file-level JSDoc comment section explaining the file's purpose, prefixed with "ABOUTME: ".
   - Avoid temporal context in comments; make them evergreen.

2. **Avoiding Entropy**
   - This codebase will outlive you. Every shortcut you take becomes someone else's burden. Every hack compounds into technical debt that slows the whole team down.
   - You are not just writing code. You are shaping the future of this project. The patterns you establish will be copied. The corners you cut will be cut again.
   - Fight entropy. Leave the codebase better than you found it.

## Project Architecture

```
src/
├── cli.tsx              # CLI entry point
├── index.ts             # Library exports
├── commands/            # CLI commands (run, resume, status, logs, setup, etc.)
├── config/              # Configuration loading and Zod validation schemas
├── engine/              # Execution engine (iteration loop, rate limiting)
├── autonomous/          # Autonomous execution mode with LLM orchestration
├── chat/                # AI chat mode for PRD creation
├── prd/                 # PRD generation and parsing
├── interruption/        # Signal handling and graceful shutdown
├── logs/                # Iteration log persistence and structured logging
├── session/             # Session persistence and lock management
├── setup/               # Interactive setup wizard
├── templates/           # Handlebars prompt templates
├── plugins/
│   ├── agents/          # Agent plugins (claude, opencode)
│   │   ├── builtin/     # Built-in agent implementations
│   │   └── tracing/     # Subagent tracing parser
│   └── trackers/        # Tracker plugins (beads, beads-bv, json)
│       └── builtin/     # Built-in tracker implementations
└── tui/                 # Terminal UI (OpenTUI/React)
    └── components/      # React TUI components

website/                 # Documentation website (Next.js)
skills/                  # Bundled skills for PRD/task creation
```

## Codebase Conventions

**TypeScript:**
- Strict mode enabled with all strict checks
- Use Zod for runtime validation (see `src/config/schema.ts`)
- Prefer `type` over `interface` for consistency
- Export types from `types.ts` files in each module

**React/TUI Components:**
- Uses OpenTUI framework with React 19 (`@opentui/react`)
- JSX configured with `jsxImportSource: "@opentui/react"`
- Components go in `src/tui/components/`
- Use functional components with hooks

**Plugin Architecture:**
- Agents implement `AgentPlugin` interface (see `src/plugins/agents/base.ts`)
- Trackers implement `TrackerPlugin` interface (see `src/plugins/trackers/base.ts`)
- Register plugins in respective `registry.ts` files
- Built-in plugins go in `builtin/` subdirectories

**Module Organization:**
- Each major feature has its own directory with `index.ts` barrel export
- Types defined in `types.ts` within each module
- Keep related functionality co-located

## Build Instructions

This project uses **bun** as its package manager and runtime.

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Type check (no emit)
bun run typecheck

# Lint
bun run lint
bun run lint:fix    # Auto-fix lint issues

# Run in development mode
bun run dev

# Clean build artifacts
bun run clean
```

**After making code changes**, always run:
```bash
bun run typecheck && bun run build
```

### Website (Documentation)

The `website/` directory contains a Next.js documentation site:

```bash
# Development
bun run website:dev

# Build
bun run website:build

# Lint
bun run website:lint
```

## Issue Tracking with Beads

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

### Using bv as an AI sidecar

bv is a graph-aware triage engine for Beads projects (.beads/beads.jsonl). Instead of parsing JSONL or hallucinating graph traversal, use robot flags for deterministic, dependency-aware outputs with precomputed metrics (PageRank, betweenness, critical path, cycles, HITS, eigenvector, k-core).

**Scope boundary:** bv handles *what to work on* (triage, priority, planning). For agent-to-agent coordination (messaging, work claiming, file reservations), use [MCP Agent Mail](https://github.com/Dicklesworthstone/mcp_agent_mail).

**⚠️ CRITICAL: Use ONLY `--robot-*` flags. Bare `bv` launches an interactive TUI that blocks your session.**

#### The Workflow: Start With Triage

**`bv --robot-triage` is your single entry point.** It returns everything you need in one call:
- `quick_ref`: at-a-glance counts + top 3 picks
- `recommendations`: ranked actionable items with scores, reasons, unblock info
- `quick_wins`: low-effort high-impact items
- `blockers_to_clear`: items that unblock the most downstream work
- `project_health`: status/type/priority distributions, graph metrics
- `commands`: copy-paste shell commands for next steps

bv --robot-triage        # THE MEGA-COMMAND: start here
bv --robot-next          # Minimal: just the single top pick + claim command

#### Other Commands

**Planning:**
| Command | Returns |
|---------|---------|
| `--robot-plan` | Parallel execution tracks with `unblocks` lists |
| `--robot-priority` | Priority misalignment detection with confidence |

**Graph Analysis:**
| Command | Returns |
|---------|---------|
| `--robot-insights` | Full metrics: PageRank, betweenness, HITS (hubs/authorities), eigenvector, critical path, cycles, k-core, articulation points, slack |
| `--robot-label-health` | Per-label health: `health_level` (healthy\|warning\|critical), `velocity_score`, `staleness`, `blocked_count` |
| `--robot-label-flow` | Cross-label dependency: `flow_matrix`, `dependencies`, `bottleneck_labels` |
| `--robot-label-attention [--attention-limit=N]` | Attention-ranked labels by: (pagerank × staleness × block_impact) / velocity |

**History & Change Tracking:**
| Command | Returns |
|---------|---------|
| `--robot-history` | Bead-to-commit correlations: `stats`, `histories` (per-bead events/commits/milestones), `commit_index` |
| `--robot-diff --diff-since <ref>` | Changes since ref: new/closed/modified issues, cycles introduced/resolved |

**Other Commands:**
| Command | Returns |
|---------|---------|
| `--robot-burndown <sprint>` | Sprint burndown, scope changes, at-risk items |
| `--robot-forecast <id\|all>` | ETA predictions with dependency-aware scheduling |
| `--robot-alerts` | Stale issues, blocking cascades, priority mismatches |
| `--robot-suggest` | Hygiene: duplicates, missing deps, label suggestions, cycle breaks |
| `--robot-graph [--graph-format=json\|dot\|mermaid]` | Dependency graph export |
| `--export-graph <file.html>` | Self-contained interactive HTML visualization |

#### Scoping & Filtering

bv --robot-plan --label backend              # Scope to label's subgraph
bv --robot-insights --as-of HEAD~30          # Historical point-in-time
bv --recipe actionable --robot-plan          # Pre-filter: ready to work (no blockers)
bv --recipe high-impact --robot-triage       # Pre-filter: top PageRank scores
bv --robot-triage --robot-triage-by-track    # Group by parallel work streams
bv --robot-triage --robot-triage-by-label    # Group by domain

#### Understanding Robot Output

**All robot JSON includes:**
- `data_hash` — Fingerprint of source beads.jsonl (verify consistency across calls)
- `status` — Per-metric state: `computed|approx|timeout|skipped` + elapsed ms
- `as_of` / `as_of_commit` — Present when using `--as-of`; contains ref and resolved SHA

**Two-phase analysis:**
- **Phase 1 (instant):** degree, topo sort, density — always available immediately
- **Phase 2 (async, 500ms timeout):** PageRank, betweenness, HITS, eigenvector, cycles — check `status` flags

**For large graphs (>500 nodes):** Some metrics may be approximated or skipped. Always check `status`.

#### jq Quick Reference

bv --robot-triage | jq '.quick_ref'                        # At-a-glance summary
bv --robot-triage | jq '.recommendations[0]'               # Top recommendation
bv --robot-plan | jq '.plan.summary.highest_impact'        # Best unblock target
bv --robot-insights | jq '.status'                         # Check metric readiness
bv --robot-insights | jq '.Cycles'                         # Circular deps (must fix!)
bv --robot-label-health | jq '.results.labels[] | select(.health_level == "critical")'

**Performance:** Phase 1 instant, Phase 2 async (500ms timeout). Prefer `--robot-plan` over `--robot-insights` when speed matters. Results cached by data hash.

Use bv instead of parsing beads.jsonl—it computes PageRank, critical paths, cycles, and parallel tracks deterministically.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
