// ABOUTME: SSE client for the live run page.
// Connects to /api/session/{id}/stream and dispatches events to:
// - phase pipeline (gear animations)
// - terminal output (streaming text)
// - tool activity log (right panel)
// - iteration counter and progress bar

const terminal = document.getElementById('terminal-output');
const toolLog  = document.getElementById('tool-log');
let firstOutput = true;
let eventSource = null;

// ── Connect SSE ──────────────────────────────────────────────────────────────
function connectStream() {
  eventSource = new EventSource(`/api/session/${SESSION_ID}/stream`);

  eventSource.addEventListener('engine_start', e => {
    const data = JSON.parse(e.data);
    document.getElementById('iter-total').textContent = data.max_iterations || '?';
    appendOutput('⚙ Machine started — standing by for agent output\n', 'system');
  });

  eventSource.addEventListener('phase_start', e => {
    const data = JSON.parse(e.data);
    activatePhase(data.phase);
    document.getElementById('current-phase-label').textContent = data.label || data.phase;
    appendOutput(`\n── ${data.label || data.phase} ──\n`, 'system');
  });

  eventSource.addEventListener('iteration', e => {
    const data = JSON.parse(e.data);
    document.getElementById('iter-current').textContent = data.current;
    document.getElementById('iter-total').textContent   = data.total;
    const pct = Math.round((data.current / data.total) * 100);
    document.getElementById('progress-bar').style.width = `${pct}%`;
  });

  eventSource.addEventListener('agent_output', e => {
    const data = JSON.parse(e.data);
    if (data.text) {
      if (firstOutput) {
        terminal.innerHTML = '';
        firstOutput = false;
      }
      appendOutput(data.text);
    }
  });

  eventSource.addEventListener('tool_use', e => {
    const data = JSON.parse(e.data);
    addToolEntry(data.tool, data.inputs);
    appendOutput(`\n[tool: ${data.tool}] ${JSON.stringify(data.inputs).slice(0, 80)}\n`, 'tool');
  });

  eventSource.addEventListener('tool_result', e => {
    const data = JSON.parse(e.data);
    updateLastToolEntry(data.tool, data.preview);
  });

  eventSource.addEventListener('engine_complete', e => {
    const data = JSON.parse(e.data);
    markComplete(data.success);
    appendOutput('\n✓ Build complete! Redirecting to results...\n', 'success');
    setTimeout(() => {
      window.location.href = `/results/${SESSION_ID}`;
    }, 2500);
  });

  eventSource.addEventListener('engine_error', e => {
    const data = JSON.parse(e.data);
    appendOutput(`\n✗ Engine error: ${data.error}\n`, 'error');
    document.getElementById('engine-status').textContent = 'ERROR';
    document.getElementById('engine-status').style.color = 'var(--rg-red)';
    document.body.classList.add('engine-error');
  });

  eventSource.addEventListener('engine_stopped', e => {
    appendOutput('\n■ Stopped.\n', 'system');
    document.getElementById('engine-status').textContent = 'STOPPED';
  });

  eventSource.addEventListener('heartbeat', e => {
    // Keep-alive — no display needed
  });

  eventSource.onerror = () => {
    appendOutput('\n⚠ Connection lost. Reconnecting...\n', 'system');
    setTimeout(connectStream, 3000);
  };
}

// ── Phase pipeline ───────────────────────────────────────────────────────────
const PHASE_ORDER = ['analyze', 'plan', 'build', 'validate', 'package'];

function activatePhase(phase) {
  const idx = PHASE_ORDER.indexOf(phase);
  document.querySelectorAll('.phase-node').forEach((node, i) => {
    node.classList.remove('active', 'complete');
    if (i < idx)  node.classList.add('complete');
    if (i === idx) node.classList.add('active');
  });
}

