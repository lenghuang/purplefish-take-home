import {
  Template,
  TemplateStep,
  TemplateValidationResult,
  StepProgression,
} from "./types";

/**
 * Validates a template's structure and required fields.
 */
export function validateTemplate(template: Template): TemplateValidationResult {
  const errors: string[] = [];
  if (!template.id) errors.push("Template is missing id.");
  if (!template.name) errors.push("Template is missing name.");
  if (!template.role) errors.push("Template is missing role.");
  if (
    !template.steps ||
    !Array.isArray(template.steps) ||
    template.steps.length === 0
  ) {
    errors.push("Template must have at least one step.");
  } else {
    template.steps.forEach((step, idx) => {
      if (!step.id) errors.push(`Step ${idx} is missing id.`);
      if (!step.title) errors.push(`Step ${idx} is missing title.`);
      if (!step.prompt) errors.push(`Step ${idx} is missing prompt.`);
    });
  }
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Returns the next step index, or null if at the end.
 */
export function getNextStepIndex(
  current: number,
  template: Template,
): number | null {
  if (current < template.steps.length - 1) {
    return current + 1;
  }
  return null;
}

/**
 * Returns the previous step index, or null if at the beginning.
 */
export function getPreviousStepIndex(current: number): number | null {
  if (current > 0) {
    return current - 1;
  }
  return null;
}

/**
 * Returns step progression state.
 */
export function getStepProgression(
  current: number,
  template: Template,
): StepProgression {
  return {
    currentStep: current + 1,
    totalSteps: template.steps.length,
    completed: current >= template.steps.length,
  };
}

/**
 * Generates a prompt for the agent for a given step.
 * Optionally includes context from previous answers.
 */
export function generatePrompt(
  template: Template,
  stepIndex: number,
  previousAnswers?: Record<string, any>,
): string {
  const step = template.steps[stepIndex];
  let prompt = `Role: ${template.role}\nStep: ${step.title}\n\n${step.prompt}`;
  if (previousAnswers) {
    prompt += `\n\nPrevious Answers:\n`;
    for (const [stepId, answer] of Object.entries(previousAnswers)) {
      prompt += `- ${stepId}: ${answer}\n`;
    }
  }
  return prompt;
}
