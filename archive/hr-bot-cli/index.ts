import { getConfig } from "./src/config";
import TemplateManager from "./src/template/manager";
import { CLIInterface } from "./src/cli/interface";
import { AgentService, AgentServiceInterface } from "./src/agent/service";
import { InterviewCoordinator } from "./src/interview/coordinator";

import { db } from "./src/db/client";
import { MessageRepository } from "./src/db/repositories/messageRepository";

interface Dependencies {
  config: any;
  templateManager: TemplateManager;
  templates: any[];
  cli: CLIInterface;
}

async function setupDependencies(): Promise<Dependencies> {
  // Load configuration
  const config = getConfig();

  // Initialize TemplateManager (which also initializes the database)
  const templateManager = await TemplateManager.init();
  await templateManager.loadTemplatesFromDatabase();
  const templates = templateManager.getAllTemplates();

  // Set up CLI interface
  const cli = new CLIInterface();

  return { config, templateManager, templates, cli };
}

function createAgentService(config: any): AgentServiceInterface {
  // Create agent config
  const agentConfig = {
    provider: config.llm.provider,
    model: config.llm.modelName,
    apiKey: config.llm.apiKey,
    contextWindow: 10,
    temperature: config.llm.temperature,
  };

  // Create agent service
  const messageRepo = new MessageRepository(db);
  return new AgentService(agentConfig, messageRepo, db);
}

async function handleTemplateSelection(
  cli: CLIInterface,
  templates: any[],
  templateManager: TemplateManager,
) {
  // Template selection
  const selectedTemplate = await cli.selectTemplateDropdown(templates);

  // User ID (stub, could be replaced with auth)
  const userId = "user123";

  // Atomic operation - no temporal coupling
  const success = await templateManager.selectAndSaveTemplate(
    selectedTemplate.id,
    userId,
  );
  if (!success) {
    throw new Error(`Failed to select template ${selectedTemplate.id}`);
  }

  return { selectedTemplate, userId };
}

async function main() {
  const { config, templateManager, templates, cli } = await setupDependencies();

  try {
    const { selectedTemplate, userId } = await handleTemplateSelection(
      cli,
      templates,
      templateManager,
    );

    // Create agent service
    const agent = createAgentService(config);

    // Create and use the InterviewCoordinator (Strangler Fig pattern completion)
    const coordinator = new InterviewCoordinator(templateManager, agent, cli);
    await coordinator.conductInterviewWithTemplate(userId, selectedTemplate);
  } catch (err) {
    cli.handleError(err);
  }
}

main();
