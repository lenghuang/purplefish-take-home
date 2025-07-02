/* interview_agent.ts
 *
 * Text‑based screening‑interview agent for the Purplefish take‑home.
 * Focuses on backend logic: scripted flow with conditional branching,
 * SQLite persistence, and optional OpenAI paraphrasing for friendliness.
 */

import { config } from "dotenv";
import * as readline from "readline";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

// ────────────────────────────────────────────────────────────────────────────
//  1. Environment
// ────────────────────────────────────────────────────────────────────────────
config(); // loads .env → process.env

// ────────────────────────────────────────────────────────────────────────────
//  2. Interview Script Definition
//     A tiny state‑machine: each step decides which step comes next.
// ────────────────────────────────────────────────────────────────────────────
type StepId =
  | "interest_check"
  | "name"
  | "position"
  | "salary"
  | "salary_negotiation"
  | "license"
  | "license_timing"
  | "experience_years"
  | "experience_story"
  | "experience_acute"
  | "ending"
  | "exit";

interface StepContext {
  [key: string]: any;
}

interface Step {
  id: StepId;
  question: string;
  process: (input: string, ctx: StepContext) => StepId;
}

const MAX_SALARY = 72_000;
const LICENSE_GRACE_M = 6;

const script: Record<StepId, Step> = {
  interest_check: {
    id: "interest_check",
    question: "Hello! Are you currently open to discussing this role?",
    process: (input) => (/^\s*no/i.test(input) ? "exit" : "name"),
  },

  name: {
    id: "name",
    question: `Great! What's your name?`,
    process: (input, ctx) => {
      ctx.name = input.trim();
      return "position";
    },
  },

  position: {
    id: "position",
    question: "What position are you applying for?",
    process: () => "salary",
  },

  salary: {
    id: "salary",
    question: "What is your desired salary?",
    process: (input, ctx) => {
      const num = Number(input.replace(/[^0-9]/g, ""));
      if (Number.isNaN(num)) return "salary_negotiation";
      ctx.desiredSalary = num;
      return num <= MAX_SALARY ? "license" : "salary_negotiation";
    },
  },

  salary_negotiation: {
    id: "salary_negotiation",
    question: `The max pay is $${MAX_SALARY.toLocaleString()}. Does that work for you?`,
    process: (input) => (/^\s*(y|yes)/i.test(input) ? "license" : "exit"),
  },

  license: {
    id: "license",
    question: "Are you a licensed RN in this state?",
    process: (input) =>
      /^\s*yes/i.test(input) ? "experience_years" : "license_timing",
  },

  license_timing: {
    id: "license_timing",
    question: "When (in months) do you expect to get licensed?",
    process: (input) =>
      parseInt(input, 10) > LICENSE_GRACE_M ? "exit" : "experience_years",
  },

  experience_years: {
    id: "experience_years",
    question: "Do you have at least 2 years of ICU experience?",
    process: (input) =>
      /^\s*yes/i.test(input) ? "experience_story" : "experience_acute",
  },

  experience_story: {
    id: "experience_story",
    question:
      "Tell me about a challenging ICU emergency and how you handled it.",
    process: () => "ending",
  },

  experience_acute: {
    id: "experience_acute",
    question: "Do you have any acute‑care experience?",
    process: () => "ending",
  },

  ending: {
    id: "ending",
    question: "Thanks for your time! We’ll be in touch soon.",
    process: () => "exit",
  },

  exit: {
    id: "exit",
    question: "",
    process: () => "exit",
  },
};

// ────────────────────────────────────────────────────────────────────────────
//  3. SQLite — schema & helper
// ────────────────────────────────────────────────────────────────────────────
async function initDB() {
  const db = await open({
    filename: "./interview_bot.db",
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");
  await db.exec(`
    CREATE TABLE IF NOT EXISTS interview_sessions (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   TEXT,
      status    TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS interview_responses (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id   INTEGER,
      step_id      TEXT,
      user_input   TEXT,
      bot_response TEXT,
      ts           DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES interview_sessions(id)
    );
  `);

  return db;
}

// ────────────────────────────────────────────────────────────────────────────
//  4. InterviewAgent class
// ────────────────────────────────────────────────────────────────────────────
class InterviewAgent {
  private step: StepId = "interest_check";
  private ctx: StepContext = {};
  private sessionId!: number;

  constructor(
    private db: Database,
    private userId: string,
    private llm?: ChatOpenAI
  ) {}

  async start() {
    const { lastID } = await this.db.run(
      "INSERT INTO interview_sessions (user_id, status) VALUES (?, ?)",
      [this.userId, "active"]
    );
    this.sessionId = lastID as number;
  }

  finished() {
    return this.step === "exit";
  }

  /** Optionally paraphrase prompt with the LLM for warmth. */
  private async phrase(question: string) {
    if (!this.llm) return question;
    try {
      const r = await this.llm.invoke([
        new HumanMessage(
          `Rephrase this interview question in a warm, human voice: ${question}`
        ),
      ]);
      return r.content as string;
    } catch {
      return question;
    }
  }

  /** Ask the current question. */
  async prompt(): Promise<string> {
    if (this.finished()) return "";
    return this.phrase(script[this.step].question);
  }

  /** Handle candidate input, advance state, log to DB, return next bot message. */
  async handle(input: string): Promise<string> {
    if (this.finished()) return "";

    const curr = script[this.step];
    this.step = curr.process(input, this.ctx);

    const botMsg = await this.prompt();

    await this.db.run(
      "INSERT INTO interview_responses (session_id, step_id, user_input, bot_response) VALUES (?, ?, ?, ?)",
      [this.sessionId, curr.id, input, botMsg]
    );

    if (this.finished()) {
      await this.db.run(
        `UPDATE interview_sessions SET status = 'finished' WHERE id = ?`,
        [this.sessionId]
      );
    }

    return botMsg;
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  5. CLI runner
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  const db = await initDB();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const user = "user123"; // stub until you add auth
  const llm = process.env.OPENAI_API_KEY
    ? new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0.7 })
    : undefined;

  const agent = new InterviewAgent(db, user, llm);
  await agent.start();

  console.log(await agent.prompt());

  rl.on("line", async (line) => {
    const reply = await agent.handle(line.trim());
    if (reply) console.log(reply);
    if (agent.finished()) rl.close();
  });

  rl.on("close", () => {
    db.close();
    console.log("Interview finished. Goodbye!");
  });
}

main().catch(console.error);
