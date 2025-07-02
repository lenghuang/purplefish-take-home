import {
  Step,
  Condition,
  ValidationResult,
  StepProcessingError,
  ConditionType,
} from "./types";
import { InteractionManager } from "./interaction/interaction-manager";
import { EnhancedResponse, QualityAssessment } from "./interaction/types";
import { SQLiteEnhancedResponseRepository } from "../database/sqlite-repositories/enhanced-response-repository";

export class StepProcessor {
  constructor(
    private interactionManager: InteractionManager,
    private enhancedResponseRepo: SQLiteEnhancedResponseRepository
  ) {}

  /**
   * Process a step response with enhanced interaction support
   * @param step Current step
   * @param response User's response
   * @param interviewId Current interview ID
   * @returns Validation result with next step information
   */
  public async processStep(
    step: Step,
    response: string,
    interviewId: string
  ): Promise<ValidationResult> {
    try {
      let currentResponse = response;
      let clarificationAttempts = 0;
      let negotiationAttempts = 0;
      const clarificationHistory = [];
      const negotiationHistory = [];

      // Initial quality assessment
      const qualityAssessment =
        await this.interactionManager.assessResponseQuality(
          step,
          currentResponse
        );

      // Handle clarifications if needed
      while (
        qualityAssessment.score <
        this.interactionManager.config.qualityThreshold
      ) {
        const clarificationQuestion =
          await this.interactionManager.clarifyAnswer(
            step,
            currentResponse,
            clarificationAttempts
          );

        clarificationHistory.push({
          timestamp: new Date(),
          originalResponse: currentResponse,
          clarificationRequest: clarificationQuestion,
          updatedResponse: "", // Will be filled with user's clarified response
        });

        // Note: The actual clarified response would come from the user
        // For now, we'll break and wait for user input
        break;
      }

      // Validate the final response
      const validationResult = this.validateResponse(step, currentResponse);
      if (!validationResult.isValid) {
        return validationResult;
      }

      // Handle constraints and negotiations
      if (step.metadata.constraints) {
        while (
          negotiationAttempts <
          this.interactionManager.config.negotiationAttempts
        ) {
          const negotiationResult =
            await this.interactionManager.negotiateResponse(
              currentResponse,
              step.metadata.constraints,
              negotiationAttempts
            );

          negotiationHistory.push({
            timestamp: new Date(),
            originalResponse: currentResponse,
            constraint: JSON.stringify(step.metadata.constraints),
            counterProposal: negotiationResult,
            resolution: "", // Will be filled with user's negotiated response
          });

          // Note: The actual negotiated response would come from the user
          // For now, we'll break and wait for user input
          break;
        }
      }

      // Store the enhanced response
      const enhancedResponse: EnhancedResponse = {
        stepId: step.id,
        response: currentResponse,
        clarificationAttempts,
        negotiationAttempts,
        qualityScore: qualityAssessment.score,
        metadata: {
          qualityFeedback: qualityAssessment.feedback,
          suggestedImprovements: qualityAssessment.suggestedImprovements,
          assessmentConfidence: qualityAssessment.confidence,
        },
        clarificationHistory,
        negotiationHistory,
      };

      await this.enhancedResponseRepo.saveEnhancedResponse(
        interviewId,
        enhancedResponse
      );

      // Evaluate conditions to determine next step
      const nextStepId = this.evaluateConditions(step, currentResponse);

      return {
        isValid: true,
        errors: [],
        nextStepId,
      };
    } catch (error: any) {
      throw new StepProcessingError(
        `Error processing step: ${error?.message || "Unknown error"}`
      );
    }
  }

  /**
   * Handle request to repeat a question
   * @param step Current step
   * @returns Rephrased question
   */
  public async repeatQuestion(step: Step): Promise<string> {
    return this.interactionManager.repeatQuestion(step);
  }

