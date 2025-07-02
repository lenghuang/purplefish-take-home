import {
  InteractionConfig,
  QualityAssessment,
  EnhancedResponse,
  LLMPrompt,
  DEFAULT_INTERACTION_CONFIG,
} from "./types";
import { Step } from "../types";

const CLARIFICATION_PROMPT: LLMPrompt = {
  role: "interviewer",
  content: `As an interviewer, analyze the candidate's response and determine if clarification is needed.
Consider:
- Completeness of the answer
- Relevance to the question
- Technical accuracy
- Clarity of explanation

If clarification is needed, generate a follow-up question that specifically addresses unclear or incomplete aspects.`,
};

const NEGOTIATION_PROMPT: LLMPrompt = {
  role: "interviewer",
  content: `As an interviewer, evaluate if the candidate's response meets the given constraints.
If not, engage in a professional negotiation by:
1. Acknowledging their response
2. Clearly stating which constraints aren't met
3. Proposing a specific adjustment
4. Maintaining a collaborative tone`,
};

const QUALITY_ASSESSMENT_PROMPT: LLMPrompt = {
  role: "evaluator",
  content: `Evaluate the technical response quality considering:
1. Technical accuracy and depth
2. Problem-solving approach
3. Communication clarity
4. Best practices and standards
5. Understanding of trade-offs

Provide:
- Numerical score (0-1)
- Specific feedback points
- Suggested improvements
- Assessment confidence level`,
};

export class InteractionManager {
  public readonly config: InteractionConfig;

  constructor(
    config: Partial<InteractionConfig> = {},
    private readonly llmModel: any // Replace with actual LLM type
  ) {
    this.config = { ...DEFAULT_INTERACTION_CONFIG, ...config };
  }

  async clarifyAnswer(
    step: Step,
    previousResponse: string,
    attemptCount: number = 0
  ): Promise<string> {
    if (attemptCount >= this.config.maxClarificationRetries) {
      throw new Error("Maximum clarification attempts reached");
    }

    const clarificationPrompt = this.buildClarificationPrompt(
      step,
      previousResponse
    );
    const needsClarification = await this.llmModel.evaluate(
      clarificationPrompt
    );

    if (!needsClarification) {
      return previousResponse;
    }

    const clarificationQuestion = await this.llmModel.generate(
      CLARIFICATION_PROMPT,
      {
        question: step.content,
        response: previousResponse,
      }
    );

    return clarificationQuestion;
  }

  async negotiateResponse(
    response: string,
    constraints: any,
    attemptCount: number = 0
  ): Promise<string> {
    if (attemptCount >= this.config.negotiationAttempts) {
      throw new Error("Maximum negotiation attempts reached");
    }

    const negotiationPrompt = this.buildNegotiationPrompt(
      response,
      constraints
    );
    const needsNegotiation = await this.llmModel.evaluate(negotiationPrompt);

    if (!needsNegotiation) {
      return response;
    }

    const negotiationResponse = await this.llmModel.generate(
      NEGOTIATION_PROMPT,
      {
        response,
        constraints,
      }
    );

    return negotiationResponse;
  }

  async repeatQuestion(step: Step): Promise<string> {
    const rephrasedQuestion = await this.llmModel.generate({
      role: "interviewer",
      content: `Rephrase the following interview question in a clear and possibly simpler way,
                maintaining the same technical requirements: ${step.content}`,
    });

    return rephrasedQuestion;
  }

  async assessResponseQuality(
    step: Step,
    response: string
  ): Promise<QualityAssessment> {
    const assessment = await this.llmModel.generate(QUALITY_ASSESSMENT_PROMPT, {
      question: step.content,
      response: response,
    });

    return this.parseQualityAssessment(assessment);
  }

  private buildClarificationPrompt(step: Step, response: string): LLMPrompt {
    return {
      role: "interviewer",
      content: `Question: ${step.content}\nResponse: ${response}\n${CLARIFICATION_PROMPT.content}`,
    };
  }

  private buildNegotiationPrompt(
    response: string,
    constraints: any
  ): LLMPrompt {
    return {
      role: "interviewer",
      content: `Response: ${response}\nConstraints: ${JSON.stringify(
        constraints
      )}\n${NEGOTIATION_PROMPT.content}`,
    };
  }

  private parseQualityAssessment(assessment: any): QualityAssessment {
    return {
      score: assessment.score,
      feedback: assessment.feedback,
      suggestedImprovements: assessment.improvements,
      confidence: assessment.confidence,
    };
  }
}
