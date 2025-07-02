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
    const sql = `INSERT INTO ${this.tableName} (id, template_id, user_id, status, current_step_id, metadata, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    try {
      await this.runQuery(sql, [
        interview.id,
        interview.templateId,
        interview.userId,
        interview.status,
        interview.currentStepId,
        JSON.stringify(interview.metadata),
        interview.startedAt.toISOString(),
      ]);
      return interview;
    } catch (error) {
      throw new ApplicationError(
        "Error creating interview",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async update(id: string, interview: Partial<Interview>): Promise<Interview> {
    if (interview.status === "completed" && !interview.completedAt) {
      interview.completedAt = new Date();
    }

    const fields = Object.keys(interview)
      .map((key) => {
        if (key === "templateId") return "template_id";
        if (key === "userId") return "user_id";
        if (key === "currentStepId") return "current_step_id";
        if (key === "startedAt") return "started_at";
        if (key === "completedAt") return "completed_at";
        return key;
      })
      .join(" = ?, ");
    const values = Object.values(interview).map((v) =>
      v instanceof Date ? v.toISOString() : v
    );

    const sql = `UPDATE ${this.tableName} SET ${fields} = ? WHERE id = ?`;

    try {
      await this.runQuery(sql, [...values, id]);
      const updatedInterview = await this.findById(id);
      if (!updatedInterview) {
        throw new ApplicationError(
          "Interview not found after update",
          "NOT_FOUND",
          404
        );
      }
      return updatedInterview;
    } catch (error) {
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
