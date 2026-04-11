# ABOUTME: PRD processing and clarifying question generation.
# Ported and expanded from src/prd/questions.ts and src/prd/generator.ts.
# Uses Claude to generate targeted questions based on the PRD content,
# then generates a structured implementation plan from the answers.

import json
import os
from typing import Any

from core.agent_sdk import AgentSDK


# Static fallback questions (used when API is unavailable)
BASE_CLARIFYING_QUESTIONS = [
    {
        "id": "target_users",
        "question": "Who are the primary users of this product?",
        "hint": "e.g. developers, non-technical users, businesses, students...",
    },
    {
        "id": "core_features",
        "question": "What are the 3 most important features that MUST be in v1?",
        "hint": "Focus on what makes this product useful from day one.",
    },
    {
        "id": "tech_constraints",
        "question": "Any technology constraints or preferences?",
        "hint": "e.g. specific languages, frameworks, hosting requirements, or 'no preference'",
    },
    {
        "id": "success_criteria",
        "question": "How will you know it's working correctly?",
        "hint": "Describe what a successful end-to-end test looks like.",
    },
    {
        "id": "out_of_scope",
        "question": "What is explicitly OUT of scope for this version?",
        "hint": "Helps the agent avoid over-building.",
    },
]

SYSTEM_CLARIFY = """You are a senior product engineer reviewing a PRD.
Generate 4-6 targeted clarifying questions that would resolve genuine ambiguities in this PRD.
Questions must be practical and directly affect architecture or implementation decisions.
Do NOT ask obvious questions. Do NOT ask things that are already clearly answered in the PRD.
Output JSON array: [{"id": "snake_case_id", "question": "...", "hint": "brief hint for user"}]
Output only valid JSON, no markdown."""

SYSTEM_PLAN = """You are a senior software architect.
Given a PRD and clarifying answers, create a complete implementation plan.
Be concrete. Name specific files, frameworks, data models.
Output JSON:
{
  "summary": "1-2 sentence description of what will be built",
  "tech_stack": {"frontend": "...", "backend": "...", "database": "...", "other": []},
  "phases": [
    {
      "name": "phase name",
      "description": "what gets built",
      "tasks": ["specific task 1", "specific task 2", ...]
    }
  ],
  "file_structure": ["list of key files that will be created"],
  "estimated_iterations": <integer 5-50>
}
Output only valid JSON, no markdown."""


class PRDProcessor:
    def __init__(self):
        self._sdk = AgentSDK(tool_executor=lambda n, i: None)

    async def generate_questions(self, prd_text: str) -> list[dict]:
        """Generate targeted clarifying questions for this specific PRD."""
        try:
            raw = await self._sdk.ask(
                system_prompt=SYSTEM_CLARIFY,
                user_message=f"PRD:\n\n{prd_text}",
                max_tokens=1024,
            )
            questions = json.loads(raw)
            if isinstance(questions, list) and len(questions) > 0:
                return questions[:6]
        except Exception:
            pass
        return BASE_CLARIFYING_QUESTIONS

    async def generate_plan(
        self,
        prd_text: str,
        answers: dict[str, str],
        skills: list[str],
        mcp_servers: list[str],
    ) -> dict:
        """Generate structured implementation plan from PRD + answers."""
        answers_text = "\n".join(
            f"- {qid}: {answer}" for qid, answer in answers.items() if answer.strip()
        )
        context = f"""PRD:
{prd_text}

Clarifying Answers:
{answers_text}

Available Skills: {', '.join(skills) if skills else 'none'}
MCP Servers: {', '.join(mcp_servers) if mcp_servers else 'none'}"""

        try:
            raw = await self._sdk.ask(
                system_prompt=SYSTEM_PLAN,
                user_message=context,
                max_tokens=2048,
            )
            return json.loads(raw)
        except Exception as e:
            return {
                "summary": "Build the product described in the PRD.",
                "tech_stack": {"frontend": "TBD", "backend": "TBD", "database": "TBD", "other": []},
                "phases": [{"name": "Build", "description": "Full implementation", "tasks": ["Implement PRD"]}],
                "file_structure": [],
                "estimated_iterations": 20,
                "error": str(e),
            }

    def build_agent_system_prompt(
        self,
        prd_text: str,
        plan: dict,
        answers: dict,
        max_iterations: int,
        current_iteration: int,
        context_files: list[dict],
    ) -> str:
        """Build the system prompt injected into the autonomous agent loop."""
        context_section = ""
        if context_files:
            context_section = "\n\nContext Files Provided:\n" + "\n".join(
                f"=== {f['name']} ===\n{f['content'][:2000]}"
                for f in context_files[:5]
            )

        return f"""You are an autonomous coding agent running inside the Rube Goldberg platform.

Your mission: Build the complete, working product described in the PRD below.

RULES — read carefully:
1. Build the ENTIRE thing. No placeholders. No TODOs. No "implement later".
2. Every file you create must be complete and functional.
3. Use the tools: write_file, run_command, read_file, list_files, create_directory.
4. After writing code, run tests and fix errors automatically.
5. When the build is complete, write a file called COMPLETE.md with a summary.
6. You are on iteration {current_iteration} of {max_iterations}. Work efficiently.

PRD:
{prd_text}

Implementation Plan:
{json.dumps(plan, indent=2)}

Clarifying Answers:
{json.dumps(answers, indent=2)}
{context_section}

Build it. Make it work. Go."""
