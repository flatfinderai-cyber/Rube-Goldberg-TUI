// ABOUTME: LLM integration for autonomous code generation and decision-making

import Anthropic from '@anthropic-ai/sdk';

export class LLMOrchestrator {
	private client: Anthropic;

	constructor() {
		this.client = new Anthropic({
			apiKey: process.env.ANTHROPIC_API_KEY || '',
		});
	}

	async analyzeInventionRequest(description: string): Promise<any> {
		const prompt = `You are an autonomous software architect. Analyze this invention request and provide a detailed technical specification.

Invention Request:
${description}

Provide a JSON response with:
1. type: The type of application (web-app, mobile-app, api, etc.)
2. complexity: simple | medium | complex
3. requirements: Array of functional requirements
4. techStack: Recommended technologies
5. architecture: High-level system design
6. estimatedTime: Development time estimate

Output only valid JSON, no markdown.`;

		const response = await this.client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 4096,
			messages: [{ role: 'user', content: prompt }],
		});

		const content = response.content[0];
		if (content.type === 'text') {
			return JSON.parse(content.text);
		}
		throw new Error('Invalid response from LLM');
	}

	async generateImplementationPlan(analysis: any): Promise<any> {
		const prompt = `You are an autonomous development planner. Create a detailed implementation plan.

Technical Specification:
${JSON.stringify(analysis, null, 2)}

Generate a JSON response with:
1. tasks: Array of implementation tasks, each with:
   - id: unique identifier
   - description: what to implement
   - files: files to create/modify
   - code: pseudocode or actual code
   - tests: test specifications
   - dependencies: other task IDs this depends on
2. executionOrder: Optimal order for task execution
3. validationCriteria: How to verify completion

Output only valid JSON.`;

		const response = await this.client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 8192,
			messages: [{ role: 'user', content: prompt }],
		});

		const content = response.content[0];
		if (content.type === 'text') {
			return JSON.parse(content.text);
		}
		throw new Error('Invalid response from LLM');
	}

	async generateCode(task: any, context: any): Promise<any> {
		const prompt = `You are an autonomous code generator. Implement this task completely.

Task:
${JSON.stringify(task, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Generate complete, production-ready code with:
1. Full implementation (no placeholders or TODOs)
2. Proper error handling
3. Type safety (TypeScript)
4. Comments explaining key logic
5. Tests for critical functionality

Output JSON with:
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "complete file content",
      "type": "implementation" | "test" | "config"
    }
  ],
  "instructions": "Any setup or deployment instructions"
}

Output only valid JSON.`;

		const response = await this.client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 16384,
			messages: [{ role: 'user', content: prompt }],
		});

		const content = response.content[0];
		if (content.type === 'text') {
			return JSON.parse(content.text);
		}
		throw new Error('Invalid response from LLM');
	}

	async fixError(error: any, code: string, context: any): Promise<string> {
		const prompt = `You are an autonomous debugging agent. Fix this error.

Error:
${JSON.stringify(error, null, 2)}

Current Code:
\`\`\`
${code}
\`\`\`

Context:
${JSON.stringify(context, null, 2)}

Analyze the error, identify the root cause, and provide the corrected code.
Output only the fixed code, no explanations.`;

		const response = await this.client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 8192,
			messages: [{ role: 'user', content: prompt }],
		});

		const content = response.content[0];
		if (content.type === 'text') {
			return content.text;
		}
		throw new Error('Invalid response from LLM');
	}

	async generateTests(code: string, requirements: any): Promise<string> {
		const prompt = `Generate comprehensive tests for this code.

Code:
\`\`\`
${code}
\`\`\`

Requirements:
${JSON.stringify(requirements, null, 2)}

Generate tests using a modern testing framework (Vitest/Jest).
Cover:
1. Happy path scenarios
2. Edge cases
3. Error conditions
4. Integration points

Output only the test code.`;

		const response = await this.client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 8192,
			messages: [{ role: 'user', content: prompt }],
		});

		const content = response.content[0];
		if (content.type === 'text') {
			return content.text;
		}
		throw new Error('Invalid response from LLM');
	}

	async generateDocumentation(files: any[], description: string): Promise<string> {
		const prompt = `Generate user documentation for this invention.

Original Request:
${description}

Generated Files:
${files.map((f) => `- ${f.path}`).join('\n')}

Create a comprehensive README.md with:
1. Overview of what was built
2. Features list
3. How to use it
4. Installation/setup instructions
5. Configuration options
6. Troubleshooting tips

Output the markdown documentation.`;

		const response = await this.client.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 4096,
			messages: [{ role: 'user', content: prompt }],
		});

		const content = response.content[0];
		if (content.type === 'text') {
			return content.text;
		}
		throw new Error('Invalid response from LLM');
	}
}
