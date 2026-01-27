# Rube Goldberg Web Platform

[![npm version](https://img.shields.io/npm/v/rube-goldberg-tui.svg)](https://www.npmjs.com/package/rube-goldberg-tui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-000000.svg)](https://nextjs.org)

**AI Agent Loop Orchestrator** - A web platform for orchestrating AI coding agents to work through task lists autonomously.

Rube Goldberg connects your AI coding assistant (Claude Code, OpenCode, GitHub Copilot) to your task tracker (Beads, GitHub Issues) and runs them in an autonomous loop, completing tasks one-by-one with intelligent selection, error handling, and full real-time visibility.

![Rube Goldberg Web Platform Screenshot](docs/images/rube-goldberg-web.png)

## Quick Start

### Web Platform (Recommended)

```bash
# Clone and setup
git clone https://github.com/flatfinderai-cyber/Rube-Goldberg-TUI.git
cd Rube-Goldberg-TUI/apps/vibe-coding-platform

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start the web app
npm run dev
```

Open `http://localhost:3000` and start orchestrating AI agents through your browser!

### CLI (Legacy)

```bash
# Install CLI
npm install -g rube-goldberg-tui

# Setup your project
cd your-project
rube-goldberg-tui setup

# Run Rube Goldberg
rube-goldberg-tui run --prd ./prd.json
```

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI components and hooks
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Monaco Editor** - Code viewing and editing

### Backend
- **Node.js** - Runtime environment
- **PostgreSQL** - Primary database (via Drizzle ORM)
- **Vercel Sandbox** - Isolated execution environments
- **Server-Sent Events (SSE)** - Real-time streaming

### AI & Agents
- **Claude Code** - Anthropic's AI coding assistant
- **GitHub Copilot CLI** - GitHub's AI pair programmer
- **OpenCode** - Open-source coding agent
- **Custom Agent SDK** - Build your own integrations

### Infrastructure
- **Vercel** - Hosting and deployment
- **GitHub Actions** - CI/CD pipeline
- **Docker** - Containerization (optional)

## Documentation

**[rube-goldberg-tui.com](https://rube-goldberg-tui.com)** - Full documentation, guides, and examples.

### Quick Links

- **[Web Platform Guide](https://rube-goldberg-tui.com/docs/getting-started/web-platform)** - Complete web setup
- **[Quick Start Guide](https://rube-goldberg-tui.com/docs/getting-started/quick-start)** - Get running in 2 minutes
- **[API Reference](https://rube-goldberg-tui.com/docs/api/overview)** - REST and SSE endpoints
- **[Agent Plugins](https://rube-goldberg-tui.com/docs/agents/overview)** - Integrate custom AI agents
- **[Configuration](https://rube-goldberg-tui.com/docs/configuration/overview)** - Customize for your workflow
- **[Deployment](https://rube-goldberg-tui.com/docs/deployment/overview)** - Deploy to production
- **[Troubleshooting](https://rube-goldberg-tui.com/docs/troubleshooting/common-issues)** - Common issues and solutions

## Features

### 🌐 Web Interface
- **Real-time Dashboard**: Watch agents work through tasks with live streaming output
- **Task Management**: Create, prioritize, and track tasks through an intuitive UI
- **Visual Progress**: See iteration counts, success rates, and agent status at a glance
- **File Browser**: Inspect generated code changes in an integrated file viewer
- **Multi-Agent Support**: Switch between Claude Code, Copilot, OpenCode, and more

### 🤖 Autonomous Execution
- **Smart Task Selection**: Automatically picks the next best task based on priority and dependencies
- **Error Recovery**: Configurable retry strategies with automatic error handling
- **Rate Limit Management**: Automatic fallback to alternative agents when limits hit
- **Crash Recovery**: Resume interrupted sessions without losing progress
- **Parallel Subagents**: Track and visualize nested agent executions

### 🔌 Integrations
- **Task Trackers**: Beads, GitHub Issues, Linear, Jira (coming soon)
- **AI Agents**: Claude Code, GitHub Copilot CLI, OpenCode, Cursor, Google Gemini
- **Version Control**: Automatic git operations and branch management
- **Sandboxes**: Vercel Sandbox integration for isolated execution

### 📊 Analytics & Logging
- **Execution Logs**: Complete history of all iterations with searchable output
- **Performance Metrics**: Track completion rates, average iteration time, agent usage
- **Export Options**: Download logs in JSON or plain text format
- **Session Recovery**: Resume from any point with full context restoration

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         WEB DASHBOARD                           │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │  1. SELECT   │────▶│  2. BUILD    │────▶│  3. EXECUTE  │   │
│   │    TASK      │     │    PROMPT    │     │    AGENT     │   │
│   └──────────────┘     └──────────────┘     └──────────────┘   │
│          ▲                                         │            │
│          │                                         ▼            │
│   ┌──────────────┐                         ┌──────────────┐    │
│   │  5. NEXT     │◀────────────────────────│  4. DETECT   │    │
│   │    TASK      │                         │  COMPLETION  │    │
│   └──────────────┘                         └──────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Rube Goldberg selects the highest-priority task, builds a prompt, executes your AI agent, detects completion, and repeats until all tasks are done.

## Features

- **Task Trackers**: prd.json (simple), Beads (git-backed with dependencies)
- **AI Agents**: Claude Code, OpenCode
- **Session Persistence**: Pause anytime, resume later, survive crashes
- **Real-time TUI**: Watch agent output, control execution with keyboard shortcuts
- **Subagent Tracing**: See nested agent calls in real-time
- **Cross-iteration Context**: Automatic progress tracking between tasks

## CLI Commands

| Command | Description |
|---------|-------------|
| `rube-goldberg-tui` | Launch the interactive TUI |
| `rube-goldberg-tui run [options]` | Start Rube Goldberg execution |
| `rube-goldberg-tui resume` | Resume an interrupted session |
| `rube-goldberg-tui status` | Check session status |
| `rube-goldberg-tui logs` | View iteration output logs |
| `rube-goldberg-tui setup` | Run interactive project setup |
| `rube-goldberg-tui create-prd` | Create a new PRD interactively |
| `rube-goldberg-tui convert` | Convert PRD to tracker format |
| `rube-goldberg-tui config show` | Display merged configuration |
| `rube-goldberg-tui template show` | Display current prompt template |
| `rube-goldberg-tui plugins agents` | List available agent plugins |
| `rube-goldberg-tui plugins trackers` | List available tracker plugins |

### Common Options

```bash
# Run with a PRD file
rube-goldberg-tui run --prd ./prd.json

# Run with a Beads epic
rube-goldberg-tui run --epic my-epic-id

# Override agent or model
rube-goldberg-tui run --agent claude --model sonnet
rube-goldberg-tui run --agent opencode --model anthropic/claude-3-5-sonnet

# Limit iterations
rube-goldberg-tui run --iterations 5

# Run headless (no TUI)
rube-goldberg-tui run --headless
```

### Create PRD Options

```bash
# Create a PRD with AI assistance (default chat mode)
rube-goldberg-tui create-prd
rube-goldberg-tui prime  # Alias

# Use a custom PRD skill from skills_dir
rube-goldberg-tui create-prd --prd-skill my-custom-skill

# Override agent
rube-goldberg-tui create-prd --agent claude

# Output to custom directory
rube-goldberg-tui create-prd --output ./docs
```

### TUI Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `s` | Start execution |
| `p` | Pause/Resume |
| `d` | Toggle dashboard |
| `i` | Toggle iteration history |
| `u` | Toggle subagent tracing |
| `q` | Quit |
| `?` | Show help |

See the [full CLI reference](https://rube-goldberg-tui.com/docs/cli/overview) for all options.

### Custom Skills Directory

You can configure a custom `skills_dir` in your config file to use custom PRD skills:

```bash
# In .rube-goldberg-tui/config.toml or ~/.config/rube-goldberg-tui/config.toml
skills_dir = "/path/to/my-skills"

# Then use custom skills
rube-goldberg-tui create-prd --prd-skill my-custom-skill
```

Skills must be folders inside `skills_dir` containing a `SKILL.md` file.

## Contributing

### Development Setup

```bash
git clone https://github.com/subsy/rube-goldberg-tui.git
cd rube-goldberg-tui
bun install
bun run dev
```

### Build & Test

```bash
bun run build       # Build the project
bun run typecheck   # Type check (no emit)
bun run lint        # Run linter
bun run lint:fix    # Auto-fix lint issues
```

### Project Structure

```
rube-goldberg-tui/
├── src/
│   ├── cli.tsx           # CLI entry point
│   ├── commands/         # CLI commands (run, resume, status, logs, etc.)
│   ├── config/           # Configuration loading and validation (Zod schemas)
│   ├── engine/           # Execution engine (iteration loop, events)
│   ├── interruption/     # Signal handling and graceful shutdown
│   ├── logs/             # Iteration log persistence
│   ├── plugins/
│   │   ├── agents/       # Agent plugins (claude, opencode)
│   │   │   └── tracing/  # Subagent tracing parser
│   │   └── trackers/     # Tracker plugins (beads, beads-bv, json)
│   ├── session/          # Session persistence and lock management
│   ├── setup/            # Interactive setup wizard
│   ├── templates/        # Handlebars prompt templates
│   ├── chat/             # AI chat mode for PRD creation
│   ├── prd/              # PRD generation and parsing
│   └── tui/              # Terminal UI components (OpenTUI/React)
│       └── components/   # React components
├── skills/               # Bundled skills for PRD/task creation
│   ├── rube-goldberg-tui-prd/
│   ├── rube-goldberg-tui-create-json/
│   └── rube-goldberg-tui-create-beads/
├── website/              # Documentation website (Next.js)
└── docs/                 # Images and static assets
```

### Key Technologies

- [Bun](https://bun.sh) - JavaScript runtime
- [OpenTUI](https://github.com/anomalyco/opentui) - Terminal UI framework
- [React](https://react.dev) - Component model for TUI
- [Handlebars](https://handlebarsjs.com) - Prompt templating
- [Zod](https://zod.dev) - Configuration validation

