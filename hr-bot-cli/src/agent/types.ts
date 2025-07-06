import { conversations, messages } from "../db/schema";
import { InferModel } from "drizzle-orm";
type Conversation = InferModel<typeof conversations>;
type Message = InferModel<typeof messages>;

/**
 * Agent configuration options (e.g., LLM provider, model, API key, context window, etc.)
 */
export interface AgentConfig {
  provider: "openai" | "azure" | "anthropic" | "local";
  model: string;
  apiKey: string;
  contextWindow: number;
  temperature?: number;
  topP?: number;
  [key: string]: any;
}

/**
 * Conversation context, including conversation metadata and message history.
 */
export interface ConversationContext {
  conversation: Conversation;
  messages: Message[];
  // Optionally, add derived fields (e.g., summary, lastUserMessage, etc.)
}

/**
 * Message format for agent/LLM interaction.
 */
export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string; // For system or tool messages
  timestamp?: Date;
}

/**
 * Template-specific prompt structure.
 * This can be extended as needed for different prompt templates.
 */
export interface TemplatePrompt {
  templateId: number;
  variables: Record<string, any>;
  systemPrompt?: string;
  userPrompt: string;
  // Optionally, add fields for step, context, etc.
}

/**
 * Interface for agent tools (e.g., SalaryValidatorTool, NegotiationTool).
 * Tools can inspect the conversation context and prompt, and decide whether to act.
 */
export interface InterviewTool {
  /** Unique name or identifier for the tool */
  name: string;
  /**
   * Determines if the tool should be invoked for the given context and prompt.
   * Return true if the tool should handle this step.
   */
  matches(params: {
    context: ConversationContext;
    templatePrompt: TemplatePrompt;
    stepId: string;
  }): boolean | Promise<boolean>;
  /**
   * Executes the tool and returns a result string to be injected into the LLM context.
   * The result will be added as a system message before the LLM is called.
   */
  execute(params: {
    context: ConversationContext;
    templatePrompt: TemplatePrompt;
    stepId: string;
  }): Promise<string>;
}

/**
 * LLM response format.
 */
export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw?: any; // Raw response from the LLM provider
}
