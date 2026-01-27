/**
 * ABOUTME: API server for Rube Goldberg AI Agent.
 * Provides REST API and WebSocket endpoints for frontend integration.
 * Enables remote control and monitoring of the AI coding agent execution.
 */

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { WebSocketServer, type WebSocket } from 'ws';
import { createServer } from 'http';
import { ExecutionEngine } from '../engine/index.js';
import type { EngineEvent } from '../engine/types.js';
import type { RalphConfig } from '../config/types.js';
import { buildConfig } from '../config/index.js';
import { registerBuiltinAgents } from '../plugins/agents/builtin/index.js';
import { registerBuiltinTrackers } from '../plugins/trackers/builtin/index.js';
import {
  createSession,
  checkSession,
  endSession,
  type SessionMetadata,
  type CreateSessionOptions,
} from '../session/index.js';
import type { TrackerPlugin } from '../plugins/trackers/types.js';
import { getTrackerRegistry } from '../plugins/trackers/registry.js';

/**
 * Server configuration options
 */
export interface ServerConfig {
  /** HTTP port for REST API */
  port: number;
  /** Enable CORS (allow all origins if true, or specify allowed origins) */
  cors: boolean | string[];
  /** Enable authentication (placeholder for future implementation) */
  enableAuth?: boolean;
}

/**
 * Default server configuration
 * Configured to allow connections from rube.works frontend
 */
