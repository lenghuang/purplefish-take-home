import { getConfig } from "./src/config";
import TemplateManager from "./src/template/manager";
import { CLIInterface } from "./src/cli/interface";
import { AgentService, AgentServiceInterface } from "./src/agent/service";

async function main() {
  // Load configuration
  const config = getConfig();

  // Initialize TemplateManager (which also initializes the database)
  const templateManager = await TemplateManager.init();
  const templates = templateManager.getAllTemplates();

  // Set up CLI interface
  const cli = new CLIInterface();

  try {
    // Template selection
    const selectedTemplate = await cli.selectTemplateDropdown(templates);

    // User ID (stub, could be replaced with auth)
    const userId = "user123";

    // Create agent config
    const agentConfig = {
      provider: config.llm.provider,
      model: config.llm.modelName,
      apiKey: config.llm.apiKey,
      contextWindow: 10,
      temperature: config.llm.temperature,
    };

    // Create agent service
    const agent: AgentServiceInterface = new AgentService(agentConfig);

    // Initialize conversation
    const conversation = await agent.initializeConversation(
      userId,
      selectedTemplate.id
    );

    // Interview loop
    let finished = false;
    let stepIndex = 0;
    const totalSteps = selectedTemplate.steps.length;

    while (!finished) {
      // Get prompt for current step
      const prompt = templateManager.getPromptForStep(stepIndex);
      if (prompt) {
        cli.addMessage("assistant", prompt);
      }

      cli.showProgress(stepIndex + 1, totalSteps);

      const userInput = await cli.promptUser("Your response");
      cli.addMessage("user", userInput);

      // Add user message to conversation
      await agent.addMessage(conversation.id, "user", userInput);

      // Generate LLM response
      const templatePrompt = {
        templateId: selectedTemplate.id,
        variables: {},
        userPrompt: prompt || "",
      };
      const llmResponse = await agent.generateResponse(
        conversation.id,
        templatePrompt
      );
      cli.addMessage("assistant", llmResponse.content);

      stepIndex++;
      finished = stepIndex >= totalSteps;
    }

    cli.showConversationHistory();
    cli.exit("Interview finished. Goodbye!");
  } catch (err) {
    cli.handleError(err);
  }
}

main();
