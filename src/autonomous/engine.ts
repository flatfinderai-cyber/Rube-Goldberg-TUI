// ABOUTME: Core autonomous agent engine for zero-intervention invention building
// This engine orchestrates the complete autonomous loop: analyze → plan → build → validate

import { EventEmitter } from 'events';
import type { InventionRequest, AgentState, ExecutionResult } from './types.js';
import { LLMOrchestrator } from './llm-orchestrator.js';
import { FileSystemManager } from './file-system-manager.js';

export class AutonomousEngine extends EventEmitter {
	private llm: LLMOrchestrator;
	private fsManager: FileSystemManager;
	private state: AgentState = {
		phase: 'idle',
		progress: 0,
		status: 'ready',
		currentTask: null,
		completedTasks: [],
		errors: [],
	};

	private maxAttempts = 5;
	private currentAttempt = 0;

	constructor() {
		super();
		this.llm = new LLMOrchestrator();
		this.fsManager = new FileSystemManager();
	}

	async executeInvention(request: InventionRequest): Promise<ExecutionResult> {
		await this.fsManager.initialize();
		this.emit('start', { request });
		this.updateState({ phase: 'analyzing', progress: 0, status: 'running' });

		try {
			// Phase 1: Analyze the invention request
			const analysis = await this.analyzeRequest(request);
			this.updateState({ progress: 25 });

			// Phase 2: Create implementation plan
			const plan = await this.createPlan(analysis);
			this.updateState({ phase: 'planning', progress: 40 });

			// Phase 3: Execute autonomous build
			const buildResult = await this.executeBuild(plan);
			this.updateState({ phase: 'building', progress: 70 });

			// Phase 4: Validate and self-correct
			const validation = await this.validateBuild(buildResult);
			this.updateState({ phase: 'validating', progress: 90 });

			// Phase 5: Package and deliver
			const deliverable = await this.packageDeliverable(validation);
			this.updateState({ phase: 'complete', progress: 100, status: 'success' });

			this.emit('complete', { deliverable });

			return {
				success: true,
				deliverable,
				metadata: {
					duration: Date.now() - this.state.startTime!,
					phases: ['analyze', 'plan', 'build', 'validate', 'package'],
					tasksCompleted: this.state.completedTasks.length,
				},
			};
		} catch (error) {
			return this.handleFailure(error);
		}
	}

	private async analyzeRequest(request: InventionRequest): Promise<any> {
		this.emit('phase:start', { phase: 'analyze' });
		const analysis = await this.llm.analyzeInventionRequest(request.description);
		this.emit('phase:complete', { phase: 'analyze', result: analysis });
		return analysis;
	}

	private async createPlan(analysis: any): Promise<any> {
		this.emit('phase:start', { phase: 'plan' });
		const plan = await this.llm.generateImplementationPlan(analysis);
		this.emit('phase:complete', { phase: 'plan', result: plan });
		return plan;
	}

	private async executeBuild(plan: any): Promise<any> {
		this.emit('phase:start', { phase: 'build' });
		const results = [];

		await this.fsManager.createPackageJson('autonomous-invention', plan.techStack?.dependencies || {});
		await this.fsManager.createTsConfig();
		await this.fsManager.createViteConfig();

		for (const task of plan.tasks) {
			this.currentAttempt = 0;
			let success = false;
			this.updateState({ currentTask: task.description });

			while (!success && this.currentAttempt < this.maxAttempts) {
				try {
					const codeResult = await this.llm.generateCode(task, {
						existingFiles: await this.fsManager.getGeneratedFiles(),
						analysis: plan,
					});

					await this.fsManager.createFiles(codeResult.files);

					for (const file of codeResult.files.filter((f: any) => f.type === 'implementation')) {
						const tests = await this.llm.generateTests(file.content, task.tests || []);
						await this.fsManager.createFile(file.path.replace('.ts', '.test.ts'), tests);
					}

					results.push(codeResult);
					this.state.completedTasks.push(task.description);
					success = true;
					this.emit('task:complete', { task, result: codeResult });
				} catch (error) {
					this.currentAttempt++;
					if (this.currentAttempt < this.maxAttempts) {
						await this.autoCorrect(task, error);
					} else {
						throw new Error(`Task ${task.id} failed after ${this.maxAttempts} attempts`);
					}
				}
			}
		}

		this.emit('phase:complete', { phase: 'build', result: results });
		return results;
	}