const DEFAULT_SERVER_CONFIG: ServerConfig = {
  port: 3030,
  cors: [
    'https://rube.works',
    'https://www.rube.works',
    'https://vibe-coding-platform-jet-six.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ],
  enableAuth: false,
};

/**
 * Active WebSocket connections for broadcasting engine events
 */
const activeConnections = new Set<WebSocket>();

/**
 * Current execution engine instance
 */
let currentEngine: ExecutionEngine | null = null;

/**
 * Current runtime configuration
 */
let currentConfig: RalphConfig | null = null;

/**
 * Current session metadata
 */
let currentSession: SessionMetadata | null = null;

/**
 * Current tracker instance
 */
let currentTracker: TrackerPlugin | null = null;

/**
 * Broadcast engine event to all connected WebSocket clients
 */
function broadcastEvent(event: EngineEvent): void {
  const message = JSON.stringify({
    type: 'engine-event',
    event,
  });

  activeConnections.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

/**
 * Send message to a specific WebSocket client
 */
function sendToClient(ws: WebSocket, type: string, data: unknown): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

/**
 * Create and start the API server
 */
export async function startApiServer(
  config: Partial<ServerConfig> = {}
): Promise<void> {
  const serverConfig: ServerConfig = { ...DEFAULT_SERVER_CONFIG, ...config };

  // Register built-in plugins
  await registerBuiltinAgents();
  await registerBuiltinTrackers();

  // Create Express app
  const app = express();

  // Configure CORS for rube.works frontend
  const corsOptions = {
    origin: serverConfig.cors === true
      ? '*'
      : serverConfig.cors === false
      ? false
      : serverConfig.cors,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get server info
  app.get('/api/info', (_req: Request, res: Response) => {
    const state = currentEngine?.getState();
    res.json({
      name: 'rube-goldberg-api',
      version: '0.1.0',
      status: currentEngine ? 'running' : 'idle',
      session: currentSession
        ? {
            id: currentSession.id,
            status: state?.status || currentSession.status,
            iteration: state?.currentIteration || 0,
            totalTasks: state?.totalTasks || 0,
            tasksCompleted: state?.tasksCompleted || 0,
          }
        : null,
    });
  });

  // Start execution
  app.post('/api/execution/start', async (req: Request, res: Response): Promise<void> => {
    try {
      if (currentEngine) {
        res.status(400).json({
          error: 'Execution already in progress',
          session: currentSession?.id,
        });
        return;
      }

      // Extract runtime options from request body
      const { prdPath, epicId, agent, model, tracker, iterations, cwd } = req.body;

      const workingDir = cwd || process.cwd();

      // Build runtime options
      const runtimeOptions = {
        prdPath,
        epicId,
        agent,
        model,
        tracker,
        iterations: iterations ?? 0,
        cwd: workingDir,
        headless: true, // Always run in headless mode for API
      };

      // Build final config
      currentConfig = await buildConfig(runtimeOptions);

      if (!currentConfig) {
        res.status(500).json({
          error: 'Failed to build configuration',
        });
        return;
      }

      // Check for existing session
      const existingSession = await checkSession(currentConfig.cwd);
      if (existingSession.session) {
        res.status(400).json({
          error: 'Session already exists. Use /api/execution/resume to continue.',
          session: existingSession.session,
        });
        return;
      }

      // Initialize tracker
      const trackerRegistry = getTrackerRegistry();
      await trackerRegistry.initialize();
      const trackerInstance = trackerRegistry.createInstance(currentConfig.tracker.plugin);
      if (!trackerInstance) {
        res.status(500).json({
          error: `Tracker plugin not found: ${currentConfig.tracker.plugin}`,
        });
        return;
      }
      currentTracker = trackerInstance;

      // Get initial tasks to count them
      const initialTasks = await currentTracker.getTasks({ status: ['open', 'in_progress'] });

      // Create new session
      const sessionOptions: CreateSessionOptions = {
        agentPlugin: currentConfig.agent.plugin,
        trackerPlugin: currentConfig.tracker.plugin,
        epicId: currentConfig.epicId,
        prdPath: currentConfig.prdPath,
        maxIterations: currentConfig.maxIterations,
        totalTasks: initialTasks.length,
        cwd: currentConfig.cwd,
      };
      currentSession = await createSession(sessionOptions);

      // Create engine
      currentEngine = new ExecutionEngine(currentConfig);

      // Subscribe to engine events and broadcast to WebSocket clients
      currentEngine.on((event: EngineEvent) => {
        broadcastEvent(event);
      });

      // Start execution (non-blocking)
      currentEngine.start().catch((error: unknown) => {
        console.error('Engine execution error:', error);
        currentEngine = null;
        currentSession = null;
        currentTracker = null;
      });

      res.json({
        success: true,
        session: {
          id: currentSession.id,
          status: 'running',
          iteration: 0,
        },
      });
    } catch (error: unknown) {
      console.error('Failed to start execution:', error);
      res.status(500).json({
        error: 'Failed to start execution',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Stop execution
  app.post('/api/execution/stop', async (_req: Request, res: Response): Promise<void> => {
    try {
      if (!currentEngine) {
        res.status(400).json({ error: 'No execution in progress' });
        return;
      }

      await currentEngine.stop();

      if (currentSession && currentConfig) {
        await endSession(currentConfig.cwd);
      }

      currentEngine = null;
      currentSession = null;
      currentConfig = null;
      currentTracker = null;

      res.json({ success: true, message: 'Execution stopped' });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Failed to stop execution',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Pause execution
  app.post('/api/execution/pause', async (_req: Request, res: Response): Promise<void> => {
    try {
      if (!currentEngine) {
        res.status(400).json({ error: 'No execution in progress' });
        return;
      }

      await currentEngine.pause();

      res.json({ success: true, message: 'Execution paused' });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Failed to pause execution',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Resume execution
  app.post('/api/execution/resume', async (_req: Request, res: Response): Promise<void> => {
    try {
      if (!currentEngine) {
        res.status(400).json({ error: 'No execution in progress' });
        return;
      }

      await currentEngine.resume();

      res.json({ success: true, message: 'Execution resumed' });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Failed to resume execution',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Get execution status
  app.get('/api/execution/status', (_req: Request, res: Response): void => {
    if (!currentEngine) {
      res.json({
        status: 'idle',
        engine: null,
        session: null,
      });
      return;
    }

    const state = currentEngine.getState();

    res.json({
      status: 'running',
      engine: {
        status: state.status,
        currentIteration: state.currentIteration,
        totalTasks: state.totalTasks,
        tasksCompleted: state.tasksCompleted,
        currentTask: state.currentTask,
        iterations: state.iterations,
      },
      session: currentSession
        ? {
            id: currentSession.id,
            status: state.status,
            iteration: state.currentIteration,
          }
        : null,
    });
  });

  // Get task list
  app.get('/api/tasks', async (_req: Request, res: Response): Promise<void> => {
    try {
      if (!currentTracker) {
        res.status(400).json({ error: 'No execution in progress' });
        return;
      }

      const tasks = await currentTracker.getTasks({ status: ['open', 'in_progress', 'completed'] });
      const state = currentEngine?.getState();

      res.json({
        tasks,
        currentTask: state?.currentTask || null,
        totalTasks: state?.totalTasks || tasks.length,
        tasksCompleted: state?.tasksCompleted || 0,
      });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Failed to get tasks',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Refresh task list
  app.post('/api/tasks/refresh', async (_req: Request, res: Response): Promise<void> => {
    try {
      if (!currentEngine) {
        res.status(400).json({ error: 'No execution in progress' });
        return;
      }

      await currentEngine.refreshTasks();

      res.json({ success: true, message: 'Tasks refreshed' });
    } catch (error: unknown) {
      res.status(500).json({
        error: 'Failed to refresh tasks',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    activeConnections.add(ws);

    // Send current state immediately upon connection
    if (currentEngine) {
      const state = currentEngine.getState();
      sendToClient(ws, 'initial-state', {
        status: state.status,
        currentIteration: state.currentIteration,
        totalTasks: state.totalTasks,
        tasksCompleted: state.tasksCompleted,
        currentTask: state.currentTask,
        session: currentSession,
      });
    } else {
      sendToClient(ws, 'initial-state', {
        status: 'idle',
        session: null,
      });
    }

    // Handle incoming messages from client
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);

        // Handle control messages
        switch (data.type) {
          case 'ping':
            sendToClient(ws, 'pong', { timestamp: new Date().toISOString() });
            break;

          case 'get-status':
            if (currentEngine) {
              const state = currentEngine.getState();
              sendToClient(ws, 'status', {
                status: state.status,
                currentIteration: state.currentIteration,
                totalTasks: state.totalTasks,
                tasksCompleted: state.tasksCompleted,
                currentTask: state.currentTask,
              });
            } else {
              sendToClient(ws, 'status', { status: 'idle' });
            }
            break;

          default:
            sendToClient(ws, 'error', { message: 'Unknown message type' });
        }
      } catch (error: unknown) {
        console.error('Error handling WebSocket message:', error);
        sendToClient(ws, 'error', {
          message: 'Failed to process message',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      activeConnections.delete(ws);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      activeConnections.delete(ws);
    });
  });

  // Start server
  httpServer.listen(serverConfig.port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Rube Goldberg API Server Started                             ║
╠════════════════════════════════════════════════════════════════╣
║  HTTP API:       http://localhost:${serverConfig.port}                    ║
║  WebSocket:      ws://localhost:${serverConfig.port}                      ║
║  Health Check:   http://localhost:${serverConfig.port}/health             ║
║  API Docs:       http://localhost:${serverConfig.port}/api/info           ║
╠════════════════════════════════════════════════════════════════╣
║  Frontend:       https://rube.works                            ║
║  CORS:           ${serverConfig.cors === true ? 'Enabled (all origins)' : 'Configured for rube.works'}      ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });
}

/**
 * Parse command-line arguments for server command
 */
export function parseServerArgs(args: string[]): Partial<ServerConfig> {
  const config: Partial<ServerConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--port':
      case '-p':
        if (nextArg && !nextArg.startsWith('-')) {
          config.port = parseInt(nextArg, 10);
          i++;
        }
        break;

      case '--no-cors':
        config.cors = false;
        break;

      case '--cors':
        if (nextArg && !nextArg.startsWith('-')) {
          // Parse comma-separated origins
          config.cors = nextArg.split(',').map((s) => s.trim());
          i++;
        }
        break;

      case '--enable-auth':
        config.enableAuth = true;
        break;
    }
  }

  return config;
}
