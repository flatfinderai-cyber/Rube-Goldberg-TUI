# Rube Goldberg API Documentation

## Overview

The Rube Goldberg API Server provides REST and WebSocket endpoints for remote control and monitoring of the AI coding agent. This enables frontend applications like [rube.works](https://rube.works) to interact with the execution engine.

## Starting the Server

```bash
# Start with default settings (port 3030)
rube-goldberg-tui server

# Custom port
rube-goldberg-tui server --port 8080

# Specific CORS origins
rube-goldberg-tui server --cors https://rube.works,https://example.com

# Disable CORS
rube-goldberg-tui server --no-cors
```

## Base URL

When running locally:
- HTTP: `http://localhost:3030`
- WebSocket: `ws://localhost:3030`

## CORS Configuration

By default, the server allows connections from:
- `https://rube.works`
- `https://www.rube.works`
- `https://vibe-coding-platform-jet-six.vercel.app`
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`

## REST API Endpoints

### Health Check

**GET** `/health`

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T06:00:00.000Z"
}
```

---

### Server Information

**GET** `/api/info`

Returns server information and current session status.

**Response:**
```json
{
  "name": "rube-goldberg-api",
  "version": "0.1.0",
  "status": "running" | "idle",
  "session": {
    "id": "session-abc123",
    "status": "running" | "paused" | "idle",
    "iteration": 5,
    "totalTasks": 10,
    "tasksCompleted": 3
  } | null
}
```

---

### Start Execution

**POST** `/api/execution/start`

Starts a new execution session.

**Request Body:**
```json
{
  "prdPath": "./prd.json",           // Optional: Path to PRD file
  "epicId": "my-epic-id",            // Optional: Epic ID for beads tracker
  "agent": "claude",                 // Optional: Agent plugin name
  "model": "sonnet",                 // Optional: Model name
  "tracker": "json",                 // Optional: Tracker plugin
  "iterations": 10,                  // Optional: Max iterations (0 = unlimited)
  "cwd": "/path/to/project"          // Optional: Working directory
}
```

**Response (Success):**
```json
{
  "success": true,
  "session": {
    "id": "session-abc123",
    "status": "running",
    "iteration": 0
  }
}
```

**Response (Error):**
```json
{
  "error": "Execution already in progress",
  "session": "session-abc123"
}
```

---

### Stop Execution

**POST** `/api/execution/stop`

Stops the current execution session.

**Response:**
```json
{
  "success": true,
  "message": "Execution stopped"
}
```

---

### Pause Execution

**POST** `/api/execution/pause`

Pauses the current execution.

**Response:**
```json
{
  "success": true,
  "message": "Execution paused"
}
```

---

### Resume Execution

**POST** `/api/execution/resume`

Resumes a paused execution.

**Response:**
```json
{
  "success": true,
  "message": "Execution resumed"
}
```

---

### Get Execution Status

**GET** `/api/execution/status`

Returns current execution status and engine state.

**Response (Running):**
```json
{
  "status": "running",
  "engine": {
    "status": "running" | "paused" | "idle",
    "currentIteration": 5,
    "totalTasks": 10,
    "tasksCompleted": 3,
    "currentTask": {
      "id": "TASK-001",
      "title": "Implement feature X",
      "description": "...",
      "status": "in_progress",
      "priority": 1
    },
    "iterations": [
      {
        "iteration": 1,
        "status": "completed",
        "task": { "id": "TASK-001", "title": "..." },
        "taskCompleted": true,
        "promiseComplete": true,
        "durationMs": 45000,
        "startedAt": "2026-01-27T06:00:00.000Z",
        "endedAt": "2026-01-27T06:00:45.000Z"
      }
    ]
  },
  "session": {
    "id": "session-abc123",
    "status": "running",
    "iteration": 5
  }
}
```

**Response (Idle):**
```json
{
  "status": "idle",
  "engine": null,
  "session": null
}
```

---

### Get Tasks

**GET** `/api/tasks`

Returns the current task list.

**Response:**
```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Implement feature X",
      "description": "...",
      "status": "open" | "in_progress" | "completed",
      "priority": 1,
      "created_at": "2026-01-27T06:00:00.000Z"
    }
  ],
  "currentTask": { "id": "TASK-001", "title": "..." },
  "totalTasks": 10,
  "tasksCompleted": 3
}
```

---

### Refresh Tasks

**POST** `/api/tasks/refresh`

Manually refreshes the task list from the tracker.

**Response:**
```json
{
  "success": true,
  "message": "Tasks refreshed"
}
```

---

## WebSocket API

Connect to `ws://localhost:3030` for real-time updates.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3030');

ws.onopen = () => {
  console.log('Connected to Rube Goldberg API');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Message:', message);
};
```

### Message Types

#### Server → Client

**Initial State**
Sent immediately upon connection.

```json
{
  "type": "initial-state",
  "data": {
    "status": "running" | "idle",
    "currentIteration": 5,
    "totalTasks": 10,
    "tasksCompleted": 3,
    "currentTask": { "id": "TASK-001", "title": "..." },
    "session": {
      "id": "session-abc123",
      "status": "running"
    }
  }
}
```

**Engine Events**
Real-time engine events during execution.

```json
{
  "type": "engine-event",
  "event": {
    "type": "iteration:started" | "iteration:completed" | "task:completed" | ...,
    "timestamp": "2026-01-27T06:00:00.000Z",
    // ... event-specific data
  }
}
```

Engine event types:
- `engine:started` - Execution started
- `engine:stopped` - Execution stopped
- `engine:paused` - Execution paused
- `engine:resumed` - Execution resumed
- `iteration:started` - Iteration began
- `iteration:completed` - Iteration finished
- `iteration:failed` - Iteration failed
- `task:selected` - Task selected for work
- `task:completed` - Task completed
- `agent:output` - Agent output (streaming)
- `all:complete` - All tasks completed

**Status Update**
Response to status query.

```json
{
  "type": "status",
  "data": {
    "status": "running",
    "currentIteration": 5,
    "totalTasks": 10,
    "tasksCompleted": 3,
    "currentTask": { "id": "TASK-001", "title": "..." }
  }
}
```

**Pong**
Response to ping.

```json
{
  "type": "pong",
  "data": {
    "timestamp": "2026-01-27T06:00:00.000Z"
  }
}
```

**Error**
Error message.

```json
{
  "type": "error",
  "data": {
    "message": "Error description",
    "details": "..."
  }
}
```

#### Client → Server

**Ping**
Keep-alive / connection test.

```json
{
  "type": "ping"
}
```

**Get Status**
Request current status.

```json
{
  "type": "get-status"
}
```

---

## Frontend Integration Examples

### React/TypeScript Example

```typescript
import { useEffect, useState } from 'react';

interface ExecutionStatus {
  status: 'running' | 'idle';
  currentIteration: number;
  totalTasks: number;
  tasksCompleted: number;
}

function RubeGoldbergDashboard() {
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket('ws://localhost:3030');
    
    websocket.onopen = () => {
      console.log('Connected to Rube Goldberg');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'initial-state') {
        setStatus(message.data);
      } else if (message.type === 'engine-event') {
        // Handle real-time updates
        console.log('Engine event:', message.event);
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const startExecution = async () => {
    const response = await fetch('http://localhost:3030/api/execution/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prdPath: './prd.json',
        iterations: 10
      })
    });
    
    const data = await response.json();
    console.log('Started:', data);
  };

  const stopExecution = async () => {
    await fetch('http://localhost:3030/api/execution/stop', {
      method: 'POST'
    });
  };

  return (
    <div>
      <h1>Rube Goldberg Control Panel</h1>
      {status && (
        <div>
          <p>Status: {status.status}</p>
          <p>Iteration: {status.currentIteration}</p>
          <p>Tasks: {status.tasksCompleted} / {status.totalTasks}</p>
        </div>
      )}
      <button onClick={startExecution}>Start</button>
      <button onClick={stopExecution}>Stop</button>
    </div>
  );
}
```

### JavaScript/Fetch Example

```javascript
// Start execution
async function startExecution() {
  const response = await fetch('http://localhost:3030/api/execution/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prdPath: './prd.json',
      agent: 'claude',
      model: 'sonnet',
      iterations: 0 // unlimited
    })
  });

  const data = await response.json();
  console.log('Session started:', data.session);
}

