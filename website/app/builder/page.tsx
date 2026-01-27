// ABOUTME: Web app page for invention builder - zero human intervention AI agent

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

type AgentPhase = 'idle' | 'analyzing' | 'planning' | 'building' | 'validating' | 'complete' | 'failed';

interface AgentState {
	phase: AgentPhase;
	progress: number;
	status: string;
	currentTask: string | null;
	completedTasks: string[];
}

export default function InventionBuilderPage() {
	const [description, setDescription] = useState('');
	const [isBuilding, setIsBuilding] = useState(false);
	const [agentState, setAgentState] = useState<AgentState>({
		phase: 'idle',
		progress: 0,
		status: 'ready',
		currentTask: null,
		completedTasks: [],
	});
	const [result, setResult] = useState<any>(null);

	const phaseDescriptions: Record<AgentPhase, string> = {
		idle: 'Ready to build your invention',
		analyzing: 'Understanding your invention requirements...',
		planning: 'Creating autonomous build plan...',
		building: 'Writing code and assembling components...',
		validating: 'Testing and validating the invention...',
		complete: 'Your invention is ready!',
		failed: 'Something went wrong, retrying...',
	};

	const startBuilding = async () => {
		if (!description.trim()) return;

		setIsBuilding(true);
		setResult(null);

		try {
			const response = await fetch('/api/autonomous/build', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ description }),
			});

			if (!response.ok) throw new Error('Build failed');

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value);
					const lines = chunk.split('\n');

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const data = JSON.parse(line.slice(6));
							if (data.state) {
								setAgentState(data.state);
							}
							if (data.result) {
								setResult(data.result);
								setIsBuilding(false);
							}
						}
					}
				}
			}
		} catch (error) {
			console.error('Build error:', error);
			setIsBuilding(false);
			setAgentState({ ...agentState, phase: 'failed', status: 'error' });
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
			<div className="container mx-auto px-4 py-12 max-w-4xl">
				{/* Header */}
				<div className="text-center mb-12">
					<div className="flex items-center justify-center gap-2 mb-4">
						<Sparkles className="w-8 h-8 text-purple-600" />
						<h1 className="text-4xl font-bold">Invention Builder</h1>
					</div>
					<p className="text-lg text-muted-foreground">
						Describe your digital invention. AI builds it autonomously. Zero coding required.
					</p>
				</div>

				{/* Input Card */}
				{!isBuilding && !result && (
					<Card className="mb-8">
						<CardHeader>
							<CardTitle>What do you want to build?</CardTitle>
							<CardDescription>
								Describe your invention in plain English. The AI agent will handle everything automatically.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Textarea
								placeholder="Example: A todo app with AI-powered task suggestions, dark mode, and mobile-friendly design..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={6}
								className="resize-none"
							/>
							<div className="flex gap-2">
								<Button
									onClick={startBuilding}
									disabled={!description.trim()}
									className="flex-1"
									size="lg"
								>
									<Sparkles className="w-4 h-4 mr-2" />
									Build My Invention
								</Button>
							</div>
							<div className="text-xs text-muted-foreground space-y-1">
								<p>✨ AI analyzes your requirements</p>
								<p>🏗️ Autonomously plans architecture</p>
								<p>⚡ Writes, tests, and validates code</p>
								<p>🚀 Delivers working application</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Building Progress */}
				{isBuilding && (
					<Card className="mb-8">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Building Your Invention</CardTitle>
								<Badge variant={agentState.phase === 'failed' ? 'destructive' : 'default'}>
									{agentState.phase}
								</Badge>
							</div>
							<CardDescription>{phaseDescriptions[agentState.phase]}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Progress</span>
									<span className="font-mono">{agentState.progress}%</span>
								</div>
								<Progress value={agentState.progress} className="h-2" />
							</div>

							{agentState.currentTask && (
								<div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
									<Loader2 className="w-4 h-4 mt-0.5 animate-spin text-purple-600" />
									<div className="text-sm">{agentState.currentTask}</div>
								</div>
							)}

							{agentState.completedTasks.length > 0 && (
								<div className="space-y-2">
									<h4 className="text-sm font-medium">Completed Tasks</h4>
									<div className="space-y-1">
										{agentState.completedTasks.slice(-5).map((task, i) => (
											<div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
												<CheckCircle className="w-3 h-3 text-green-600" />
												<span>{task}</span>
											</div>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Result */}
				{result && (
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<CheckCircle className="w-6 h-6 text-green-600" />
								<CardTitle>Invention Complete!</CardTitle>
							</div>
							<CardDescription>Your digital invention has been built and is ready to use</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{result.accessUrl && (
								<div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
									<p className="text-sm font-medium mb-2">🎉 Your invention is live:</p>
									<a
										href={result.accessUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:underline font-mono text-sm"
									>
										{result.accessUrl}
									</a>
								</div>
							)}

							{result.files && result.files.length > 0 && (
								<div className="space-y-2">
									<h4 className="font-medium">Generated Files</h4>
									<div className="space-y-1">
										{result.files.map((file: any, i: number) => (
											<div key={i} className="text-sm font-mono text-muted-foreground">
												{file.path}
											</div>
										))}
									</div>
								</div>
							)}

							{result.documentation && (
								<div className="space-y-2">
									<h4 className="font-medium">Documentation</h4>
									<div className="prose prose-sm dark:prose-invert max-w-none">
										<pre className="text-xs">{result.documentation}</pre>
									</div>
								</div>
							)}

							<Button
								onClick={() => {
									setResult(null);
									setDescription('');
									setAgentState({
										phase: 'idle',
										progress: 0,
										status: 'ready',
										currentTask: null,
										completedTasks: [],
									});
								}}
								variant="outline"
								className="w-full"
							>
								Build Another Invention
							</Button>
						</CardContent>
					</Card>
				)}

				{/* Examples */}
				{!isBuilding && !result && (
					<Card>
						<CardHeader>
							<CardTitle>Need Inspiration?</CardTitle>
							<CardDescription>Click any example to try it out</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">
							{[
								'A weather dashboard with 7-day forecast and location search',
								'A recipe finder app with ingredient-based search and meal planning',
								'A personal budget tracker with charts and expense categorization',
								'A markdown note-taking app with tags and full-text search',
							].map((example, i) => (
								<button
									key={i}
									onClick={() => setDescription(example)}
									className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors text-sm"
								>
									{example}
								</button>
							))}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
