# Quick Start Guide for Frontend Integration

## Overview

This guide helps you integrate the Rube Goldberg AI Agent with your frontend at [rube.works](https://rube.works).

## Prerequisites

- Node.js 18+ or Bun 1.0+
- rube-goldberg-tui installed

## Installation

```bash
# Install globally
npm install -g rube-goldberg-tui

# Or install locally
npm install rube-goldberg-tui
```

## Start the API Server

```bash
# Start with defaults (port 3030, CORS enabled for rube.works)
rube-goldberg-tui server

# Custom port
rube-goldberg-tui server --port 8080
```

You should see:
```
╔════════════════════════════════════════════════════════════════╗
║  Rube Goldberg API Server Started                             ║
╠════════════════════════════════════════════════════════════════╣
║  HTTP API:       http://localhost:3030                         ║
║  WebSocket:      ws://localhost:3030                           ║
║  Health Check:   http://localhost:3030/health                  ║
║  API Docs:       http://localhost:3030/api/info                ║
╠════════════════════════════════════════════════════════════════╣
║  Frontend:       https://rube.works                            ║
║  CORS:           Configured for rube.works                     ║
╚════════════════════════════════════════════════════════════════╝
```

## Frontend Integration

### 1. Health Check

First, verify the server is running:

```javascript
const response = await fetch('http://localhost:3030/health');
const data = await response.json();
console.log(data); // { status: 'ok', timestamp: '...' }
```

### 2. Connect WebSocket

Establish WebSocket connection for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3030');

ws.onopen = () => {
  console.log('Connected to Rube Goldberg');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'initial-state':
      // Received current state on connection
      console.log('Initial state:', message.data);
      break;
      
    case 'engine-event':
      // Real-time engine events
      handleEngineEvent(message.event);
      break;
  }
};
```

### 3. Start Execution

```javascript
async function startExecution(config) {
  const response = await fetch('http://localhost:3030/api/execution/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prdPath: config.prdPath,     // e.g., './prd.json'
      epicId: config.epicId,        // e.g., 'my-epic-id' (for beads)
      agent: config.agent || 'claude',
      model: config.model || 'sonnet',
      tracker: config.tracker || 'json',
      iterations: config.iterations || 0,  // 0 = unlimited
      cwd: config.cwd || process.cwd()
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Started session:', data.session.id);
  } else {
    console.error('Failed to start:', data.error);
  }
}
```

### 4. Monitor Progress

```javascript
function handleEngineEvent(event) {
  switch (event.type) {
    case 'engine:started':
      console.log(`Started with ${event.totalTasks} tasks`);
      break;
      
    case 'iteration:started':
      console.log(`Working on: ${event.task.title}`);
      break;
      
    case 'iteration:completed':
      const result = event.result;
      console.log(`Completed iteration ${result.iteration}`);
      console.log(`Duration: ${result.durationMs}ms`);
      console.log(`Task completed: ${result.taskCompleted}`);
      break;
      
    case 'task:completed':
      console.log(`✓ Task done: ${event.task.title}`);
      break;
      
    case 'all:complete':
      console.log(`🎉 All ${event.totalCompleted} tasks complete!`);
      break;
      
    case 'agent:output':
      // Real-time agent output (stdout/stderr)
      console.log(`[${event.stream}] ${event.data}`);
      break;
  }
}
```

### 5. Control Execution

```javascript
// Pause
await fetch('http://localhost:3030/api/execution/pause', {
  method: 'POST'
});

// Resume
await fetch('http://localhost:3030/api/execution/resume', {
  method: 'POST'
});

// Stop
await fetch('http://localhost:3030/api/execution/stop', {
  method: 'POST'
});
```

### 6. Get Status

```javascript
async function getStatus() {
  const response = await fetch('http://localhost:3030/api/execution/status');
  const data = await response.json();
  
  if (data.status === 'running') {
    console.log(`Iteration ${data.engine.currentIteration}`);
    console.log(`Tasks: ${data.engine.tasksCompleted} / ${data.engine.totalTasks}`);
    console.log(`Current: ${data.engine.currentTask?.title}`);
  }
  
  return data;
}
```

### 7. Get Tasks

```javascript
async function getTasks() {
  const response = await fetch('http://localhost:3030/api/tasks');
  const data = await response.json();
  
  data.tasks.forEach(task => {
    console.log(`${task.id}: ${task.title} [${task.status}]`);
  });
  
  return data.tasks;
}
```

## Complete Example (React + TypeScript)

```typescript
import { useEffect, useState, useCallback } from 'react';

