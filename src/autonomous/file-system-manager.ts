// ABOUTME: File system manager for autonomous code generation - creates and manages generated files

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FileSystemManager {
	private workspaceRoot: string;
	private generatedFiles: Array<{ path: string; content: string }> = [];

	constructor(workspaceRoot?: string) {
		this.workspaceRoot = workspaceRoot || path.join(process.cwd(), '.autonomous-workspace');
	}

	async initialize(): Promise<void> {
		await fs.mkdir(this.workspaceRoot, { recursive: true });
	}

	async createFile(relativePath: string, content: string): Promise<void> {
		const fullPath = path.join(this.workspaceRoot, relativePath);
		const dir = path.dirname(fullPath);

		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(fullPath, content, 'utf-8');

		this.generatedFiles.push({ path: relativePath, content });
	}

	async createFiles(files: Array<{ path: string; content: string }>): Promise<void> {
		await Promise.all(files.map((f) => this.createFile(f.path, f.content)));
	}

	async readFile(relativePath: string): Promise<string> {
		const fullPath = path.join(this.workspaceRoot, relativePath);
		return await fs.readFile(fullPath, 'utf-8');
	}

	async fileExists(relativePath: string): Promise<boolean> {
		const fullPath = path.join(this.workspaceRoot, relativePath);
		try {
			await fs.access(fullPath);
			return true;
		} catch {
			return false;
		}
	}

	async runCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
		return await execAsync(command, {
			cwd: cwd || this.workspaceRoot,
		});
	}

	async installDependencies(packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' = 'npm'): Promise<void> {
		await this.runCommand(`${packageManager} install`);
	}

	async runTests(): Promise<boolean> {
		try {
			await this.runCommand('npm test');
			return true;
		} catch {
			return false;
		}
	}

	async runLinter(): Promise<{ success: boolean; errors: string[] }> {
		try {
			const { stdout } = await this.runCommand('npm run lint');
			return { success: true, errors: stdout ? [] : [] };
		} catch (error: any) {
			return {
				success: false,
				errors: [error.stdout, error.stderr].filter(Boolean),
			};
		}
	}

	async buildProject(): Promise<boolean> {
		try {
			await this.runCommand('npm run build');
			return true;
		} catch {
			return false;
		}
	}

	async createPackageJson(projectName: string, dependencies: Record<string, string>): Promise<void> {
		const packageJson = {
			name: projectName,
			version: '1.0.0',
			type: 'module',
			scripts: {
				dev: 'vite',
				build: 'vite build',
				preview: 'vite preview',
				test: 'vitest',
				lint: 'eslint .',
			},
			dependencies,
			devDependencies: {
				'@types/node': '^20.0.0',
				typescript: '^5.0.0',
				vite: '^5.0.0',
				vitest: '^1.0.0',
				eslint: '^8.0.0',
			},
		};

		await this.createFile('package.json', JSON.stringify(packageJson, null, 2));
	}

	async createTsConfig(): Promise<void> {
		const tsConfig = {
			compilerOptions: {
				target: 'ES2020',
				module: 'ESNext',
				lib: ['ES2020', 'DOM'],
				moduleResolution: 'bundler',
				strict: true,
				esModuleInterop: true,
				skipLibCheck: true,
				resolveJsonModule: true,
			},
			include: ['src/**/*'],
			exclude: ['node_modules', 'dist'],
		};

		await this.createFile('tsconfig.json', JSON.stringify(tsConfig, null, 2));
	}

	async createViteConfig(): Promise<void> {
		const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
`;

		await this.createFile('vite.config.ts', viteConfig);
	}

	async getGeneratedFiles(): Promise<Array<{ path: string; content: string }>> {
		return [...this.generatedFiles];
	}

	async getWorkspacePath(): Promise<string> {
		return this.workspaceRoot;
	}

	async cleanup(): Promise<void> {
		// Don't delete the workspace automatically - user might want to inspect it
		this.generatedFiles = [];
	}

	async zipWorkspace(): Promise<Buffer> {
		const { stdout } = await this.runCommand(`tar -czf - .`, this.workspaceRoot);
		return Buffer.from(stdout);
	}
}
