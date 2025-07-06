import {
  AgentConfig,
  ConversationContext,
  AgentMessage,
  TemplatePrompt,
  LLMResponse,
} from "./types";
import type { InterviewTool } from "./types";
import { conversations, messages } from "../db/schema";
import { trimContextWindow, formatPrompt, parseLLMResponse } from "./utils";
import { ConversationRepository } from "../db/repositories/conversationRepository";
import { InferSelectModel } from "drizzle-orm";
// LangChain imports for OpenAI chat
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";

type Conversation = InferSelectModel<typeof conversations>;
type Message = InferSelectModel<typeof messages>;

export interface AgentServiceInterface {
  getTools(): InterviewTool[];
  setTemplateContext(
    sessionId: number,
    template: import("../template/types").Template
  ): Promise<void>;
  initializeConversation(
    userId: string,
    templateId: number
  ): Promise<Conversation>;
  getConversationContext(
    conversationId: number
  ): Promise<ConversationContext | null>;
  addMessage(
    conversationId: number,
    sender: "user" | "assistant",
    content: string,
    stepId: string
  ): Promise<Message>;
  getMessagesForConversation(conversationId: number): Promise<Message[]>;
  generateResponse(
    conversationId: number,
    templatePrompt: TemplatePrompt,
    stepId: string,
    tools?: string[]
  ): Promise<LLMResponse>;
  callLLM(messages: AgentMessage[]): Promise<any>;
}

/**
 * AgentService handles LLM integration, context management, and DB persistence.
 */
/**
 * Tool: SalaryValidatorTool
 * Checks if a candidate's desired salary is within an acceptable range.
 */
class SalaryValidatorTool implements InterviewTool {
  name = "SalaryValidatorTool";
  // Acceptable salary range (could be dynamic/configurable)
  private minSalary = 70000;
  private maxSalary = 200000;

  matches({
    templatePrompt,
  }: {
    context: ConversationContext;
    templatePrompt: TemplatePrompt;
    stepId: string;
  }): boolean {
    // Simple keyword-based detection for salary-related prompts/answers
    const text = (templatePrompt?.userPrompt || "").toLowerCase();
    return /salary|compensation|pay|expected compensation|desired salary/.test(
      text
    );
  }

  async execute({
    context,
    templatePrompt,
  }: {
    context: ConversationContext;
    templatePrompt: TemplatePrompt;
    stepId: string;
  }): Promise<string> {
    // Try to extract a number from the prompt (very basic)
    const text = templatePrompt?.userPrompt || "";
    const match = text.match(/\$?(\d{2,6})/);
    if (match) {
      const salary = parseInt(match[1], 10);
      if (salary < this.minSalary) {
        return `The desired salary of $${salary} is below the acceptable range for this position.`;
      } else if (salary > this.maxSalary) {
        return `The desired salary of $${salary} is above the acceptable range for this position.`;
      } else {
        return `The desired salary of $${salary} is within the acceptable range.`;
      }
    }
    return "clarification_needed: Could you please specify a numeric salary amount?";
  }
}

/**
 * Tool: NegotiationTool
 * Generates negotiation prompts or responses for salary discussions.
 */
class NegotiationTool implements InterviewTool {
  name = "NegotiationTool";

  matches({
    templatePrompt,
  }: {
    context: ConversationContext;
    templatePrompt: TemplatePrompt;
    stepId: string;
  }): boolean {
    // Detect negotiation intent (simple keyword-based)
    const text = (templatePrompt?.userPrompt || "").toLowerCase();
    return /negotiate|counter offer|is that flexible|room for negotiation|can you do better|can you increase|can you match|can you improve/.test(
      text
    );
  }

  async execute({
    context,
    templatePrompt,
  }: {
    context: ConversationContext;
    templatePrompt: TemplatePrompt;
    stepId: string;
  }): Promise<string> {
    // Basic negotiation response
    return "Negotiation detected: Consider discussing the offer details, highlighting your unique skills, or asking about other forms of compensation (e.g., benefits, bonuses, equity).";
  }
}

export class AgentService implements AgentServiceInterface {
  private config: AgentConfig;
  private conversationRepo: ConversationRepository;
  private messageRepo: import("../db/repositories/messageRepository").MessageRepository;
  // Placeholder for LLM client (to be implemented with actual provider)
  private llmClient: any;

  // Tool registry for InterviewTools
  private tools: InterviewTool[] = [];

  /**
   * Register a new InterviewTool.
   */
  public registerTool(tool: InterviewTool): void {
    this.tools.push(tool);
  }

  /**
   * Get all registered InterviewTools.
   */
  public getTools(): InterviewTool[] {
    return this.tools.slice();
  }

  constructor(
    config: AgentConfig,
    messageRepo: import("../db/repositories/messageRepository").MessageRepository,
    db: any
  ) {
    this.config = config;
    this.conversationRepo = new ConversationRepository(db);
    this.messageRepo = messageRepo;

    // Initialize LangChain ChatOpenAI client
    this.llmClient = new ChatOpenAI({
      openAIApiKey: config.apiKey,
      modelName: config.model,
      temperature: config.temperature ?? 0.7,
    });
    // Register InterviewTools
    this.registerTool(new SalaryValidatorTool());
    this.registerTool(new NegotiationTool());
  }

