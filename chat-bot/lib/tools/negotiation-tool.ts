// negotiation-tool.ts
// This file implements a simple salary negotiation helper tool. It uses a Zod schema to ensure
// the input parameters (currentSalary, expectedSalary, leveragePoints) match expected numeric/string
// data types. The execution logic then suggests a negotiation strategy based on the inputs.

import { z } from 'zod';
import { Tool } from './tool-registry';

// Define a Zod schema for negotiation parameters. We assume the user provides:
// 1) currentSalary: a number representing the current salary.
// 2) expectedSalary: a number representing the user's desired salary.
// 3) leveragePoints: an optional array of strings representing achievements, credentials, or
//    unique skills the user can bring up during negotiation.
const negotiationSchema = z.object({
  currentSalary: z.number().min(0, 'Current salary must be non-negative'),
  expectedSalary: z.number().min(0, 'Expected salary must be non-negative'),
  leveragePoints: z.array(z.string()).optional(),
});

/**
 * An example negotiation tool. Real negotiation logic might factor in market data,
 * company budgets, or other metrics. In this sample, we generate a simple recommended
 * "ask" range and include a few talking points based on leveragePoints.
 */
export const negotiationTool: Tool = {
  name: 'negotiation-tool',
  description:
    'Helps suggest a negotiation range and talking points based on current and expected salary.',
  parameters: negotiationSchema,
  /**
   * Adds JSDoc for clarity.
   * @returns {{negotiationRangeAdvice: string, talkingPoints: string[], suggestedMin: number, suggestedMax: number}}
   */
  execute: async (params) => {
    const { currentSalary, expectedSalary, leveragePoints } = params;

    // A naive approach: If the expected is less than 20% over the current,
    // we encourage pushing a bit higher. If it's more than 50% over the current,
    // we caution it might be too high. This is purely illustrative.
    const difference = expectedSalary - currentSalary;
    let recommendation: string;

    if (difference < currentSalary * 0.2) {
      recommendation =
        'You could aim higher. Consider asking for a range slightly above your expectation.';
    } else if (difference > currentSalary * 0.5) {
      recommendation =
        'Your expectation is significantly higher than your current salary. Provide strong evidence or be prepared to compromise.';
    } else {
      recommendation =
        'Your expectation is within a reasonable range. Emphasize your unique value to justify it.';
    }

    // Construct a short script:
    const talkingPoints =
      leveragePoints && leveragePoints.length > 0
        ? leveragePoints.map((point: string, idx: number) => `• Advantage #${idx + 1}: ${point}`)
        : ['• Emphasize your expertise and alignment with organizational goals.'];

    // Return a structured response:
    return {
      negotiationRangeAdvice: recommendation,
      talkingPoints,
      suggestedMin: Math.round(expectedSalary * 0.95),
      suggestedMax: Math.round(expectedSalary * 1.05),
    };
  },
};
