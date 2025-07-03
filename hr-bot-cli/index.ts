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
    await templateManager.selectTemplate(selectedTemplate.id);
    await templateManager.saveSelectionToDatabase(userId);

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

    // Add a system prompt to instruct the LLM to act as the interviewer
    const systemPrompt = `You are an HR screening bot. You are interviewing a candidate for the position of "${
      selectedTemplate.role || selectedTemplate.name
    }". Ask the candidate the following questions, one at a time, and wait for their response before proceeding. Do not answer the questions yourself.`;
    // Interview loop
    let finished = false;
    let stepIndex = 0;
    const totalSteps = selectedTemplate.steps.length;

    // First question
    const firstPrompt = templateManager.getPromptForStep(stepIndex);
    if (typeof firstPrompt === "string" && firstPrompt) {
      cli.addMessage("assistant", firstPrompt);
      await agent.addMessage(conversation.id, "assistant", firstPrompt);
    } else {
      cli.addMessage("assistant", "Let's get started!");
      await agent.addMessage(
        conversation.id,
        "assistant",
        "Let's get started!"
      );
    }
    cli.showProgress(stepIndex + 1, totalSteps);

    let userInput = await cli.promptUser("Your response");
    cli.addMessage("user", userInput);
    await agent.addMessage(conversation.id, "user", userInput);

    stepIndex++;

    // For subsequent steps, let the LLM generate the next question based on conversation history
    while (!finished && stepIndex < totalSteps) {
      const prompt = templateManager.getPromptForStep(stepIndex);

      // Use the template prompt as context for the LLM, but now the LLM can see the user's previous answer
      const templatePrompt = {
        templateId: selectedTemplate.id,
        variables: {},
        userPrompt: prompt || "",
        systemPrompt, // Always include the system prompt
      };

      const llmResponse = await agent.generateResponse(
        conversation.id,
        templatePrompt
      );
      cli.addMessage("assistant", llmResponse.content);
      await agent.addMessage(conversation.id, "assistant", llmResponse.content);

      cli.showProgress(stepIndex + 1, totalSteps);

      userInput = await cli.promptUser("Your response");
      cli.addMessage("user", userInput);
      await agent.addMessage(conversation.id, "user", userInput);

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
