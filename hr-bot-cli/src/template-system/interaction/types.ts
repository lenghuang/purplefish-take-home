import { Response } from "../../database/types";

export interface QualityAssessment {
  score: number; // 0-1 score indicating response quality
  feedback: string[]; // List of feedback points
  suggestedImprovements: string[];
  confidence: number; // 0-1 score indicating assessment confidence
}

export interface InteractionConfig {
  maxClarificationRetries: number;
  qualityThreshold: number; // Minimum quality score to accept response
  negotiationAttempts: number;
  responseTimeoutSeconds: number;
}

export interface EnhancedResponse extends Response {
  clarificationAttempts: number;
  negotiationAttempts: number;
  qualityScore?: number;
  clarificationHistory: ClarificationEntry[];
  negotiationHistory: NegotiationEntry[];
}

export interface ClarificationEntry {
  timestamp: Date;
  originalResponse: string;
  clarificationRequest: string;
  updatedResponse: string;
}

export interface NegotiationEntry {
  timestamp: Date;
  originalResponse: string;
  constraint: string;
  counterProposal: string;
  resolution: string;
}

export interface LLMPrompt {
  role: string;
  content: string;
}

export const DEFAULT_INTERACTION_CONFIG: InteractionConfig = {
  maxClarificationRetries: 3,
  qualityThreshold: 0.7,
  negotiationAttempts: 2,
  responseTimeoutSeconds: 300,
};
