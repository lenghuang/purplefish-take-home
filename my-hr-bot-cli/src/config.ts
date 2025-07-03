import { config as dotenvConfig } from "dotenv";
import path from "path";

dotenvConfig();

export interface LLMConfig {
  provider: "openai";
  modelName: string;
  temperature: number;
  apiKey: string;
}

export interface DatabaseConfig {
  filename: string;
}

export interface TemplateConfig {
  templateDir: string;
  builtInTemplates: string[];
}

export interface AppConfig {
  llm: LLMConfig;
  database: DatabaseConfig;
  templates: TemplateConfig;
}

export function getConfig(): AppConfig {
  const rootDir = process.cwd();

  // LLM config
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables.");
  }
  const llm: LLMConfig = {
    provider: "openai",
    modelName: process.env.LLM_MODEL || "gpt-4.1-nano",
    temperature: process.env.LLM_TEMPERATURE
      ? parseFloat(process.env.LLM_TEMPERATURE)
      : 0.7,
    apiKey,
  };

  // Database config
  const database: DatabaseConfig = {
    filename: process.env.DB_FILENAME || path.join(rootDir, "hr-bot.db"),
  };

  // Template config
  const templateDir =
    process.env.TEMPLATE_DIR || path.join(rootDir, "src/template/examples");
  const builtInTemplates = [
    path.join(templateDir, "icu-nurse.ts"),
    path.join(templateDir, "senior-engineer.ts"),
    path.join(templateDir, "software-engineer.ts"),
  ];

  const templates: TemplateConfig = {
    templateDir,
    builtInTemplates,
  };

  return {
    llm,
    database,
    templates,
  };
}
