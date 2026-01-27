/**
 * ABOUTME: Server command implementation.
 * Starts the API server for remote control and frontend integration.
 */

import { startApiServer, parseServerArgs } from '../server/index.js';

/**
 * Show server help
 */
function showServerHelp(): void {
  console.log(`
Start the Rube Goldberg API Server

Usage: rube-goldberg-tui server [options]

Options:
  --port, -p <number>     HTTP/WebSocket port (default: 3030)
  --no-cors               Disable CORS
  --cors <origins>        Comma-separated list of allowed origins
  --enable-auth           Enable authentication (placeholder for future)
  --help, -h              Show this help message

Examples:
  rube-goldberg-tui server                      # Start with defaults
  rube-goldberg-tui server --port 8080          # Custom port
  rube-goldberg-tui server --cors https://rube.works  # Specific origin

API Endpoints:
  GET  /health                    - Health check
  GET  /api/info                  - Server information
  POST /api/execution/start       - Start execution
  POST /api/execution/stop        - Stop execution
  POST /api/execution/pause       - Pause execution
  POST /api/execution/resume      - Resume execution
  GET  /api/execution/status      - Get execution status
  GET  /api/tasks                 - Get task list
  POST /api/tasks/refresh         - Refresh tasks

WebSocket:
  ws://localhost:3030             - Real-time engine events

Frontend:
  https://rube.works              - Frontend interface
`);
}

/**
 * Execute the server command
 */
export async function executeServerCommand(args: string[]): Promise<void> {
  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    showServerHelp();
    return;
  }

  // Parse arguments
  const config = parseServerArgs(args);

  // Start the API server
  console.log('Starting Rube Goldberg API Server...\n');
  await startApiServer(config);

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n\nShutting down server...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\nShutting down server...');
    process.exit(0);
  });
}
