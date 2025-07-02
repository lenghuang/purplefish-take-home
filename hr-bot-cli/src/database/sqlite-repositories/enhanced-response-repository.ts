import { Database } from "sqlite3";
import { ApplicationError } from "../types";
import { BaseSQLiteRepository } from "./base-repository";
import {
  EnhancedResponse,
  ClarificationEntry,
  NegotiationEntry,
} from "../../template-system/interaction/types";
import { v4 as uuidv4 } from "uuid";

interface EnhancedResponseRecord extends EnhancedResponse {
  id: string;
  interview_id: string;
  created_at: Date;
}

export class SQLiteEnhancedResponseRepository extends BaseSQLiteRepository<EnhancedResponseRecord> {
  tableName = "enhanced_responses";

  constructor(db: Database) {
    super(db);
    this.initializeTables();
  }

  private generateId(): string {
    return uuidv4();
  }

  private async initializeTables(): Promise<void> {
    try {
      await this.db.run("BEGIN TRANSACTION");

      // Enhanced responses table
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          interview_id TEXT NOT NULL,
          step_id TEXT NOT NULL,
          response TEXT NOT NULL,
          clarification_attempts INTEGER DEFAULT 0,
          negotiation_attempts INTEGER DEFAULT 0,
          quality_score REAL,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (interview_id) REFERENCES interviews (id)
        )
      `);

      // Clarification history table
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS clarification_history (
          id TEXT PRIMARY KEY,
          response_id TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          original_response TEXT NOT NULL,
          clarification_request TEXT NOT NULL,
          updated_response TEXT NOT NULL,
          FOREIGN KEY (response_id) REFERENCES enhanced_responses (id)
        )
      `);

      // Negotiation history table
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS negotiation_history (
          id TEXT PRIMARY KEY,
          response_id TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          original_response TEXT NOT NULL,
          constraint TEXT NOT NULL,
          counter_proposal TEXT NOT NULL,
          resolution TEXT NOT NULL,
          FOREIGN KEY (response_id) REFERENCES enhanced_responses (id)
        )
      `);

      await this.db.run("COMMIT");
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw new ApplicationError(
        "Error initializing enhanced response tables",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async saveEnhancedResponse(
    interviewId: string,
    response: EnhancedResponse
  ): Promise<string> {
    try {
      await this.db.run("BEGIN TRANSACTION");

      // Save main response
      const responseId = this.generateId();
      const enhancedResponseRecord: EnhancedResponseRecord = {
        id: responseId,
        interview_id: interviewId,
        created_at: new Date(),
        ...response,
        metadata: response.metadata || {},
      };

      await this.create(enhancedResponseRecord);

      // Save clarification history
      for (const entry of response.clarificationHistory) {
        await this.runQuery(
          `INSERT INTO clarification_history (
            id, response_id, timestamp, original_response,
            clarification_request, updated_response
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            this.generateId(),
            responseId,
            entry.timestamp,
            entry.originalResponse,
            entry.clarificationRequest,
            entry.updatedResponse,
          ]
        );
      }

      // Save negotiation history
      for (const entry of response.negotiationHistory) {
        await this.runQuery(
          `INSERT INTO negotiation_history (
            id, response_id, timestamp, original_response,
            constraint, counter_proposal, resolution
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            this.generateId(),
            responseId,
            entry.timestamp,
            entry.originalResponse,
            entry.constraint,
            entry.counterProposal,
            entry.resolution,
          ]
        );
      }

      await this.db.run("COMMIT");
      return responseId;
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw new ApplicationError(
        "Error saving enhanced response",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async getResponseHistory(responseId: string): Promise<EnhancedResponse> {
    try {
      const response = await this.findById(responseId);
      if (!response) {
        throw new ApplicationError("Response not found", "NOT_FOUND", 404);
      }

      // Get clarification history
      const clarificationHistory = await this.getAll(
        "SELECT * FROM clarification_history WHERE response_id = ? ORDER BY timestamp",
        [responseId]
      );

      // Get negotiation history
      const negotiationHistory = await this.getAll(
        "SELECT * FROM negotiation_history WHERE response_id = ? ORDER BY timestamp",
        [responseId]
      );

      return {
        stepId: response.stepId,
        response: response.response,
        clarificationAttempts: response.clarificationAttempts,
        negotiationAttempts: response.negotiationAttempts,
        qualityScore: response.qualityScore,
        metadata: response.metadata,
        clarificationHistory: clarificationHistory.map(
          this.mapToClarificationEntry
        ),
        negotiationHistory: negotiationHistory.map(this.mapToNegotiationEntry),
      };
    } catch (error) {
      throw new ApplicationError(
        "Error retrieving response history",
        "DATABASE_ERROR",
        500
      );
    }
  }

  private mapToClarificationEntry(row: any): ClarificationEntry {
    return {
      timestamp: new Date(row.timestamp),
      originalResponse: row.original_response,
      clarificationRequest: row.clarification_request,
      updatedResponse: row.updated_response,
    };
  }

  private mapToNegotiationEntry(row: any): NegotiationEntry {
    return {
      timestamp: new Date(row.timestamp),
      originalResponse: row.original_response,
      constraint: row.constraint,
      counterProposal: row.counter_proposal,
      resolution: row.resolution,
    };
  }

  protected mapToEntity(row: any): EnhancedResponseRecord {
    return {
      id: row.id,
      interview_id: row.interview_id,
      stepId: row.step_id,
      response: row.response,
      clarificationAttempts: row.clarification_attempts,
      negotiationAttempts: row.negotiation_attempts,
      qualityScore: row.quality_score,
      metadata: JSON.parse(row.metadata || "{}"),
      clarificationHistory: [],
      negotiationHistory: [],
      created_at: new Date(row.created_at),
    };
  }
}
