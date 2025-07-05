import * as readline from "readline";
import { Template } from "../template/types";
import { db } from "../db/client";
import { MessageRepository } from "../db/repositories/messageRepository";

// Optional color/bold support (chalk if available)
let chalk: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  chalk = require("chalk");
} catch {
  chalk = null;
}
function bold(str: string) {
  return chalk ? chalk.bold(str) : str;
}
function cyan(str: string) {
  return chalk ? chalk.cyan(str) : str;
}
function yellow(str: string) {
  return chalk ? chalk.yellow(str) : str;
}
function green(str: string) {
  return chalk ? chalk.green(str) : str;
}

export interface CLIOptions {
  templates: Template[];
  onTemplateSelected: (template: Template) => Promise<void>;
  onExit?: () => void;
}

export class CLIInterface {
  private rl: readline.Interface;
  private conversationHistory: {
    role: "user" | "assistant";
    content: string;
    stepId: string;
  }[] = [];
  private progress: { current: number; total: number } = {
    current: 0,
    total: 0,
  };

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    process.on("SIGINT", () => {
      this.exit("Interrupted by user.");
    });
  }

  async selectTemplateDropdown(templates: Template[]): Promise<Template> {
    console.log("\nSelect an interview template:");
    templates.forEach((t, i) => {
      console.log(`  [${i + 1}] ${t.name || t.id}`);
    });
    return new Promise((resolve) => {
      this.rl.question("Enter number: ", (answer) => {
        const idx = parseInt(answer.trim(), 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= templates.length) {
          console.log("Invalid selection. Exiting.");
          this.exit();
        } else {
          resolve(templates[idx]);
        }
      });
    });
  }

  async showConversationHistory(conversationId: number) {
    console.log("\n" + bold("==== Conversation Q/A Pairs ===="));
    const messageRepo = new MessageRepository(db);
    const pairs = await messageRepo.getQuestionAnswerPairs(conversationId);

    if (pairs.length === 0) {
      console.log(yellow("No Q/A pairs found for this conversation."));
      console.log(bold("==============================\n"));
      return;
    }

    // Group by stepId
    const grouped: Record<string, typeof pairs> = {};
    for (const pair of pairs) {
      if (!grouped[pair.stepId]) grouped[pair.stepId] = [];
      grouped[pair.stepId].push(pair);
    }

    const stepIds = Object.keys(grouped).sort();

    for (const [i, stepId] of stepIds.entries()) {
      if (i > 0) {
        // Separator between steps
        console.log(bold("--------------------"));
      }
      console.log(bold(`\nStep: ${stepId}`));
      grouped[stepId].forEach(({ question, answer }, idx) => {
        if (idx > 0) {
          // Spacing between Q/A pairs
          console.log("");
        }
        // Q label
        const qLabel = bold(cyan(`Q${idx + 1}:`));
        // A label
        const aLabel = bold(green(`A${idx + 1}:`));
        console.log(`  ${qLabel} ${question}`);
        if (answer !== null) {
          console.log(`  ${aLabel} ${answer}`);
        } else {
          console.log(`  ${aLabel} ${yellow("[No answer]")}`);
        }
      });
      console.log(""); // Extra space after each step
    }
    console.log(bold("==============================\n"));
  }

  showProgress(current: number, total: number) {
    this.progress = { current, total };
    console.log(`Progress: Step ${current} of ${total}`);
  }

  addMessage(
    role: "user" | "assistant",
    content: string,
    stepId: string = "other"
  ) {
    this.conversationHistory.push({ role, content, stepId });
    if (role === "assistant") {
      console.log(`\nBot: ${content}`);
    } else {
      console.log(`You: ${content}`);
    }
  }

  async promptUser(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(`\n${prompt}\n> `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  handleError(err: unknown) {
    console.error("\n[Error]", err instanceof Error ? err.message : err);
    this.exit();
  }

  exit(message?: string) {
    if (message) console.log(message);
    this.rl.close();
    process.exit(0);
  }
}
