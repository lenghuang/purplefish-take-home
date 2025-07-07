import { AgentService } from "../agent/service";
import { AgentConfig } from "../agent/types";
import { MessageRepository } from "../db/repositories/messageRepository";

// Mock dependencies
jest.mock("../db/repositories/conversationRepository");
jest.mock("../db/repositories/messageRepository");
jest.mock("@langchain/openai");

describe("AgentService - Characterization Tests", () => {
  let mockConfig: AgentConfig;
  let agentService: AgentService;

  beforeEach(() => {
    mockConfig = {
      provider: "openai",
      model: "gpt-3.5-turbo",
      apiKey: "test-key",
      contextWindow: 10,
      temperature: 0.7,
    };

    // Mock the require() calls in AgentService constructor
    jest.doMock("../db/repositories/messageRepository", () => ({
      MessageRepository: jest.fn().mockImplementation((db) => ({
        create: jest
          .fn()
          .mockResolvedValue({ id: 1, content: "test", sender: "user" }),
        findByConversation: jest.fn().mockResolvedValue([]),
      })),
    }));

    // Import MessageRepository for proper typing
    const mockMessageRepo = new MessageRepository({});
    mockMessageRepo.create = jest.fn();
    mockMessageRepo.findByConversation = jest.fn();
    const mockDb = {};
    agentService = new AgentService(mockConfig, mockMessageRepo, mockDb);
  });

  describe("initialization", () => {
    it("should create an AgentService with correct config", () => {
      expect(agentService).toBeDefined();
      expect(agentService["config"]).toEqual(mockConfig);
    });

    it("should initialize repositories via require()", () => {
      expect(agentService["conversationRepo"]).toBeDefined();
      expect(agentService["messageRepo"]).toBeDefined();
    });
  });

  describe("initializeConversation", () => {
    it("should create a conversation with correct data structure", async () => {
      const mockConversation = {
        id: 1,
        userId: "user123",
        templateId: 1,
        startedAt: new Date(),
      };

      agentService["conversationRepo"].create = jest
        .fn()
        .mockResolvedValue(mockConversation);

      const result = await agentService.initializeConversation("user123", 1);

      expect(agentService["conversationRepo"].create).toHaveBeenCalledWith({
        userId: "user123",
        templateId: 1,
        startedAt: expect.any(Date),
      });
      expect(result).toEqual(mockConversation);
    });
  });

  describe("addMessage", () => {
    it("should add message with correct structure", async () => {
      const mockMessage = {
        id: 1,
        conversationId: 1,
        sender: "user",
        content: "Hello",
        timestamp: new Date(),
      };

      agentService["messageRepo"].create = jest
        .fn()
        .mockResolvedValue(mockMessage);

      const result = await agentService.addMessage(1, "user", "Hello", "other");

      expect(agentService["messageRepo"].create).toHaveBeenCalledWith({
        conversationId: 1,
        sender: "user",
        content: "Hello",
        timestamp: expect.any(Date),
      });
      expect(result).toEqual(mockMessage);
    });
  });

  describe("getConversationContext", () => {
    it("should return null for non-existent conversation", async () => {
      agentService["conversationRepo"].findById = jest
        .fn()
        .mockResolvedValue(null);

      const result = await agentService.getConversationContext(999);

      expect(result).toBeNull();
    });

    it("should return conversation context with messages", async () => {
      const mockConversation = { id: 1, userId: "user123", templateId: 1 };
      const mockMessages = [{ id: 1, content: "Hello", sender: "user" }];

      agentService["conversationRepo"].findById = jest
        .fn()
        .mockResolvedValue(mockConversation);
      agentService.getMessagesForConversation = jest
        .fn()
        .mockResolvedValue(mockMessages);

      const result = await agentService.getConversationContext(1);

      expect(result).toEqual({
        conversation: mockConversation,
        messages: mockMessages,
      });
    });
  });
});
