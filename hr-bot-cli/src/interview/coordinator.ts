import { AgentService, AgentServiceInterface } from "../agent/service";
import { CLIInterface } from "../cli/interface";
import TemplateManager from "../template/manager";
import { Template } from "../template/types";

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
      await this.templateManager.selectAndSaveTemplate(
        selectedTemplate.id,
        userId
      );

      // Initialize conversation
      const conversation = await this.agentService.initializeConversation(
        userId,
        selectedTemplate.id
      );

      // Run the interview loop
      await this.runInterviewLoop(conversation.id, selectedTemplate, userId);

      // Finish interview
      await this.cli.showConversationHistory(conversation.id);
      this.cli.exit("Interview finished. Goodbye!");
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
      await this.cli.showConversationHistory(conversation.id);
      this.cli.exit("Interview finished. Goodbye!");
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

    const totalSteps = selectedTemplate.steps.length;

    for (let stepIndex = 0; stepIndex < totalSteps; stepIndex++) {
      await this.handleQuestion(
        conversationId,
        selectedTemplate.id,
        stepIndex,
        totalSteps,
        stepIndex === 0 ? undefined : systemPrompt
      );
    }
  }

  /**
   * Handles a question in the interview (unified for first and subsequent steps)
   */
  private async handleQuestion(
    conversationId: number,
    templateId: number,
    stepIndex: number,
    totalSteps: number,
    systemPrompt?: string
  ): Promise<void> {
    const prompt = this.templateManager.getPromptForTemplateStep(
      templateId,
      stepIndex
    );
    const promptToShow =
      typeof prompt === "string" && prompt ? prompt : "Let's get started!";

    // Determine stepId for prompt
    let stepId = "other";
    const template = this.templateManager.getTemplate(templateId);
    if (template && template.steps && template.steps[stepIndex]) {
      stepId = template.steps[stepIndex].id;
    }

    let questionText = promptToShow;

    // For subsequent questions, use LLM to generate the question with systemPrompt
    if (systemPrompt) {
      const templatePrompt = {
        templateId: templateId,
        variables: {},
        userPrompt: promptToShow,
        systemPrompt,
      };
      const llmResponse = await this.agentService.generateResponse(
        conversationId,
        templatePrompt,
        stepId
      );
      questionText = llmResponse.content;
    }

    this.cli.addMessage("assistant", questionText, stepId);
    this.cli.showProgress(stepIndex + 1, totalSteps);

    const userInput = await this.cli.promptUser("Your response");
    this.cli.addMessage("user", userInput, stepId);
    await this.agentService.addMessage(
      conversationId,
      "user",
      userInput,
      stepId
    );
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
