// ABOUTME: Alpine.js app for the 3-step intake wizard.
// Handles PRD input, context file uploads, clarifying questions, plan generation,
// and session creation + redirect to the run page.

function intakeApp() {
  return {
    // State
    currentStep: 0,
    steps: ['PRD', 'Questions', 'Launch'],
    prdText: '',
    contextFiles: [],
    selectedSkills: [],
    availableSkills: [
      'rube-goldberg-tui-prd',
      'rube-goldberg-tui-create-json',
      'rube-goldberg-tui-create-beads',
    ],
    mcpServers: [],
    questions: [],
    answers: {},
    plan: null,
    maxIterations: 25,
    sessionId: null,
    loadingQuestions: false,
    loadingPlan: false,
    launching: false,

    // ── Step 0 → 1: Generate clarifying questions ───────────────────────────
    async goToStep1() {
      if (!this.prdText.trim()) return;
      this.currentStep = 1;
      this.loadingQuestions = true;

      try {
        const res = await fetch('/api/prd/clarify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prd_text: this.prdText }),
        });
        const data = await res.json();
        this.questions = data.questions || [];
        // Pre-initialize answers
        this.questions.forEach(q => { this.answers[q.id] = ''; });
      } catch (err) {
        console.error('Failed to load questions:', err);
        this.questions = [
          { id: 'fallback', question: 'Any important constraints or requirements?', hint: '' }
        ];
      } finally {
        this.loadingQuestions = false;
      }
    },

    // ── Step 1 → 2: Create session + generate plan ──────────────────────────
    async goToStep2() {
      this.currentStep = 2;
      this.loadingPlan = true;

      // Build context files array
      const contextFilesData = await this.readContextFiles();

      // Create session
      try {
        const form = new FormData();
        form.append('prd_text', this.prdText);
        form.append('max_iterations', this.maxIterations);
        form.append('skills', JSON.stringify(this.selectedSkills));
        form.append('mcp_servers', JSON.stringify(this.mcpServers));
        form.append('context_files', JSON.stringify(contextFilesData));

        const sessionRes = await fetch('/api/session/create', {
          method: 'POST',
          body: form,
        });
        const sessionData = await sessionRes.json();
        this.sessionId = sessionData.session_id;
      } catch (err) {
        console.error('Failed to create session:', err);
      }

      // Generate plan
      try {
        const planRes = await fetch('/api/prd/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.sessionId,
            prd_text: this.prdText,
            answers: this.answers,
            skills: this.selectedSkills,
            mcp_servers: this.mcpServers,
          }),
        });
        const planData = await planRes.json();
        this.plan = planData.plan;

        // Set recommended iterations from plan
        if (this.plan?.estimated_iterations) {
          this.maxIterations = Math.min(this.plan.estimated_iterations, 50);
        }
      } catch (err) {
        console.error('Failed to generate plan:', err);
        this.plan = { summary: 'Plan generation failed — agent will self-direct.', phases: [] };
      } finally {
        this.loadingPlan = false;
      }
    },

    // ── Step 2: Launch the machine ───────────────────────────────────────────
    async startMachine() {
      if (!this.sessionId) return;
      this.launching = true;

      // Save answers to session config
      await fetch('/api/prd/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          prd_text: this.prdText,
          answers: this.answers,
          skills: this.selectedSkills,
          mcp_servers: this.mcpServers,
        }),
      });

      // Start the engine
      try {
        await fetch(`/api/session/${this.sessionId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ max_iterations: parseInt(this.maxIterations) }),
        });
        // Redirect to live run page
        window.location.href = `/run/${this.sessionId}`;
      } catch (err) {
        console.error('Failed to start engine:', err);
        this.launching = false;
      }
    },

    // ── Helpers ──────────────────────────────────────────────────────────────
    handleContextFiles(event) {
      this.contextFiles = Array.from(event.target.files);
    },

    async readContextFiles() {
      const results = [];
      for (const file of this.contextFiles) {
        try {
          const text = await file.text();
          results.push({ name: file.name, content: text.slice(0, 10000) });
        } catch (e) {
          results.push({ name: file.name, content: '' });
        }
      }
      return results;
    },
  };
}