interface ExecutionState {
  status: 'idle' | 'running' | 'paused';
  currentIteration: number;
  totalTasks: number;
  tasksCompleted: number;
  currentTask?: {
    id: string;
    title: string;
  };
}

const API_URL = 'http://localhost:3030';
const WS_URL = 'ws://localhost:3030';

export function RubeGoldbergDashboard() {
  const [state, setState] = useState<ExecutionState>({
    status: 'idle',
    currentIteration: 0,
    totalTasks: 0,
    tasksCompleted: 0,
  });
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Connect WebSocket
  useEffect(() => {
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('Connected to Rube Goldberg');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'initial-state') {
        setState(message.data);
      } else if (message.type === 'engine-event') {
        handleEngineEvent(message.event);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const handleEngineEvent = useCallback((event: any) => {
    // Update state based on events
    if (event.type === 'iteration:started') {
      setState(prev => ({
        ...prev,
        currentIteration: event.iteration,
        currentTask: event.task,
      }));
    } else if (event.type === 'task:completed') {
      setState(prev => ({
        ...prev,
        tasksCompleted: prev.tasksCompleted + 1,
      }));
    }
  }, []);

  const startExecution = async () => {
    const response = await fetch(`${API_URL}/api/execution/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prdPath: './prd.json',
        iterations: 0,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      alert('Failed to start: ' + data.error);
    }
  };

  const stopExecution = async () => {
    await fetch(`${API_URL}/api/execution/stop`, { method: 'POST' });
  };

  return (
    <div className="dashboard">
      <h1>Rube Goldberg Control Panel</h1>

      <div className="status">
        <div>Status: {state.status}</div>
        <div>Iteration: {state.currentIteration}</div>
        <div>Tasks: {state.tasksCompleted} / {state.totalTasks}</div>
        {state.currentTask && (
          <div>Current: {state.currentTask.title}</div>
        )}
      </div>

      <div className="controls">
        <button onClick={startExecution} disabled={state.status === 'running'}>
          Start
        </button>
        <button onClick={stopExecution} disabled={state.status !== 'running'}>
          Stop
        </button>
      </div>
    </div>
  );
}
```

## Testing

Test the API locally using the demo page:

```bash
# Start the server
rube-goldberg-tui server

# Open the demo in your browser
open docs/api-demo.html
```

Or test with curl:

```bash
# Health check
curl http://localhost:3030/health

# Get info
curl http://localhost:3030/api/info

# Start execution
curl -X POST http://localhost:3030/api/execution/start \
  -H "Content-Type: application/json" \
  -d '{"prdPath": "./prd.json", "iterations": 5}'

# Get status
curl http://localhost:3030/api/execution/status

# Stop
curl -X POST http://localhost:3030/api/execution/stop
```

## Production Deployment

For production deployment:

1. **Use HTTPS/WSS**: Enable TLS for encrypted connections
2. **Configure CORS**: Restrict to your domain only
3. **Add Authentication**: Implement API keys or OAuth
4. **Environment Variables**: Store config in env vars
5. **Process Manager**: Use PM2 or systemd to keep server running
6. **Monitoring**: Add logging and health checks

Example with environment variables:

```bash
# .env
PORT=3030
CORS_ORIGINS=https://rube.works
ENABLE_AUTH=true
API_KEY=your-secret-key

# Start
rube-goldberg-tui server --port $PORT --cors $CORS_ORIGINS
```

## Troubleshooting

**Connection refused:**
- Ensure server is running: `curl http://localhost:3030/health`
- Check firewall rules
- Verify correct port

**CORS errors:**
- Server is pre-configured for rube.works
- For local dev, origins like localhost:3000 are allowed
- For custom origins, use `--cors` flag

**WebSocket disconnects:**
- Implement reconnection logic in frontend
- Check for proxy/load balancer WebSocket support
- Use ping/pong to keep connection alive

## Support

- API Documentation: [docs/API.md](./API.md)
- GitHub Issues: https://github.com/flatfinderai-cyber/Rube-Goldberg-TUI/issues
- Frontend: https://rube.works
