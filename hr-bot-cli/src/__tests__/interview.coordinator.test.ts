import { InterviewCoordinator } from '../interview/coordinator';
import { AgentServiceInterface } from '../agent/service';
import { CLIInterface } from '../cli/interface';
import TemplateManager from '../template/manager';
import { Template } from '../template/types';

describe('InterviewCoordinator - Characterization Tests', () => {
  let coordinator: InterviewCoordinator;
  let mockTemplateManager: jest.Mocked<TemplateManager>;
  let mockAgentService: jest.Mocked<AgentServiceInterface>;
  let mockCLI: jest.Mocked<CLIInterface>;

  beforeEach(() => {
    // Create mock dependencies
    mockTemplateManager = {
      getAllTemplates: jest.fn(),
      selectTemplate: jest.fn(),
      saveSelectionToDatabase: jest.fn(),
      getPromptForStep: jest.fn(),
    } as any;

    mockAgentService = {
      initializeConversation: jest.fn(),
      addMessage: jest.fn(),
      generateResponse: jest.fn(),
      setTemplateContext: jest.fn(),
      getConversationContext: jest.fn(),
      getMessagesForConversation: jest.fn(),
      callLLM: jest.fn(),
    };

    mockCLI = {
      selectTemplateDropdown: jest.fn(),
      addMessage: jest.fn(),
      showProgress: jest.fn(),
      promptUser: jest.fn(),
      showConversationHistory: jest.fn(),
      exit: jest.fn(),
      handleError: jest.fn(),
    } as any;

    coordinator = new InterviewCoordinator(
      mockTemplateManager,
      mockAgentService,
      mockCLI
    );
  });

  describe('conductInterview', () => {
    const mockTemplate: Template = {
      id: 1,
      name: 'Test Template',
      description: 'Test Description',
      role: 'Test Role',
      steps: [
        { id: 'step1', title: 'Step 1', prompt: 'Question 1' },
        { id: 'step2', title: 'Step 2', prompt: 'Question 2' },
      ],
    };

    beforeEach(() => {
      mockTemplateManager.getAllTemplates.mockReturnValue([mockTemplate]);
      mockCLI.selectTemplateDropdown.mockResolvedValue(mockTemplate);
      mockTemplateManager.selectTemplate.mockReturnValue(true);
      mockTemplateManager.saveSelectionToDatabase.mockResolvedValue(undefined);
      mockAgentService.initializeConversation.mockResolvedValue({ id: 1 } as any);
      mockTemplateManager.getPromptForStep.mockReturnValue('Test question');
      mockCLI.promptUser.mockResolvedValue('Test answer');
      mockAgentService.generateResponse.mockResolvedValue({ content: 'Next question' });
    });

    it('should conduct complete interview flow', async () => {
      await coordinator.conductInterview('user123');

      // Verify the flow
      expect(mockTemplateManager.getAllTemplates).toHaveBeenCalled();
      expect(mockCLI.selectTemplateDropdown).toHaveBeenCalled();
      expect(mockTemplateManager.selectTemplate).toHaveBeenCalledWith(1);
      expect(mockTemplateManager.saveSelectionToDatabase).toHaveBeenCalledWith('user123');
      expect(mockAgentService.initializeConversation).toHaveBeenCalledWith('user123', 1);
      expect(mockCLI.showConversationHistory).toHaveBeenCalled();
      expect(mockCLI.exit).toHaveBeenCalledWith('Interview finished. Goodbye!');
    });

    it('should handle first question correctly', async () => {
      await coordinator.conductInterview('user123');

      // Verify first question handling
      expect(mockTemplateManager.getPromptForStep).toHaveBeenCalledWith(0);
      expect(mockCLI.addMessage).toHaveBeenCalledWith('assistant', 'Test question');
      expect(mockAgentService.addMessage).toHaveBeenCalledWith(1, 'assistant', 'Test question');
      expect(mockCLI.showProgress).toHaveBeenCalledWith(1, 2);
      expect(mockCLI.promptUser).toHaveBeenCalledWith('Your response');
    });

    it('should handle subsequent questions with LLM', async () => {
      await coordinator.conductInterview('user123');

      // Should call generateResponse for subsequent questions
      expect(mockAgentService.generateResponse).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          templateId: 1,
          variables: {},
          userPrompt: 'Test question',
          systemPrompt: expect.stringContaining('You are an HR screening bot'),
        })
      );
    });

    it('should handle errors correctly', async () => {
      const error = new Error('Test error');
      mockTemplateManager.getAllTemplates.mockImplementation(() => {
        throw error;
      });

      await coordinator.conductInterview('user123');

      expect(mockCLI.handleError).toHaveBeenCalledWith(error);
    });
  });

  describe('integration with existing behavior', () => {
    it('should match the original main() function behavior', async () => {
      // This test ensures that the new coordinator behaves exactly like the original main()
      const mockTemplate: Template = {
        id: 1,
        name: 'Software Engineer',
        description: 'Test',
        role: 'Software Engineer',
        steps: [{ id: 'step1', title: 'Step 1', prompt: 'Question 1' }],
      };

      mockTemplateManager.getAllTemplates.mockReturnValue([mockTemplate]);
      mockCLI.selectTemplateDropdown.mockResolvedValue(mockTemplate);
      mockTemplateManager.selectTemplate.mockReturnValue(true);
      mockAgentService.initializeConversation.mockResolvedValue({ id: 1 } as any);
      mockTemplateManager.getPromptForStep.mockReturnValue('What is your experience?');
      mockCLI.promptUser.mockResolvedValue('5 years');

      await coordinator.conductInterview('user123');

      // Verify the exact sequence matches the original main() function
      expect(mockTemplateManager.getAllTemplates).toHaveBeenCalledTimes(1);
      expect(mockCLI.selectTemplateDropdown).toHaveBeenCalledTimes(1);
      expect(mockTemplateManager.selectTemplate).toHaveBeenCalledWith(1);
      expect(mockTemplateManager.saveSelectionToDatabase).toHaveBeenCalledWith('user123');
      expect(mockAgentService.initializeConversation).toHaveBeenCalledWith('user123', 1);
      expect(mockCLI.showConversationHistory).toHaveBeenCalledTimes(1);
      expect(mockCLI.exit).toHaveBeenCalledWith('Interview finished. Goodbye!');
    });
  });
});