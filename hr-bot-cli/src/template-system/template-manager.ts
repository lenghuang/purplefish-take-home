import { Template, TemplateValidationError, Step, Condition } from "./types";

export class TemplateManager {
  private templates: Map<string, Template> = new Map();
  private versionMap: Map<string, Map<string, Template>> = new Map();

  constructor() {}

  /**
   * Load a template into the manager
   * @param template The template to load
   * @throws TemplateValidationError if template is invalid
   */
  public loadTemplate(template: Template): void {
    this.validateTemplate(template);

    // Store template by ID
    this.templates.set(template.id, template);

    // Store template by ID and version
    if (!this.versionMap.has(template.id)) {
      this.versionMap.set(template.id, new Map());
    }
    this.versionMap.get(template.id)!.set(template.version, template);
  }

  /**
   * Get a template by ID
   * @param id Template ID
   * @param version Optional specific version
   * @returns The requested template
   */
  public getTemplate(id: string, version?: string): Template | undefined {
    if (version) {
      return this.versionMap.get(id)?.get(version);
    }
    return this.templates.get(id);
  }

  /**
   * Get all templates for a specific role type
   * @param roleType The role type to filter by
   * @returns Array of matching templates
   */
  public getTemplatesByRole(roleType: string): Template[] {
    return Array.from(this.templates.values()).filter(
      (template) => template.metadata.roleType === roleType
    );
  }

  /**
   * Get the latest version of a template
   * @param id Template ID
   * @returns The latest version of the template
   */
  public getLatestVersion(id: string): Template | undefined {
    const versions = this.versionMap.get(id);
    if (!versions) return undefined;

    const sortedVersions = Array.from(versions.entries()).sort((a, b) =>
      this.compareVersions(b[0], a[0])
    );

    return sortedVersions[0]?.[1];
  }

  /**
   * Validate a template's structure and content
   * @param template The template to validate
   * @throws TemplateValidationError if validation fails
   */
  private validateTemplate(template: Template): void {
    // Validate required fields
    if (!template.id || !template.name || !template.version) {
      throw new TemplateValidationError("Template missing required fields");
    }

    // Validate steps array
    if (!Array.isArray(template.steps) || template.steps.length === 0) {
      throw new TemplateValidationError("Template must have at least one step");
    }

    // Validate each step
    const stepIds = new Set<string>();
    template.steps.forEach((step) => this.validateStep(step, stepIds));

    // Validate step connections
    this.validateStepConnections(template.steps);
  }

  /**
   * Validate an individual step
   * @param step The step to validate
   * @param stepIds Set of existing step IDs
   * @throws TemplateValidationError if validation fails
   */
  private validateStep(step: Step, stepIds: Set<string>): void {
    // Check for duplicate step IDs
    if (stepIds.has(step.id)) {
      throw new TemplateValidationError(`Duplicate step ID: ${step.id}`);
    }
    stepIds.add(step.id);

    // Validate step type
    if (!["question", "validation", "branch", "exit"].includes(step.type)) {
      throw new TemplateValidationError(`Invalid step type: ${step.type}`);
    }

    // Validate conditions
    if (step.conditions) {
      step.conditions.forEach((condition) => this.validateCondition(condition));
    }

    // Validate nextSteps
    if (!step.nextSteps || Object.keys(step.nextSteps).length === 0) {
      throw new TemplateValidationError(
        `Step ${step.id} must have at least one next step`
      );
    }
  }

  /**
   * Validate a condition
   * @param condition The condition to validate
   * @throws TemplateValidationError if validation fails
   */
  private validateCondition(condition: Condition): void {
    if (!["regex", "numeric", "custom"].includes(condition.type)) {
      throw new TemplateValidationError(
        `Invalid condition type: ${condition.type}`
      );
    }

    if (!condition.value) {
      throw new TemplateValidationError("Condition must have a value");
    }

    if (!condition.outcome) {
      throw new TemplateValidationError("Condition must have an outcome");
    }
  }

  /**
   * Validate step connections to ensure no orphaned or circular references
   * @param steps Array of steps to validate
   * @throws TemplateValidationError if validation fails
   */
  private validateStepConnections(steps: Step[]): void {
    const stepIds = new Set(steps.map((s) => s.id));
    const visited = new Set<string>();
    const stack = new Set<string>();

    // Check all nextStep references are valid
    steps.forEach((step) => {
      Object.values(step.nextSteps ?? {}).forEach((nextStepId) => {
        if (nextStepId !== "exit" && !stepIds.has(nextStepId)) {
          throw new TemplateValidationError(
            `Invalid next step reference: ${nextStepId}`
          );
        }
      });
    });

    // Check for circular references
    const checkCircular = (stepId: string): void => {
      visited.add(stepId);
      stack.add(stepId);

      const step = steps.find((s) => s.id === stepId);
      if (step) {
        Object.values(step.nextSteps ?? {}).forEach((nextStepId) => {
          if (nextStepId !== "exit") {
            if (!visited.has(nextStepId)) {
              checkCircular(nextStepId);
            } else if (stack.has(nextStepId)) {
              throw new TemplateValidationError(
                `Circular reference detected at step: ${stepId}`
              );
            }
          }
        });
      }

      stack.delete(stepId);
    };

    // Start from first step
    if (steps.length > 0 && !visited.has(steps[0].id)) {
      checkCircular(steps[0].id);
    }
  }

  /**
   * Compare two version strings
   * @param v1 First version
   * @param v2 Second version
   * @returns -1, 0, or 1
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }
}
