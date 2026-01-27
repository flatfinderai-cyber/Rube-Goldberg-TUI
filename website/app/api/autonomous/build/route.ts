// ABOUTME: API route for autonomous invention building - handles zero-intervention agent execution

import { NextRequest } from 'next/server';
import { AutonomousEngine } from '@/lib/autonomous-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const { description, constraints, preferences } = await request.json();

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const engine = new AutonomousEngine();

			// Stream state updates to frontend
			engine.on('state:update', (state) => {
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ state })}\n\n`)
				);
			});

			engine.on('phase:start', ({ phase }) => {
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ event: 'phase:start', phase })}\n\n`)
				);
			});

			engine.on('phase:complete', ({ phase, result }) => {
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ event: 'phase:complete', phase, result })}\n\n`)
				);
			});

			engine.on('task:complete', ({ task }) => {
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ event: 'task:complete', task })}\n\n`)
				);
			});

			engine.on('complete', ({ deliverable }) => {
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ result: deliverable })}\n\n`)
				);
				controller.close();
			});

			engine.on('error', ({ error }) => {
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
				);
				controller.close();
			});

			// Execute autonomous build
			try {
				await engine.executeInvention({
					description,
					constraints,
					preferences,
				});
			} catch (error: any) {
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
				);
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		},
	});
}
