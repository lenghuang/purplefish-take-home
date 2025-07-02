import { Database } from "sqlite3";
import { DatabaseConfig } from "./types";
import { SQLiteTemplateRepository } from "./sqlite-repositories/template-repository";
import { SQLiteInterviewRepository } from "./sqlite-repositories/interview-repository";
import { SQLiteCandidateRepository } from "./sqlite-repositories/candidate-repository";

export class DatabaseService {
  private db: Database;
  private templateRepository: SQLiteTemplateRepository;
  private interviewRepository: SQLiteInterviewRepository;
  private candidateRepository: SQLiteCandidateRepository;

  constructor(config: DatabaseConfig) {
    this.db = new Database(config.filename);
    this.templateRepository = new SQLiteTemplateRepository(this.db);
    this.interviewRepository = new SQLiteInterviewRepository(this.db);
    this.candidateRepository = new SQLiteCandidateRepository(this.db);
  }

  async initialize(): Promise<void> {
    await this.createTables();
  }

  getTemplateRepository(): SQLiteTemplateRepository {
    return this.templateRepository;
  }

  getInterviewRepository(): SQLiteInterviewRepository {
    return this.interviewRepository;
  }

  getCandidateRepository(): SQLiteCandidateRepository {
    return this.candidateRepository;
  }

  async runTransaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      await this.db.run("BEGIN TRANSACTION");
      const result = await callback();
      await this.db.run("COMMIT");
      return result;
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw error;
    }
  }

  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            version TEXT NOT NULL,
            metadata JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          (err) => {
            if (err) reject(err);
          }
        );

        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS template_steps (
            id TEXT PRIMARY KEY,
            template_id TEXT NOT NULL,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            conditions JSON,
            next_steps JSON,
            metadata JSON,
            sequence INTEGER NOT NULL,
            FOREIGN KEY(template_id) REFERENCES templates(id)
          )
        `,
          (err) => {
            if (err) reject(err);
          }
        );

        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS interviews (
            id TEXT PRIMARY KEY,
            template_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            status TEXT NOT NULL,
            current_step_id TEXT,
            metadata JSON,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY(template_id) REFERENCES templates(id)
          )
        `,
          (err) => {
            if (err) reject(err);
          }
        );

        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS interview_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            interview_id TEXT NOT NULL,
            step_id TEXT NOT NULL,
            response TEXT NOT NULL,
            metadata JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(interview_id) REFERENCES interviews(id)
          )
        `,
          (err) => {
            if (err) reject(err);
          }
        );

        this.db.run(
          `
          CREATE TABLE IF NOT EXISTS candidates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            metadata JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          (err) => {
            if (err) reject(err);
          }
        );

        this.db.run(
          "CREATE INDEX IF NOT EXISTS idx_templates_version ON templates(version)",
          (err) => {
            if (err) reject(err);
          }
        );
        this.db.run(
          "CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id)",
          (err) => {
            if (err) reject(err);
          }
        );
        this.db.run(
          "CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status)",
          (err) => {
            if (err) reject(err);
          }
        );
        this.db.run(
          "CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)",
          (err) => {
            if (err) reject(err);
          }
        );
        this.db.run(
          "CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone)",
          (err) => {
            if (err) reject(err);
          }
        );
        // Resolve the promise when all commands are done
        resolve();
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
