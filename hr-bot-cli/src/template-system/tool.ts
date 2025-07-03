import { z } from "zod";

/**
 * Interface for a Tool that the LLM can call.
 */
export interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  execute(input: any): Promise<any>;
}

/**
 * Tool to validate numeric input against a condition.
 */
export class ValidateNumericInputTool implements Tool {
  name = "ValidateNumericInput";
  description =
    "Validates that the input is a number and optionally checks if it meets certain criteria (e.g., greater than, less than).";

  inputSchema = z.object({
    input: z.string(),
    condition: z.string().optional(), // e.g. "> 5", "<= 10"
  });

  async execute(input: {
    input: string;
    condition?: string;
  }): Promise<boolean> {
    const num = Number(input.input.replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(num)) return false;

    if (!input.condition) return true;

    const match = input.condition.match(/([<=>]+)\s*(\d+(\.\d+)?)/);
    if (!match) return false;

    const [, op, valStr] = match;
    const val = Number(valStr);

    switch (op) {
      case ">":
        return num > val;
      case ">=":
        return num >= val;
      case "<":
        return num < val;
      case "<=":
        return num <= val;
      case "==":
      case "=":
        return num === val;
      default:
        return false;
    }
  }
}

/**
 * Tool to validate input against a regex pattern.
 */
export class ValidateRegexTool implements Tool {
  name = "ValidateRegex";
  description = "Validates that the input matches a given regular expression.";

  inputSchema = z.object({
    input: z.string(),
    pattern: z.string(),
  });

  async execute(input: { input: string; pattern: string }): Promise<boolean> {
    try {
      const regex = new RegExp(input.pattern, "i");
      return regex.test(input.input);
    } catch {
      return false;
    }
  }
}

/**
 * Tool to move to the next step in the conversation.
 */
export class NextStepTool implements Tool {
  name = "NextStep";
  description = "Moves the conversation to the next step.";

  inputSchema = z.object({
    stepId: z.string(),
  });

  async execute(input: { stepId: string }): Promise<string> {
    // This tool's execution is a no-op here; the InterviewAgent will handle step transitions.
    return input.stepId;
  }
}