  /**
   * Validate a response based on step type and conditions
   * @param step Current step
   * @param response User's response
   * @returns Validation result
   */
  private validateResponse(step: Step, response: string): ValidationResult {
    const errors: string[] = [];

    // Skip validation for non-validation steps
    if (step.type !== "validation") {
      return { isValid: true, errors: [] };
    }

    // Check if response is empty
    if (!response.trim()) {
      errors.push("Response cannot be empty");
      return { isValid: false, errors };
    }

    // Validate against each condition
    step.conditions.forEach((condition) => {
      const validationError = this.validateCondition(condition, response);
      if (validationError) {
        errors.push(validationError);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a response against a single condition
   * @param condition Condition to validate against
   * @param response User's response
   * @returns Error message if validation fails, undefined if passes
   */
  private validateCondition(
    condition: Condition,
    response: string
  ): string | undefined {
    try {
      switch (condition.type) {
        case "regex":
          return this.validateRegex(condition.value, response);
        case "numeric":
          return this.validateNumeric(condition.value, response);
        case "custom":
          return this.validateCustom(condition.value, response);
        default:
          throw new Error(`Unknown condition type: ${condition.type}`);
      }
    } catch (error: any) {
      return (
        condition.metadata.errorMessage || error?.message || "Validation error"
      );
    }
  }

  /**
   * Validate response against a regex pattern
   * @param pattern Regex pattern
   * @param response User's response
   * @returns Error message if validation fails, undefined if passes
   */
  private validateRegex(pattern: string, response: string): string | undefined {
    try {
      const regex = new RegExp(pattern);
      if (!regex.test(response)) {
        return `Response does not match required pattern: ${pattern}`;
      }
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${pattern}`);
    }
  }

  /**
   * Validate response against a numeric condition
   * @param condition Numeric condition (e.g., "<=50000")
   * @param response User's response
   * @returns Error message if validation fails, undefined if passes
   */
  private validateNumeric(
    condition: string,
    response: string
  ): string | undefined {
    const numericResponse = parseFloat(response);
    if (isNaN(numericResponse)) {
      return "Response must be a number";
    }

    const operator = condition.match(/^[<>]=?|=/)?.[0];
    const value = parseFloat(condition.replace(/^[<>]=?|=/, ""));

    if (!operator || isNaN(value)) {
      throw new Error(`Invalid numeric condition: ${condition}`);
    }

    switch (operator) {
      case "<":
        return numericResponse < value
          ? undefined
          : `Value must be less than ${value}`;
      case "<=":
        return numericResponse <= value
          ? undefined
          : `Value must be less than or equal to ${value}`;
      case ">":
        return numericResponse > value
          ? undefined
          : `Value must be greater than ${value}`;
      case ">=":
        return numericResponse >= value
          ? undefined
          : `Value must be greater than or equal to ${value}`;
      case "=":
        return numericResponse === value
          ? undefined
          : `Value must be equal to ${value}`;
      default:
        throw new Error(`Unsupported numeric operator: ${operator}`);
    }
  }

  /**
   * Validate response against a custom condition
   * @param condition Custom condition logic
   * @param response User's response
   * @returns Error message if validation fails, undefined if passes
   */
  private validateCustom(
    condition: string,
    response: string
  ): string | undefined {
    // Custom validation logic would be implemented here
    // This could involve calling external validation services or implementing
    // complex business rules
    return undefined;
  }

  /**
   * Evaluate conditions to determine the next step
   * @param step Current step
   * @param response User's response
   * @returns ID of the next step
   */
  private evaluateConditions(step: Step, response: string): string {
    // Check each condition in order
    for (const condition of step.conditions) {
      const matches = this.checkCondition(condition, response);
      if (matches) {
        // Return the outcome if condition matches
        return step.nextSteps[condition.outcome] || step.nextSteps.default;
      }
    }

    // Return default next step if no conditions match
    return step.nextSteps.default;
  }

  /**
   * Check if a response matches a condition
   * @param condition Condition to check
   * @param response User's response
   * @returns Whether the condition matches
   */
  private checkCondition(condition: Condition, response: string): boolean {
    try {
      switch (condition.type) {
        case "regex":
          return new RegExp(condition.value).test(response);
        case "numeric":
          return this.checkNumericCondition(condition.value, response);
        case "custom":
          return this.checkCustomCondition(condition.value, response);
        default:
          throw new Error(`Unknown condition type: ${condition.type}`);
      }
    } catch (error: any) {
      throw new StepProcessingError(
        `Error checking condition: ${error?.message || "Unknown error"}`
      );
    }
  }

  /**
   * Check if a response matches a numeric condition
   * @param condition Numeric condition
   * @param response User's response
   * @returns Whether the condition matches
   */
  private checkNumericCondition(condition: string, response: string): boolean {
    const numericResponse = parseFloat(response);
    if (isNaN(numericResponse)) {
      return false;
    }

    const operator = condition.match(/^[<>]=?|=/)?.[0];
    const value = parseFloat(condition.replace(/^[<>]=?|=/, ""));

    if (!operator || isNaN(value)) {
      throw new Error(`Invalid numeric condition: ${condition}`);
    }

    switch (operator) {
      case "<":
        return numericResponse < value;
      case "<=":
        return numericResponse <= value;
      case ">":
        return numericResponse > value;
      case ">=":
        return numericResponse >= value;
      case "=":
        return numericResponse === value;
      default:
        throw new Error(`Unsupported numeric operator: ${operator}`);
    }
  }

  /**
   * Check if a response matches a custom condition
   * @param condition Custom condition
   * @param response User's response
   * @returns Whether the condition matches
   */
  private checkCustomCondition(condition: string, response: string): boolean {
    // Custom condition checking logic would be implemented here
    // This could involve calling external services or implementing
    // complex business rules
    return false;
  }
}
