import { Database } from "sqlite3";
import {
  Interview,
  IInterviewRepository,
  Response,
  ApplicationError,
} from "../types";
import { BaseSQLiteRepository } from "./base-repository";

export class SQLiteInterviewRepository
  extends BaseSQLiteRepository<Interview>
  implements IInterviewRepository
{
  tableName = "interviews";

  async findByUserId(userId: string): Promise<Interview[]> {
    try {
      const rows = await this.getAll(
        `SELECT * FROM ${this.tableName} WHERE user_id = ?`,
        [userId]
      );
      return rows.map((row) => this.mapToEntity(row));
    } catch (error) {
      throw new ApplicationError(
        "Error finding interviews by user ID",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async findActiveInterviews(): Promise<Interview[]> {
    try {
      const rows = await this.getAll(
        `SELECT * FROM ${this.tableName} WHERE status = 'active'`
      );
      return rows.map((row) => this.mapToEntity(row));
    } catch (error) {
      throw new ApplicationError(
        "Error finding active interviews",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async saveResponse(interviewId: string, response: Response): Promise<void> {
    try {
      await this.db.run("BEGIN TRANSACTION");

      await this.runQuery(
        `INSERT INTO interview_responses (
          interview_id, step_id, response, metadata
        ) VALUES (?, ?, ?, ?)`,
        [
          interviewId,
          response.stepId,
          response.response,
          JSON.stringify(response.metadata),
        ]
      );

      await this.db.run("COMMIT");
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw new ApplicationError(
        "Error saving interview response",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async create(interview: Interview): Promise<Interview> {
    try {
      await this.db.run("BEGIN TRANSACTION");

      const result = await super.create({
        ...interview,
        startedAt: new Date(),
        status: "active",
      });

      await this.db.run("COMMIT");
      return result;
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw new ApplicationError(
        "Error creating interview",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async update(id: string, interview: Partial<Interview>): Promise<Interview> {
    try {
      await this.db.run("BEGIN TRANSACTION");

      if (interview.status === "completed" && !interview.completedAt) {
        interview.completedAt = new Date();
      }

      const result = await super.update(id, interview);

      await this.db.run("COMMIT");
      return result;
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw new ApplicationError(
        "Error updating interview",
        "DATABASE_ERROR",
        500
      );
    }
  }

  protected mapToEntity(row: any): Interview {
    return {
      id: row.id,
      templateId: row.template_id,
      userId: row.user_id,
      status: row.status as "active" | "completed" | "cancelled",
      currentStepId: row.current_step_id,
      metadata: JSON.parse(row.metadata),
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  }
}
