// ABOUTME: Type definitions for autonomous invention building system

export interface InventionRequest {
	description: string;
	constraints?: {
		budget?: number;
		timeline?: string;
		technologies?: string[];
	};
	preferences?: {
		framework?: string;
		hosting?: string;
		features?: string[];
	};
}

export type AgentPhase = 
	| 'idle'
	| 'analyzing'
	| 'planning'
	| 'building'
	| 'validating'
	| 'complete'
	| 'failed';

export interface AgentState {
	phase: AgentPhase;
	progress: number; // 0-100
	status: 'ready' | 'running' | 'success' | 'error';
	currentTask: string | null;
	completedTasks: string[];
	errors: any[];
	startTime?: number;
}

export interface ExecutionResult {
	success: boolean;
	deliverable?: any;
	error?: string;
	metadata: {
		duration: number;
		phases: string[];
		tasksCompleted: number;
	};
}

export interface Task {
	id: string;
	description: string;
	dependencies: string[];
	validation: ValidationCriteria;
}

export interface ValidationCriteria {
	tests?: string[];
	outputs?: string[];
	requirements?: string[];
}
