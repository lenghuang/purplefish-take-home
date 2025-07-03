import {
  AgentConfig,
  ConversationContext,
  AgentMessage,
  TemplatePrompt,
  LLMResponse,
} from "./types";
import { conversations, messages } from "../db/schema";
import { trimContextWindow, formatPrompt, parseLLMResponse } from "./utils";
import { ConversationRepository } from "../db/repositories/conversationRepository";
import { InferModel } from "drizzle-orm";

type Conversation = InferModel<typeof conversations>;
type Message = InferModel<typeof messages>;

export interface AgentServiceInterface {
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
    content: string
  ): Promise<Message>;
  getMessagesForConversation(conversationId: number): Promise<Message[]>;
  generateResponse(
    conversationId: number,
    templatePrompt: TemplatePrompt
  ): Promise<LLMResponse>;
  callLLM(messages: AgentMessage[]): Promise<any>;
}

/**
 * AgentService handles LLM integration, context management, and DB persistence.
 */
export class AgentService implements AgentServiceInterface {
  private config: AgentConfig;
  private conversationRepo: ConversationRepository;
  private messageRepo: import("../db/repositories/messageRepository").MessageRepository;
  // Placeholder for LLM client (to be implemented with actual provider)
  private llmClient: any;

  constructor(config: AgentConfig) {
    this.config = config;
    this.conversationRepo = new ConversationRepository();
    this.messageRepo =
      new (require("../db/repositories/messageRepository").MessageRepository)();
    // this.llmClient = ... // Initialize LLM client here
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
    content: string
  ): Promise<Message> {
    const messageData = {
      conversationId,
      sender,
      content,
      timestamp: new Date(),
    };
    return await this.messageRepo.create(messageData);
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
    templatePrompt: TemplatePrompt
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

    // Format the new prompt
    const promptMessages = formatPrompt(templatePrompt);

    // Compose the full prompt for the LLM
    const llmMessages = [...trimmedHistory, ...promptMessages];

    // Call the LLM (placeholder)
    const rawResponse = await this.callLLM(llmMessages);

    // Parse and persist the assistant's response
    const llmResponse = parseLLMResponse(rawResponse);
    await this.addMessage(conversationId, "assistant", llmResponse.content);

    return llmResponse;
  }

  /**
   * Placeholder for LLM API call.
   * Replace with actual LLM provider integration.
   */
  async callLLM(messages: AgentMessage[]): Promise<any> {
    // Example: return await this.llmClient.chat({ messages, ...this.config });
    return {
      choices: [{ message: { content: "[LLM response placeholder]" } }],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }
}