	private async validateBuild(buildResult: any): Promise<any> {
		this.emit('phase:start', { phase: 'validate' });

		this.updateState({ currentTask: 'Installing dependencies...' });
		await this.fsManager.installDependencies('npm');

		this.updateState({ currentTask: 'Running tests...' });
		const testsPass = await this.fsManager.runTests();

		this.updateState({ currentTask: 'Running linter...' });
		const lintResult = await this.fsManager.runLinter();

		this.updateState({ currentTask: 'Building project...' });
		const buildSuccess = await this.fsManager.buildProject();

		const validation = { testsPass, lintClean: lintResult.success, lintErrors: lintResult.errors, buildSuccess };

		if (!validation.testsPass || !validation.lintClean) {
			this.updateState({ currentTask: 'Auto-fixing issues...' });
			await this.autoFix(buildResult, validation);
			validation.testsPass = await this.fsManager.runTests();
			validation.lintClean = (await this.fsManager.runLinter()).success;
		}

		this.emit('phase:complete', { phase: 'validate', result: validation });
		return validation;
	}

	private async packageDeliverable(_validation: any): Promise<any> {
		this.emit('phase:start', { phase: 'package' });

		this.updateState({ currentTask: 'Generating documentation...' });
		const files = await this.fsManager.getGeneratedFiles();
		const documentation = await this.llm.generateDocumentation(files, this.state.currentTask || 'Autonomous Invention');

		await this.fsManager.createFile('README.md', documentation);

		this.updateState({ currentTask: 'Packaging deliverable...' });
		const workspacePath = await this.fsManager.getWorkspacePath();

		const deliverable = { files, documentation, workspacePath, accessUrl: null };

		this.emit('phase:complete', { phase: 'package', result: deliverable });
		return deliverable;
	}

	private async autoCorrect(task: any, error: any): Promise<void> {
		this.emit('autocorrect', { task, error, attempt: this.currentAttempt });
		const files = await this.fsManager.getGeneratedFiles();
		const relevantFile = files.find((f) => f.path.includes(task.id));

		if (relevantFile) {
			const fixedCode = await this.llm.fixError(error, relevantFile.content, { task, files });
			await this.fsManager.createFile(relevantFile.path, fixedCode);
		}
	}

	private async autoFix(_buildResult: any, validation: any): Promise<void> {
		const files = await this.fsManager.getGeneratedFiles();

		if (!validation.lintClean && validation.lintErrors) {
			for (const error of validation.lintErrors) {
				for (const file of files) {
					const fixedCode = await this.llm.fixError({ type: 'lint', message: error }, file.content, { validation });
					await this.fsManager.createFile(file.path, fixedCode);
				}
			}
		}
	}

	private updateState(updates: Partial<AgentState>): void {
		this.state = { ...this.state, ...updates };
		if (!this.state.startTime) {
			this.state.startTime = Date.now();
		}
		this.emit('state:update', this.state);
	}

	private handleFailure(error: any): ExecutionResult {
		this.updateState({ phase: 'failed', status: 'error' });
		this.state.errors.push(error);
		this.emit('error', { error });

		return {
			success: false,
			error: error.message,
			metadata: {
				duration: Date.now() - (this.state.startTime || Date.now()),
				phases: [],
				tasksCompleted: this.state.completedTasks.length,
			},
		};
	}

	getState(): AgentState {
		return { ...this.state };
	}
}
