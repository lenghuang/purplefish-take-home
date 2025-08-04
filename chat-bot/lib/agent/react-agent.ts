// chat-bot/lib/agent/react-agent.ts
//
// This version switches to explicitly using z.ZodAny for the default "schema" to avoid
// the TS error about missing "_any" property. Some older Zod versions lack certain
// internal properties if we just do "z.any()". Casting "z.any()" to z.ZodAny can help
// align the types for the StructuredTool. Alternatively, we could define a more
// specific schema, or use z.unknown(), or z.object({}).passthrough().
//
// If your localTool.parameters is a Zod schema, keep it. Otherwise, fallback to
// "z.any() as z.ZodAny".

import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { PhaseState } from '@/db/services/drizzle-service';

import { InMemoryToolRegistry, Tool as LocalTool } from '../tools/tool-registry';

export interface AgentState {
  thoughtProcess: {
    thought: string;
    action?: string;
    observation?: string;
  }[];
  activeTools: string[];
  systemPrompt?: string;
}

export class ReActAgent {
  private toolRegistry: InMemoryToolRegistry;

  // We'll store our created agent here
  private app: ReturnType<typeof createReactAgent>;

  constructor(toolRegistry: InMemoryToolRegistry) {
    this.toolRegistry = toolRegistry;

    // Create an LLM
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY ?? '',
      temperature: 0,
    });

    // Convert local tools to "tool()" calls from @langchain/core/tools,
    // wrapping each localTool's execute logic.
    const structuredTools = this.toolRegistry.listTools().map((localTool: LocalTool) =>
      tool(
        async (args) => {
          const result = await localTool.execute(args);
          return typeof result === 'string' ? result : JSON.stringify(result);
        },
        {
          name: localTool.name,
          description: localTool.description,
          // We fallback to a "pass-through" schema if none is provided
          schema: localTool.parameters || z.object({}).passthrough(),
        },
      ),
    );

    // DEBUG LOG: List all tool names at agent construction
    // Maintenance Suggestion: For production, consider using a proper logging library.
    console.debug(
      '[ReActAgent] Constructed with tools:',
      structuredTools.map((t) => t.name || t?.description || 'unnamed'),
    );

    // Create the react agent using createReactAgent
    this.app = createReactAgent({
      llm: model,
      tools: structuredTools,
    });
  }

  /**
   * Executes one step of the conversation using createReactAgent from LangGraph.
   * We store intermediate steps in AgentState for a chain-of-thought trace.
   */
  /**
   * Executes one step of the conversation using createReactAgent from LangGraph.
   * Now accepts the full conversation history as an array of messages.
   * Each message should be: { role: 'user' | 'assistant' | 'system', content: string }
   */
  async processInput(
    messages: Array<{ role: string; content: string }>,
    agentState: AgentState,
  ): Promise<{ agentReply: string; newState: AgentState }> {
    // Invoke the agent with the full conversation history
    const agentOutput = await this.app.invoke({
      messages,
    });

    // DEBUG LOG: Print the full agent output for inspection
    // Maintenance Suggestion: For production, consider using a proper logging library or set these to console.debug.
    console.debug('[ReActAgent] messages:', JSON.stringify(messages, null, 2));
    console.debug('[ReActAgent] agentOutput:', JSON.stringify(agentOutput, null, 2));

    // The final agent reply is typically in the last AIMessage
    const lastMessage = agentOutput.messages[agentOutput.messages.length - 1];
    const agentReply = lastMessage && lastMessage.content ? lastMessage.content : '';

    // Loop through all messages to track tool calls + observations
    for (const msg of agentOutput.messages) {
      // Code Quality Suggestion: Using `as any` can sometimes hide underlying type issues.
      // Prefer a type-safe check if possible. If LangChain provides a `type` property, use it.
      // Otherwise, fallback to _getType with a comment.
      const msgType =
        typeof (msg as any)._getType === 'function'
          ? (msg as any)._getType()
          : (msg as { type?: string }).type || '';
      if (msgType === 'ai' && msg.tool_calls && msg.tool_calls.length) {
        // DEBUG LOG: Tool call found
        console.debug('[ReActAgent] Tool call detected in message:', msg.tool_calls);
        // There's an AIMessage with tool calls
        for (const tc of msg.tool_calls) {
          agentState.thoughtProcess.push({
            thought: `Agent decided to call '${tc.name}' with args ${JSON.stringify(tc.args)}`,
            action: tc.name,
          });
          agentState.activeTools.push(tc.name);
        }
      } else if (msgType === 'tool') {
        // Tool messages contain the observation result
        agentState.thoughtProcess.push({
          thought: `Observation from ${msg.name}`,
          observation: msg.content || '',
        });
      }
    }

    return {
      agentReply,
      newState: { ...agentState },
    };
  }
  /**
   * Executes one step of the conversation using the new phase state model.
   * Updates phase/question completion and answers explicitly.
   */
}
