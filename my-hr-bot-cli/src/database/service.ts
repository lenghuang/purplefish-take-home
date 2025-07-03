import Database from "better-sqlite3";
import path from "path";

import { DatabaseTemplate } from "./schema";
import { Template } from "../template/types";
import { toBusinessTemplate } from "./utils";
import { TemplateRepository } from "./repositories/template";
import { MigrationRunner } from "./migration-runner";

/**
 * DatabaseService provides DB connection and high-level operations.
 */
export interface DatabaseServiceInterface {
  readonly connection: Database.Database;
  getAllTemplates(): Promise<Template[]>;
  saveUserTemplateSelection(userId: string, templateId: string): Promise<void>;
  getUserTemplateSelection(userId: string): Promise<string | null>;
  close(): void;
}

/**
 * DatabaseService provides DB connection and high-level operations.
 */
export class DatabaseService implements DatabaseServiceInterface {
  private db: Database.Database;

  private constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  private async initializeTables(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        version TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        template_id TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES templates (id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
      );

      CREATE TABLE IF NOT EXISTS user_template_selection (
        user_id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL
      );
    `);
  }

  static async init(dbPath: string): Promise<DatabaseService> {
    const instance = new DatabaseService(dbPath);
    await instance.initializeTables();
    return instance;
  }

  get connection(): Database.Database {
    return this.db;
  }

  /**
   * Returns all templates in the database.
   */
  async getAllTemplates(): Promise<Template[]> {
    try {
      const repo = new TemplateRepository(this);
      const dbTemplates: DatabaseTemplate[] = await repo.findAll();
      return dbTemplates.map(toBusinessTemplate);
    } catch (err) {
      console.error("Failed to get all templates:", err);
      throw err;
    }
  }

  /**
   * Saves the user's selected template.
   * Upserts into user_template_selection (user_id, template_id).
   */
  async saveUserTemplateSelection(
    userId: string,
    templateId: string
  ): Promise<void> {
    try {
      this.db
        .prepare(
          `INSERT INTO user_template_selection (user_id, template_id)
           VALUES (?, ?)
           ON CONFLICT(user_id) DO UPDATE SET template_id = excluded.template_id`
        )
        .run(userId, templateId);
    } catch (err) {
      console.error("Failed to save user template selection:", err);
      throw err;
    }
  }

  /**
   * Gets the user's selected templateId, or null if not set.
   */
  async getUserTemplateSelection(userId: string): Promise<string | null> {
    try {
      const row = this.db
        .prepare(
          `SELECT template_id FROM user_template_selection WHERE user_id = ?`
        )
        .get(userId) as { template_id: string } | undefined;
      return row ? row.template_id : null;
    } catch (err) {
      console.error("Failed to get user template selection:", err);
      throw err;
    }
  }

  close(): void {
    this.db.close();
  }
}
