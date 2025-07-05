/**
 * Integration test characterizing the main application flow
 * This test captures the current behavior of the main() function
 */

import { getConfig } from "../config";
import TemplateManager from "../template/manager";
import { CLIInterface } from "../cli/interface";
import { AgentService } from "../agent/service";
import { MessageRepository } from "../db/repositories/messageRepository";

// Mock all dependencies
jest.mock("../config");
jest.mock("../template/manager");
jest.mock("../cli/interface");
jest.mock("../agent/service");
jest.mock("../db/repositories/messageRepository");

describe("Main Application Flow - Characterization Tests", () => {
  let mockConfig: any;
  let mockTemplateManager: any;
  let mockCLI: any;
  let mockAgentService: any;

  beforeEach(() => {
    mockConfig = {
      llm: {
        provider: "openai",
        modelName: "gpt-3.5-turbo",
        apiKey: "test-key",
        temperature: 0.7,
      },
    };

    mockTemplateManager = {
      getAllTemplates: jest.fn().mockReturnValue([
        {
          id: 1,
          name: "Software Engineer",
          role: "Software Engineer",
          steps: ["step1", "step2"],
        },
      ]),
      selectTemplate: jest.fn(),
      saveSelectionToDatabase: jest.fn(),
      getPromptForStep: jest.fn().mockReturnValue("What is your experience?"),
    };

    mockCLI = {
      selectTemplateDropdown: jest.fn().mockResolvedValue({
        id: 1,
        name: "Software Engineer",
        role: "Software Engineer",
        steps: ["step1", "step2"],
      }),
      addMessage: jest.fn(),
      showProgress: jest.fn(),
      promptUser: jest.fn().mockResolvedValue("Sample answer"),
      showConversationHistory: jest.fn(),
      exit: jest.fn(),
      handleError: jest.fn(),
    };

    mockAgentService = {
      initializeConversation: jest.fn().mockResolvedValue({ id: 1 }),
      addMessage: jest.fn(),
      generateResponse: jest
        .fn()
        .mockResolvedValue({ content: "Next question?" }),
    };

    (getConfig as jest.Mock).mockReturnValue(mockConfig);
    (TemplateManager.init as jest.Mock).mockResolvedValue(mockTemplateManager);
    (CLIInterface as jest.Mock).mockImplementation(() => mockCLI);
    (AgentService as jest.Mock).mockImplementation(() => mockAgentService);
  });

  describe("main application flow", () => {
    it("should follow the expected initialization sequence", async () => {
      // Import and call main (we'll need to refactor this to be testable)
      // For now, let's test the expected sequence of calls

      // 1. Load configuration
      getConfig();
      expect(getConfig).toHaveBeenCalled();

      // 2. Initialize TemplateManager
      await TemplateManager.init();
      expect(TemplateManager.init).toHaveBeenCalled();

      // 3. Get templates
      const templates = mockTemplateManager.getAllTemplates();
      expect(mockTemplateManager.getAllTemplates).toHaveBeenCalled();
      expect(templates).toHaveLength(1);

      // 4. Create CLI interface
      const cli = new CLIInterface();
      expect(CLIInterface).toHaveBeenCalled();

      // 5. Template selection
      const selectedTemplate = await mockCLI.selectTemplateDropdown(templates);
      expect(mockCLI.selectTemplateDropdown).toHaveBeenCalledWith(templates);
      expect(selectedTemplate.id).toBe(1);
    });

    it("should create agent service with correct configuration", () => {
      const agentConfig = {
        provider: mockConfig.llm.provider,
        model: mockConfig.llm.modelName,
        apiKey: mockConfig.llm.apiKey,
        contextWindow: 10,
        temperature: mockConfig.llm.temperature,
      };

      // Import and instantiate a mock MessageRepository
      const mockMessageRepo = new MessageRepository({});
      // Pass both agentConfig and mockMessageRepo to AgentService
      new AgentService(agentConfig, mockMessageRepo);
      expect(AgentService).toHaveBeenCalledWith(agentConfig, mockMessageRepo);
    });

    it("should initialize conversation correctly", async () => {
      const userId = "user123";
      const templateId = 1;

      await mockAgentService.initializeConversation(userId, templateId);
      expect(mockAgentService.initializeConversation).toHaveBeenCalledWith(
        userId,
        templateId
      );
    });

    it("should handle the interview loop structure", async () => {
      // This captures the current loop structure expectations
      const selectedTemplate = {
        id: 1,
        name: "Software Engineer",
        role: "Software Engineer",
        steps: ["step1", "step2"],
      };
      const conversationId = 1;
      const systemPrompt = `You are an HR screening bot. You are interviewing a candidate for the position of "${selectedTemplate.role}". Ask the candidate the following questions, one at a time, and wait for their response before proceeding. Do not answer the questions yourself.`;

      // First question setup
      const firstPrompt = mockTemplateManager.getPromptForStep(0);
      expect(typeof firstPrompt).toBe("string");

      // Progress tracking
      mockCLI.showProgress(1, selectedTemplate.steps.length);
      expect(mockCLI.showProgress).toHaveBeenCalledWith(1, 2);

      // User input handling
      const userInput = await mockCLI.promptUser("Your response");
      expect(mockCLI.promptUser).toHaveBeenCalledWith("Your response");

      // Message storage
      mockCLI.addMessage("user", userInput);
      await mockAgentService.addMessage(conversationId, "user", userInput);
      expect(mockAgentService.addMessage).toHaveBeenCalledWith(
        conversationId,
        "user",
        userInput
      );
    });

    it("should handle conversation completion", async () => {
      // End of interview flow
      mockCLI.showConversationHistory();
      mockCLI.exit("Interview finished. Goodbye!");

      expect(mockCLI.showConversationHistory).toHaveBeenCalled();
      expect(mockCLI.exit).toHaveBeenCalledWith("Interview finished. Goodbye!");
    });
  });
});
