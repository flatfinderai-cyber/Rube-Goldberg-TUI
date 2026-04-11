# ABOUTME: Claude Agent SDK wrapper using the Anthropic Python SDK.
# Provides streaming messages with tool use for the autonomous coding agent.
# Supports long-running sessions with proper async streaming.

import asyncio
import json
import os
from typing import Any, AsyncGenerator, Callable, Optional

import anthropic

MODEL = "claude-opus-4-6"

# ── Tool definitions given to the agent ───────────────────────────────────────

AGENT_TOOLS = [
    {
        "name": "read_file",
        "description": "Read the contents of a file in the agent workspace.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path within the workspace"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": "Write or overwrite a file in the agent workspace.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path within the workspace"},
                "content": {"type": "string", "description": "Full file content to write"},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "run_command",
        "description": "Run a shell command in the workspace sandbox. Returns stdout and stderr.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to execute"},
                "timeout": {"type": "integer", "description": "Timeout in seconds (default 60)", "default": 60},
            },
            "required": ["command"],
        },
    },
    {
        "name": "list_files",
        "description": "List files in a directory of the workspace.",
        "input_schema": {
            "type": "object",
            "properties": {
                "directory": {"type": "string", "description": "Relative path to list (default: root)", "default": "."},
            },
        },
    },
    {
        "name": "create_directory",
        "description": "Create a directory (and parents) in the workspace.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Directory path to create"},
            },
            "required": ["path"],
        },
    },
]


class AgentSDK:
    """Thin wrapper around the Anthropic Python SDK for autonomous agent runs."""

    def __init__(self, tool_executor: Callable):
        self._client = anthropic.AsyncAnthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        )
        self._tool_executor = tool_executor

    async def run(
        self,
        system_prompt: str,
        user_message: str,
        on_text: Callable[[str], None],
        on_tool_use: Callable[[str, dict], None],
        on_tool_result: Callable[[str, Any], None],
        max_tokens: int = 16384,
    ) -> str:
        """
        Run the agent with streaming, handling the full tool-use loop.
        Calls on_text for each text chunk, on_tool_use when a tool is called,
        and on_tool_result when the result comes back.
        Returns the final text response.
        """
        messages = [{"role": "user", "content": user_message}]
        full_response = ""

        while True:
            current_text = ""
            tool_uses = []

            async with self._client.messages.stream(
                model=MODEL,
                max_tokens=max_tokens,
                system=system_prompt,
                tools=AGENT_TOOLS,
                messages=messages,
            ) as stream:
                async for event in stream:
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            chunk = event.delta.text
                            current_text += chunk
                            full_response += chunk
                            on_text(chunk)
                        elif hasattr(event.delta, "partial_json"):
                            # Accumulating tool input — handled in content_block_stop
                            pass

                final_message = await stream.get_final_message()

            # Collect tool use blocks from the final message
            assistant_content = []
            for block in final_message.content:
                if block.type == "text":
                    assistant_content.append({"type": "text", "text": block.text})
                elif block.type == "tool_use":
                    tool_uses.append(block)
                    assistant_content.append({
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    })

            messages.append({"role": "assistant", "content": assistant_content})

            if not tool_uses:
                # No more tool calls — agent is done
                break

            # Execute tools and build tool_result content
            tool_results = []
            for tool_use in tool_uses:
                on_tool_use(tool_use.name, tool_use.input)
                result = await self._tool_executor(tool_use.name, tool_use.input)
                on_tool_result(tool_use.name, result)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": str(result) if not isinstance(result, str) else result,
                })

            messages.append({"role": "user", "content": tool_results})

        return full_response

    async def ask(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 4096,
    ) -> str:
        """Simple one-shot message without tools or streaming."""
        message = await self._client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return message.content[0].text
