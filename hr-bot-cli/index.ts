import { config } from "dotenv";
import * as readline from "readline";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

import { DatabaseService } from "./src/database/database-service";
import { TemplateManager } from "./src/template-system/template-manager";
import { InteractionManager } from "./src/template-system/interaction/interaction-manager";
import { Template, Step } from "./src/template-system/types";
import { Interview } from "./src/database/types";
import { icuNurseTemplate } from "./src/template-system/example-templates/icu-nurse";

// ────────────────────────────────────────────────────────────────────────────
//  1. Environment
// ────────────────────────────────────────────────────────────────────────────
config(); // loads .env → process.env

// ────────────────────────────────────────────────────────────────────────────
//  2. InterviewAgent class
// ────────────────────────────────────────────────────────────────────────────
class InterviewAgent {
  private currentStep: Step;
  private ctx: Record<string, any> = {};
  private interviewId!: string;
  private template: Template;

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
    this.currentStep = template.steps[0];
  }

  async start() {
    const interviewRepo = this.databaseService.getInterviewRepository();
    const interview = await interviewRepo.create({
      id: `interview_${Date.now()}`,
      templateId: this.template.id,
      userId: this.userId,
      status: "active",
      currentStepId: this.currentStep.id,
      metadata: {},
      startedAt: new Date(),
    } as Interview);

    this.interviewId = interview.id;
  }

  finished() {
    return this.currentStep.type === "exit";
  }

  /** Optionally paraphrase prompt with the LLM for warmth. */
  private async phrase(content: string) {
    if (!this.llm) return content;
    try {
      const r = await this.llm.invoke([
        new HumanMessage(
          `Rephrase this interview question in a warm, human voice: ${content}`
        ),
      ]);
      return r.content as string;
    } catch {
      return content;
    }
  }

  /** Ask the current question. */
  async prompt(): Promise<string> {
    if (this.finished()) return "";
    return this.phrase(this.currentStep.content);
  }

  /** Handle candidate input, advance state, log to DB, return next bot message. */
  async handle(input: string): Promise<string> {
    if (this.finished()) return "";

    const currentStep = this.currentStep;

    // Process conditions to determine next step
    let nextStepId = currentStep.nextSteps.default;
    for (const condition of currentStep.conditions) {
      if (
        condition.type === "regex" &&
        new RegExp(condition.value, "i").test(input)
      ) {
        nextStepId = condition.outcome;
        break;
      } else if (condition.type === "numeric") {
        const num = Number(input.replace(/[^0-9]/g, ""));
        if (!Number.isNaN(num)) {
          const [op, val] =
            condition.value.match(/([<=>]+)(\d+)/)?.slice(1) || [];
          const targetVal = Number(val);
          if (op === "<=" && num <= targetVal) {
            nextStepId = condition.outcome;
            break;
          }
        }
      }
    }

    // Store response
    const interviewRepo = this.databaseService.getInterviewRepository();
    const responseRepo = this.databaseService.getInterviewRepository();

    // Update current step
    this.currentStep = this.template.steps.find((s) => s.id === nextStepId)!;

    // Get next message
    const botMsg = await this.prompt();

    // Save response
    await responseRepo.saveResponse(this.interviewId, {
      stepId: currentStep.id,
      response: input,
      metadata: {},
    });

    // Update interview status if finished
    if (this.finished()) {
      await interviewRepo.update(this.interviewId, {
        status: "completed",
        currentStepId: this.currentStep.id,
        completedAt: new Date(),
      });
    } else {
      await interviewRepo.update(this.interviewId, {
        currentStepId: this.currentStep.id,
      });
    }

    return botMsg;
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  3. CLI runner
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  // Initialize components
  const dbService = new DatabaseService({
    filename: "./interview_bot.db",
  });
  await dbService.initialize();

  // choose a job
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
}

main().catch(console.error);
