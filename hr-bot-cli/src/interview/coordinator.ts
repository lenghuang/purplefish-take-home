import { AgentService, AgentServiceInterface } from '../agent/service';
import { CLIInterface } from '../cli/interface';
import TemplateManager from '../template/manager';
import { Template } from '../template/types';

export interface InterviewCoordinatorDependencies {
  templateManager: TemplateManager;
  agentService: AgentServiceInterface;
  cli: CLIInterface;
}

/**
 * InterviewCoordinator - New class that will eventually replace the main() function logic
 * This follows the Strangler Fig pattern by creating new functionality alongside the old
 */
export class InterviewCoordinator {
  constructor(
    private templateManager: TemplateManager,
    private agentService: AgentServiceInterface,
    private cli: CLIInterface
  ) {}

  /**
   * Conducts the complete interview process
   * This method contains the extracted logic from main()
   */
  async conductInterview(userId: string): Promise<void> {
    try {
      // Template selection
      const templates = this.templateManager.getAllTemplates();
      const selectedTemplate = await this.cli.selectTemplateDropdown(templates);

      // Set up template context
      await this.templateManager.selectTemplate(selectedTemplate.id);
      await this.templateManager.saveSelectionToDatabase(userId);

      // Initialize conversation
      const conversation = await this.agentService.initializeConversation(
        userId,
        selectedTemplate.id
      );

      // Run the interview loop
      await this.runInterviewLoop(conversation.id, selectedTemplate, userId);

      // Finish interview
      this.cli.showConversationHistory();
      this.cli.exit('Interview finished. Goodbye!');
    } catch (err) {
      this.cli.handleError(err);
    }
  }

  /**
   * Conducts interview with pre-selected template
   * This version allows for external template selection
   */
  async conductInterviewWithTemplate(
    userId: string,
    selectedTemplate: Template
  ): Promise<void> {
    try {
      // Initialize conversation
      const conversation = await this.agentService.initializeConversation(
        userId,
        selectedTemplate.id
      );

      // Run the interview loop
      await this.runInterviewLoop(conversation.id, selectedTemplate, userId);

      // Finish interview
      this.cli.showConversationHistory();
      this.cli.exit('Interview finished. Goodbye!');
    } catch (err) {
      this.cli.handleError(err);
    }
  }

  /**
   * Runs the main interview loop
   * Extracted from the main() function for better testability and separation of concerns
   */
  private async runInterviewLoop(
    conversationId: number,
    selectedTemplate: Template,
    userId: string
  ): Promise<void> {
    const systemPrompt = `You are an HR screening bot. You are interviewing a candidate for the position of "${
      selectedTemplate.role || selectedTemplate.name
    }". Ask the candidate the following questions, one at a time, and wait for their response before proceeding. Do not answer the questions yourself.`;

    let finished = false;
    let stepIndex = 0;
    const totalSteps = selectedTemplate.steps.length;

    // Handle first question
    await this.handleFirstQuestion(conversationId, stepIndex, totalSteps);
    stepIndex++;

    // Handle subsequent questions
    while (!finished && stepIndex < totalSteps) {
      await this.handleSubsequentQuestion(
        conversationId,
        selectedTemplate,
        stepIndex,
        totalSteps,
        systemPrompt
      );
      stepIndex++;
      finished = stepIndex >= totalSteps;
    }
  }

  /**
   * Handles the first question of the interview
   */
  private async handleFirstQuestion(
    conversationId: number,
    stepIndex: number,
    totalSteps: number
  ): Promise<void> {
    const firstPrompt = this.templateManager.getPromptForStep(stepIndex);
    const promptToShow = (typeof firstPrompt === 'string' && firstPrompt) 
      ? firstPrompt 
      : "Let's get started!";

    this.cli.addMessage('assistant', promptToShow);
    await this.agentService.addMessage(conversationId, 'assistant', promptToShow);
    this.cli.showProgress(stepIndex + 1, totalSteps);

    const userInput = await this.cli.promptUser('Your response');
    this.cli.addMessage('user', userInput);
    await this.agentService.addMessage(conversationId, 'user', userInput);
  }

  /**
   * Handles subsequent questions using LLM generation
   */
  private async handleSubsequentQuestion(
    conversationId: number,
    selectedTemplate: Template,
    stepIndex: number,
    totalSteps: number,
    systemPrompt: string
  ): Promise<void> {
    const prompt = this.templateManager.getPromptForStep(stepIndex);
    
    const templatePrompt = {
      templateId: selectedTemplate.id,
      variables: {},
      userPrompt: prompt || '',
      systemPrompt,
    };

    const llmResponse = await this.agentService.generateResponse(
      conversationId,
      templatePrompt
    );
    
    this.cli.addMessage('assistant', llmResponse.content);
    await this.agentService.addMessage(conversationId, 'assistant', llmResponse.content);
    this.cli.showProgress(stepIndex + 1, totalSteps);

    const userInput = await this.cli.promptUser('Your response');
    this.cli.addMessage('user', userInput);
    await this.agentService.addMessage(conversationId, 'user', userInput);
  }
}

/**
 * Factory function to create InterviewCoordinator with proper dependencies
 * This follows the dependency injection pattern
 */
export async function createInterviewCoordinator(
  templateManager: TemplateManager,
  agentService: AgentServiceInterface,
  cli: CLIInterface
): Promise<InterviewCoordinator> {
  return new InterviewCoordinator(templateManager, agentService, cli);
}