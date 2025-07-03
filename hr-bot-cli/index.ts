import { config } from "dotenv";
import * as readline from "readline";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { Tool } from "langchain/tools";

import { DatabaseService } from "./src/database/database-service";
import { TemplateManager } from "./src/template-system/template-manager";
import { InteractionManager } from "./src/template-system/interaction/interaction-manager";
import { Template, Step } from "./src/template-system/types";
import { Interview } from "./src/database/types";
import { icuNurseTemplate } from "./src/template-system/example-templates/icu-nurse";
import { ToolRegistry } from "./src/template-system/tool-registry";

config(); // loads .env → process.env

class InterviewAgent {
  private conversationHistory: {
    role: "user" | "assistant";
    content: string;
  }[] = [];
  private interviewId!: string;
  private template: Template;
  private toolRegistry: ToolRegistry;

  constructor(
    private templateManager: TemplateManager,
    private interactionManager: InteractionManager,
    private databaseService: DatabaseService,
    private userId: string,
    templateId: string,
    private llm?: ChatOpenAI
  ) {
    const template = this.templateManager.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    this.template = template;
    this.toolRegistry = new ToolRegistry();

    if (!this.llm) {
      throw new Error("LLM instance is required for InterviewAgent");
    }
  }

  async start() {
    const interviewRepo = this.databaseService.getInterviewRepository();
    const interview = await interviewRepo.create({
      id: `interview_${Date.now()}`,
      templateId: this.template.id,
      userId: this.userId,
      status: "active",
      currentStepId: this.template.steps[0].id,
      metadata: {},
      startedAt: new Date(),
    } as Interview);

    this.interviewId = interview.id;
  }

  finished() {
    // End when the LLM or conversation signals it, or when a special step is reached.
    // For now, always return false to allow the LLM to control the flow.
    return false;
  }

  /** Get the initial prompt for the interview. */
  async prompt(): Promise<string> {
    const firstStep = this.template.steps[0];
    this.conversationHistory.push({
      role: "assistant",
      content: firstStep.content,
    });
    return firstStep.content;
  }

  /** Handle candidate input, process with LLM+tools, log to DB, return next bot message. */
  async handle(input: string): Promise<string> {
    // Save user response
    const responseRepo = this.databaseService.getInterviewRepository();
    await responseRepo.saveResponse(this.interviewId, {
      stepId: "dynamic", // No longer step-based, mark as dynamic
      response: input,
      metadata: {},
    });

    this.conversationHistory.push({ role: "user", content: input });

    // Get available tools for the current context (all tools for now)
    const tools = this.toolRegistry.getAllTools();

    // Compose LLM prompt: include history and available tools
    const prompt = [
      ...(this.conversationHistory ?? []).map(
        (msg) => `${msg.role === "user" ? "User" : "Bot"}: ${msg.content}`
      ),
      `Available tools: ${tools
        .map((t) => `${t.name}: ${t.description}`)
        .join("; ")}`,
      'If you need to use a tool, respond with: TOOL_CALL {"tool": "ToolName", "input": { ... }}. Otherwise, respond to the user directly.',
    ].join("\n");

    // Send to LLM
    const llmResponse = await this.llm!.invoke([new HumanMessage(prompt)]);
    let content = llmResponse.content as string;

    // Tool call loop: if LLM requests a tool, execute and send result back, repeat until LLM responds directly
    let toolCallMatch = content.match(/TOOL_CALL\s*({.*})/);
    while (toolCallMatch) {
      let toolCall;
      try {
        toolCall = JSON.parse(toolCallMatch[1]);
      } catch {
        break;
      }
      const tool = this.toolRegistry.getTool(toolCall.tool);
      let toolResult = "";
      if (tool) {
        try {
          toolResult = await tool.execute(toolCall.input);
        } catch (e) {
          toolResult = `Tool error: ${e}`;
        }
      } else {
        toolResult = `Tool "${toolCall?.tool ?? "unknown"}" not found.`;
      }
      // Add tool result to history and prompt LLM again
      this.conversationHistory.push({
        role: "assistant",
        content: `Tool result: ${toolResult}`,
      });
      const followupPrompt = [
        ...this.conversationHistory.map(
          (msg) => `${msg.role === "user" ? "User" : "Bot"}: ${msg.content}`
        ),
        `Available tools: ${tools
          .map((t) => `${t.name}: ${t.description}`)
          .join("; ")}`,
        'If you need to use a tool, respond with: TOOL_CALL {"tool": "ToolName", "input": { ... }}. Otherwise, respond to the user directly.',
      ].join("\n");
      const followupResponse = await this.llm!.invoke([
        new HumanMessage(followupPrompt),
      ]);
      content = followupResponse.content as string;
      toolCallMatch = content.match(/TOOL_CALL\s*({.*})/);
    }

    // Add LLM response to history
    this.conversationHistory.push({ role: "assistant", content });

    // Optionally update interview status if a special end message is detected
    // (You may want to add logic here for "exit" or "goodbye" detection)

    return content;
  }
}

const main = async () => {
  const dbService = new DatabaseService({ filename: "hr-bot.db" }); // Provide required filename config
  const interviewTemplate = icuNurseTemplate;

  // load it into the manager
  const templateManager = new TemplateManager();
  templateManager.loadTemplate(interviewTemplate);

  // Set up the interaction manager
  const llm = process.env.OPENAI_API_KEY
    ? new ChatOpenAI({ modelName: "gpt-4.1-nano", temperature: 0.7 })
    : undefined;
  const interactionManager = new InteractionManager({}, llm);

  // Set up CLI
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const user = "user123"; // stub until you add auth

  // Create the agent
  const agent = new InterviewAgent(
    templateManager,
    interactionManager,
    dbService,
    user,
    interviewTemplate.id,
    llm
  );
  await agent.start();

  console.log(await agent.prompt());

  rl.on("line", async (line) => {
    const reply = await agent.handle(line.trim());
    if (reply) console.log(reply);
    if (agent.finished()) rl.close();
  });

  rl.on("close", () => {
    dbService.close();
    console.log("Interview finished. Goodbye!");
  });
};

main();
