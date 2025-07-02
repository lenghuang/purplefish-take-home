import { Database } from "sqlite3";
import { Candidate, ICandidateRepository, ApplicationError } from "../types";
import { BaseSQLiteRepository } from "./base-repository";

export class SQLiteCandidateRepository
  extends BaseSQLiteRepository<Candidate>
  implements ICandidateRepository
{
  tableName = "candidates";

  async findByEmail(email: string): Promise<Candidate | null> {
    try {
      const row = await this.getOne(
        `SELECT * FROM ${this.tableName} WHERE email = ?`,
        [email]
      );
      return row ? this.mapToEntity(row) : null;
    } catch (error) {
      throw new ApplicationError(
        "Error finding candidate by email",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async findByPhone(phone: string): Promise<Candidate | null> {
    try {
      const row = await this.getOne(
        `SELECT * FROM ${this.tableName} WHERE phone = ?`,
        [phone]
      );
      return row ? this.mapToEntity(row) : null;
    } catch (error) {
      throw new ApplicationError(
        "Error finding candidate by phone",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async create(candidate: Candidate): Promise<Candidate> {
    try {
      await this.db.run("BEGIN TRANSACTION");

      // Check for existing candidate with same email
      const existing = await this.findByEmail(candidate.email);
      if (existing) {
        throw new ApplicationError(
          "Candidate with this email already exists",
          "DUPLICATE_EMAIL",
          409
        );
      }

      const now = new Date();
      const result = await super.create({
        ...candidate,
        createdAt: now,
        updatedAt: now,
      });

      await this.db.run("COMMIT");
      return result;
    } catch (error) {
      await this.db.run("ROLLBACK");
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError(
        "Error creating candidate",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async update(id: string, candidate: Partial<Candidate>): Promise<Candidate> {
    try {
      await this.db.run("BEGIN TRANSACTION");

      // If email is being updated, check for duplicates
      if (candidate.email) {
        const existing = await this.findByEmail(candidate.email);
        if (existing && existing.id !== id) {
          throw new ApplicationError(
            "Candidate with this email already exists",
            "DUPLICATE_EMAIL",
            409
          );
        }
      }

      const result = await super.update(id, {
        ...candidate,
        updatedAt: new Date(),
      });

      await this.db.run("COMMIT");
      return result;
    } catch (error) {
      await this.db.run("ROLLBACK");
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError(
        "Error updating candidate",
        "DATABASE_ERROR",
        500
      );
    }
  }

  protected mapToEntity(row: any): Candidate {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      metadata: JSON.parse(row.metadata),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
