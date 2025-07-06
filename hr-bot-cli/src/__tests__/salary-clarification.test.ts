import { InterviewCoordinator } from "../interview/coordinator";
import { AgentServiceInterface } from "../agent/service";
import { CLIInterface } from "../cli/interface";
import TemplateManager from "../template/manager";
import { Template } from "../template/types";

describe("Salary Clarification Flow", () => {
  let coordinator: InterviewCoordinator;
  let mockTemplateManager: jest.Mocked<TemplateManager>;
  let mockAgentService: jest.Mocked<AgentServiceInterface>;
  let mockCLI: jest.Mocked<CLIInterface>;

  beforeEach(() => {
    mockTemplateManager = {
      getAllTemplates: jest.fn(),
      saveSelectionToDatabase: jest.fn(),
      getPromptForTemplateStep: jest.fn(),
      selectAndSaveTemplate: jest.fn(),
    } as any;

    mockAgentService = {
      initializeConversation: jest.fn(),
      addMessage: jest.fn(),
      generateResponse: jest.fn(),
      setTemplateContext: jest.fn(),
      getConversationContext: jest.fn(),
      getMessagesForConversation: jest.fn(),
      callLLM: jest.fn(),
      getTools: jest.fn().mockReturnValue([]),
    };

    mockCLI = {
      selectTemplateDropdown: jest.fn(),
      addMessage: jest.fn(),
      showProgress: jest.fn(),
      promptUser: jest.fn(),
      showConversationHistory: jest.fn(),
      exit: jest.fn(),
      handleError: jest.fn(),
      getTemplate: jest.fn(),
    } as any;
  });

  it("prompts for clarification when salary is unparseable and proceeds when valid salary is provided", async () => {
    // Arrange: set up a template step that uses SalaryValidatorTool
    const template = {
      id: "test-template",
      name: "Test Template",
      role: "Test Role",
      steps: [
        {
          id: "salary-step",
          title: "Salary",
          prompt: "What is your desired salary?",
          expectedType: "text",
          tools: ["SalaryValidatorTool"],
        },
      ],
    } as unknown as Template;

    mockTemplateManager.getAllTemplates.mockReturnValue([template]);
    mockTemplateManager.selectAndSaveTemplate.mockResolvedValue(true);
    mockTemplateManager.getPromptForTemplateStep.mockImplementation(
      (templateId, stepIndex) => {
        return template.steps[stepIndex].prompt;
      }
    );
    mockTemplateManager.getTemplate.mockReturnValue(template);

    mockAgentService.initializeConversation.mockResolvedValue({
      id: 1,
      userId: "user1",
      templateId: null,
      startedAt: new Date(),
      endedAt: null,
    });
    mockAgentService.addMessage.mockResolvedValue({
      id: 1,
      timestamp: new Date(),
      content: "",
      conversationId: 1,
      sender: "user",
      stepId: "salary-step",
    });
    mockCLI.selectTemplateDropdown.mockResolvedValue(template);
    mockCLI.showProgress.mockReturnValue(undefined);

    // Simulate LLM response for the salary step
    mockAgentService.generateResponse.mockResolvedValue({
      content: "What is your desired salary?",
    });

    // Simulate user first giving an ambiguous answer, then a valid one
    mockCLI.promptUser
      .mockResolvedValueOnce("enough") // ambiguous
      .mockResolvedValueOnce("$100000"); // valid

    const addMessageCalls: any[] = [];
    mockCLI.addMessage.mockImplementation((role, content, stepId) => {
      addMessageCalls.push({ role, content, stepId });
    });

    // Act
    coordinator = new InterviewCoordinator(
      mockTemplateManager,
      mockAgentService,
      mockCLI
    );
    await coordinator.conductInterview("user1");
    // Debug: log all assistant messages
    // eslint-disable-next-line no-console
    console.log("addMessageCalls:", addMessageCalls);

    // Assert: should prompt for clarification after ambiguous answer
    const clarificationMsg = addMessageCalls.find(
      (call) =>
        call.role === "assistant" &&
        typeof call.content === "string" &&
        call.content.toLowerCase().includes("please specify a numeric salary")
    );
    expect(clarificationMsg).toBeDefined();

    // Assert: should proceed after valid salary
    const validSalaryMsg = addMessageCalls.find(
      (call) =>
        call.role === "assistant" &&
        typeof call.content === "string" &&
        call.content.includes("within the acceptable range")
    );
    expect(validSalaryMsg).toBeDefined();
  });
});