// Monitor with WebSocket
const ws = new WebSocket('ws://localhost:3030');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'engine-event') {
    const { type, timestamp } = message.event;
    
    switch (type) {
      case 'iteration:completed':
        console.log('Iteration completed:', message.event.result);
        break;
      
      case 'task:completed':
        console.log('Task completed:', message.event.task.title);
        break;
        
      case 'agent:output':
        console.log('Agent output:', message.event.data);
        break;
    }
  }
};

// Get current status
async function getStatus() {
  const response = await fetch('http://localhost:3030/api/execution/status');
  const data = await response.json();
  return data;
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Invalid request or operation not allowed
- `500 Internal Server Error` - Server error

Error responses include:
```json
{
  "error": "Error description",
  "details": "Additional context"
}
```

---

## Authentication (Future)

Authentication is currently disabled but can be enabled with `--enable-auth` flag. This is a placeholder for future authentication implementation where pricing and user management will be added.

---

## Rate Limiting

No rate limiting is currently implemented. Consider adding this when deploying to production.

---

## Security Considerations

When deploying to production:

1. **Use HTTPS/WSS** - Enable TLS for encrypted connections
2. **Configure CORS** - Restrict origins to your frontend domain
3. **Add Authentication** - Implement API keys or OAuth
4. **Add Rate Limiting** - Prevent abuse
5. **Firewall Rules** - Restrict access to trusted networks
6. **Environment Variables** - Store sensitive config in env vars

---

## Deployment

### Local Development

```bash
rube-goldberg-tui server
```

### Docker

```dockerfile
FROM oven/bun:1.2

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

RUN bun run build

EXPOSE 3030

CMD ["bun", "dist/cli.js", "server"]
```

### Systemd Service

```ini
[Unit]
Description=Rube Goldberg API Server
After=network.target

[Service]
Type=simple
User=rube
WorkingDirectory=/opt/rube-goldberg
ExecStart=/usr/local/bin/rube-goldberg-tui server --port 3030
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/flatfinderai-cyber/Rube-Goldberg-TUI/issues
- Frontend: https://rube.works