  /**
   * Sets the template context for a session (conversation).
   * Updates the templateId for the given sessionId (conversationId).
   */
  async setTemplateContext(
    sessionId: number,
    template: import("../template/types").Template
  ): Promise<void> {
    try {
      await this.conversationRepo.update(sessionId, {
        templateId: template.id,
        // No updatedAt in schema, so omit if not present
      });
    } catch (err) {
      console.error("Failed to set template context:", err);
      throw err;
    }
  }

  /**
   * Initializes a new conversation and persists it.
   */
  async initializeConversation(
    userId: string,
    templateId: number
  ): Promise<Conversation> {
    const conversationData = {
      userId,
      templateId,
      startedAt: new Date(),
      // endedAt: null, // optional
    };
    return await this.conversationRepo.create(conversationData);
  }

  /**
   * Retrieves the full conversation context (conversation + messages).
   */
  async getConversationContext(
    conversationId: number
  ): Promise<ConversationContext | null> {
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) return null;
    const messages = await this.getMessagesForConversation(conversationId);
    return {
      conversation,
      messages,
    };
  }

  /**
   * Adds a message to the conversation (persists to DB).
   */
  async addMessage(
    conversationId: number,
    sender: "user" | "assistant",
    content: string,
    stepId: string = "other"
  ): Promise<Message> {
    const messageData = {
      conversationId,
      sender,
      content,
      stepId,
      timestamp: new Date(),
    };
    const result = await this.messageRepo.create(messageData);
    return result;
  }

  /**
   * Retrieves all messages for a conversation, ordered by timestamp.
   */
  async getMessagesForConversation(conversationId: number): Promise<Message[]> {
    return await this.messageRepo.findByConversation(conversationId);
  }

  /**
   * Generates an LLM response for a given conversation and prompt.
   * - Loads context/history
   * - Formats prompt
   * - Calls LLM (placeholder)
   * - Persists assistant message
   * - Returns LLM response
   */
  async generateResponse(
    conversationId: number,
    templatePrompt: TemplatePrompt,
    stepId: string,
    tools?: string[]
  ): Promise<LLMResponse> {
    const context = await this.getConversationContext(conversationId);
    if (!context) throw new Error("Conversation not found");

    // Prepare message history for LLM (trimmed to context window)
    const history: AgentMessage[] = context.messages.map((m) => ({
      role: m.sender as "user" | "assistant" | "system",
      content: m.content,
      timestamp: m.timestamp,
    }));
    const trimmedHistory = trimContextWindow(
      history,
      this.config.contextWindow
    );

    // Tool invocation: check if any registered tool matches this step/context
    let toolResult: string | null = null;
    // If tools are specified, filter to only those tools
    const availableTools = tools
      ? this.tools.filter((tool) => tools.includes(tool.constructor.name))
      : this.tools;
    for (const tool of availableTools) {
      // Only the first matching tool is invoked for now
      // (Extensible for multiple tools in the future)
      const shouldInvoke = await tool.matches({
        context,
        templatePrompt,
        stepId,
      });
      if (shouldInvoke) {
        toolResult = await tool.execute({
          context,
          templatePrompt,
          stepId,
        });
        break;
      }
    }

    // Format the new prompt
    const promptMessages = formatPrompt(templatePrompt);

    // If a tool was invoked, inject its result as a system message before the prompt
    let llmMessages: AgentMessage[];
    if (toolResult) {
      llmMessages = [
        ...trimmedHistory,
        { role: "system", content: `[Tool: ${toolResult}]` },
        ...promptMessages,
      ];
    } else {
      llmMessages = [...trimmedHistory, ...promptMessages];
    }

    // Call the LLM (placeholder)
    const rawResponse = await this.callLLM(llmMessages);

    // Parse and persist the assistant's response
    const llmResponse = parseLLMResponse(rawResponse);
    await this.addMessage(
      conversationId,
      "assistant",
      llmResponse.content,
      stepId
    );

    return llmResponse;
  }

  /**
   * Placeholder for LLM API call.
   * Replace with actual LLM provider integration.
   */
  async callLLM(messages: AgentMessage[]): Promise<any> {
    // Map AgentMessage[] to LangChain message objects
    const lcMessages = messages.map((msg) => {
      switch (msg.role) {
        case "system":
          return new SystemMessage(msg.content);
        case "assistant":
          return new AIMessage(msg.content);
        case "user":
        default:
          return new HumanMessage(msg.content);
      }
    });

    // Call the LLM using LangChain
    const response = await this.llmClient.call(lcMessages);

    // LangChain's response is a BaseMessage, but we want to match OpenAI's format
    return {
      choices: [{ message: { content: response.content } }],
      usage: response?.llmOutput?.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }
}

export { SalaryValidatorTool };
