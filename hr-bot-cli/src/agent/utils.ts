import {
  AgentConfig,
  AgentMessage,
  ConversationContext,
  TemplatePrompt,
  LLMResponse,
} from "./types";

/**
 * Trims the message history to fit within the context window.
 * Returns the most recent N messages, where N = config.contextWindow.
 */
export function trimContextWindow(
  messages: AgentMessage[],
  contextWindow: number,
): AgentMessage[] {
  if (messages.length <= contextWindow) return messages;
  return messages.slice(-contextWindow);
}

/**
 * Formats a prompt for the LLM using a template and variables.
 * Supports system and user prompts.
 */
export function formatPrompt(templatePrompt: TemplatePrompt): AgentMessage[] {
  const { systemPrompt, userPrompt, variables } = templatePrompt;
  // Simple variable interpolation: replace {{var}} with variables[var]
  const interpolate = (str: string) =>
    str.replace(/{{\s*(\w+)\s*}}/g, (_, v) => variables[v] ?? "");

  const messages: AgentMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: interpolate(systemPrompt) });
  }
  messages.push({ role: "user", content: interpolate(userPrompt) });
  return messages;
}

/**
 * Parses the LLM response, extracting content and usage if available.
 */
export function parseLLMResponse(raw: any): LLMResponse {
  if (!raw) return { content: "" };
  // OpenAI/Anthropic/Generic: try to extract content and usage
  if (raw.choices && raw.choices[0]?.message?.content) {
    return {
      content: raw.choices[0].message.content,
      usage: raw.usage,
      raw,
    };
  }
  if (raw.completion) {
    return {
      content: raw.completion,
      usage: raw.usage,
      raw,
    };
  }
  // Fallback: try to extract content field
  return {
    content: raw.content ?? String(raw),
    raw,
  };
}