function markComplete(success) {
  document.querySelectorAll('.phase-node').forEach(node => {
    node.classList.remove('active');
    node.classList.add('complete');
  });
  document.getElementById('progress-bar').style.width = '100%';
  document.getElementById('engine-status').textContent = success ? 'COMPLETE' : 'DONE';
  document.getElementById('engine-status').style.color = 'var(--rg-green)';
  document.body.classList.add('engine-complete');
}

// ── Terminal output ───────────────────────────────────────────────────────────
let outputBuffer = '';
let flushTimer = null;

function appendOutput(text, cls = '') {
  outputBuffer += text;
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flushOutput, 16); // ~60fps batching
}

function flushOutput() {
  if (!outputBuffer) return;
  const chunk = document.createElement('span');
  chunk.className = `output-chunk ${outputBuffer.match(/^\[tool:/) ? 'tool' : ''}`;
  chunk.textContent = outputBuffer;
  outputBuffer = '';

  // Remove old cursor
  const oldCursor = terminal.querySelector('.cursor-blink');
  if (oldCursor) oldCursor.remove();

  terminal.appendChild(chunk);

  // Add cursor at end
  const cursor = document.createElement('span');
  cursor.className = 'cursor-blink';
  terminal.appendChild(cursor);

  terminal.scrollTop = terminal.scrollHeight;
}

// Override appendOutput for typed messages
function appendTyped(text, cls = '') {
  const chunk = document.createElement('div');
  chunk.className = `output-chunk ${cls}`;
  chunk.textContent = text;
  terminal.appendChild(chunk);
  terminal.scrollTop = terminal.scrollHeight;
}

// ── Tool activity log ─────────────────────────────────────────────────────────
let toolEntries = [];

function addToolEntry(toolName, inputs) {
  const existingEmpty = toolLog.querySelector('.text-rg-dim');
  if (existingEmpty) existingEmpty.remove();

  const entry = document.createElement('div');
  entry.className = 'tool-entry';
  const detail = Object.entries(inputs || {})
    .map(([k,v]) => `${k}: ${String(v).slice(0, 40)}`)
    .join(', ');
  entry.innerHTML = `
    <div class="tool-name">⚙ ${toolName}</div>
    <div class="tool-detail" id="tool-detail-${toolEntries.length}">${detail}</div>
  `;
  toolLog.insertBefore(entry, toolLog.firstChild);
  toolEntries.unshift({ el: entry, tool: toolName, idx: toolEntries.length });

  // Keep max 50 entries
  while (toolLog.children.length > 50) {
    toolLog.removeChild(toolLog.lastChild);
  }
}

function updateLastToolEntry(toolName, preview) {
  const entry = toolEntries[0];
  if (!entry) return;
  const detail = entry.el.querySelector('.tool-detail');
  if (detail && preview) {
    detail.textContent = `→ ${preview.slice(0, 60)}`;
    detail.style.color = 'var(--rg-green)';
  }
}

// ── Controls ──────────────────────────────────────────────────────────────────
async function pauseSession() {
  const btn = document.getElementById('btn-pause');
  const status = document.getElementById('engine-status');
  const isPaused = btn.textContent.includes('Resume');

  if (isPaused) {
    await fetch(`/api/session/${SESSION_ID}/resume`, { method: 'POST' });
    btn.textContent = '⏸ Pause';
    status.textContent = 'RUNNING';
    status.style.color = 'var(--rg-green)';
  } else {
    await fetch(`/api/session/${SESSION_ID}/pause`, { method: 'POST' });
    btn.textContent = '▶ Resume';
    status.textContent = 'PAUSED';
    status.style.color = 'var(--rg-yellow)';
  }
}

async function stopSession() {
  if (!confirm('Stop the machine? This will end the build.')) return;
  await fetch(`/api/session/${SESSION_ID}/stop`, { method: 'POST' });
  document.getElementById('engine-status').textContent = 'STOPPED';
  document.getElementById('engine-status').style.color = 'var(--rg-red)';
}

// ── Boot ──────────────────────────────────────────────────────────────────────
connectStream();
