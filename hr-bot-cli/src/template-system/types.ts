export interface Template {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: Step[];
  metadata: TemplateMetadata;
}

export interface TemplateMetadata {
  roleType: string;
  requiredSkills: string[];
  expectedDuration: number;
  customFields: Record<string, any>;
}

export interface Step {
  id: string;
  type: StepType;
  content: string;
  availableTools: string[];
  metadata: StepMetadata;
  /**
   * Optional array of conditions for branching or validation.
   */
  conditions?: Condition[];
  /**
   * Mapping of possible next step IDs, e.g. { "yes": "step2", "no": "step3" }
   * Only present for steps that branch or have multiple outcomes.
   */
  nextSteps?: Record<string, string>;
}

export type StepType = "question" | "validation" | "branch" | "exit";

export interface StepMetadata {
  timeoutSeconds?: number;
  retryAttempts?: number;
  importance: "critical" | "optional";
  tags: string[];
  constraints?: Record<string, any>; // Added constraints for negotiation support
  qualityThreshold?: number; // Minimum quality score required
  allowClarification?: boolean; // Whether to allow clarification requests
  allowNegotiation?: boolean; // Whether to allow response negotiation
}

export interface Condition {
  type: ConditionType;
  value: string;
  outcome: string;
  metadata: ConditionMetadata;
}

export type ConditionType = "regex" | "numeric" | "custom";

export interface ConditionMetadata {
  errorMessage?: string;
  validationHints?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  nextStepId?: string;
}

export class TemplateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateValidationError";
  }
}

export class StepProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StepProcessingError";
  }
}
