import { z } from "zod";
import { tool } from "@langchain/core/tools";

// Tool: validate_salary
export const validateSalarySchema = z.object({
  desiredSalary: z.number().min(0),
});
export const validate_salary = tool(
  async ({ desiredSalary }: { desiredSalary: number }) => {
    // Example: Acceptable range is 50k-500k
    if (desiredSalary < 50000) {
      return "Salary too low. Minimum is $50,000.";
    }
    if (desiredSalary > 500000) {
      return "Salary too high. Maximum is $500,000.";
    }
    return "Salary is within the acceptable range.";
  },
  {
    name: "validate_salary",
    description:
      "Validate if the desired salary is within an acceptable range.",
    schema: validateSalarySchema,
  }
);

// Tool: negotiate_salary
export const negotiateSalarySchema = z.object({
  targetSalary: z.number().min(0),
});
export const negotiate_salary = tool(
  async ({ targetSalary }: { targetSalary: number }) => {
    // Example: Counter-offer logic
    if (targetSalary < 100000) {
      return `How about $${targetSalary + 5000}?`;
    }
    if (targetSalary < 200000) {
      return `How about $${targetSalary + 10000}?`;
    }
    return `Let's discuss further for high salary negotiations.`;
  },
  {
    name: "negotiate_salary",
    description:
      "Negotiate a target salary and return a suggested counter-offer.",
    schema: negotiateSalarySchema,
  }
);
