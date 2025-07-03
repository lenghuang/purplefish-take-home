import * as readline from "readline";
import { Template } from "../template/types";

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

  showConversationHistory() {
    console.log("\n--- Conversation History ---");
    this.conversationHistory.forEach((msg) => {
      console.log(`${msg.role === "user" ? "You" : "Bot"}: ${msg.content}`);
    });
    console.log("---------------------------\n");
  }

  showProgress(current: number, total: number) {
    this.progress = { current, total };
    console.log(`Progress: Step ${current} of ${total}`);
  }

  addMessage(role: "user" | "assistant", content: string) {
    this.conversationHistory.push({ role, content });
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
