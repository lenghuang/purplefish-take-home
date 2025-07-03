/**
 * Template system types for my-hr-bot-cli
 */

export type TemplateId = string;

export interface TemplateStep {
  id: string;
  title: string;
  description?: string;
  prompt: string;
  expectedType?: "text" | "choice" | "code" | "rating" | string;
  choices?: string[];
  config?: Record<string, any>;
}

export interface TemplateConfig {
  allowStepSkipping?: boolean;
  showStepNumbers?: boolean;
  [key: string]: any;
}

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  role: string;
  steps: TemplateStep[];
  config?: TemplateConfig;
  version?: string;
  tags?: string[];
}

export interface TemplateValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface StepProgression {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
}

export interface DropdownTemplateOption {
  id: TemplateId;
  label: string;
  description?: string;
  tags?: string[];
}

export interface TemplateSelectionState {
  selectedTemplateId: TemplateId | null;
  options: DropdownTemplateOption[];
}
