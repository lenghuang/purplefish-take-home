import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export interface Migration {
  id: string;
  filename: string;
  sql: string;
  appliedAt?: Date;
}

export interface MigrationRunnerConfig {
  migrationsDir: string;
  tableName?: string;
}

/**
 * MigrationRunner - New system that will gradually replace initializeTables()
 * Following Strangler Fig pattern: runs alongside old system initially
 */
export class MigrationRunner {
  private db: Database.Database;
  private config: MigrationRunnerConfig;
  private migrationTableName: string;

  constructor(db: Database.Database, config: MigrationRunnerConfig) {
    this.db = db;
    this.config = config;
    this.migrationTableName = config.tableName || 'schema_migrations';
  }

  /**
   * Initialize the migration tracking table
   */
  private initializeMigrationTable(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.migrationTableName} (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    this.db.exec(sql);
  }

  /**
   * Get all available migration files from the migrations directory
   */
  private getAvailableMigrations(): Migration[] {
    const migrationsDir = this.config.migrationsDir;
    
    if (!fs.existsSync(migrationsDir)) {
      return [];
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensures migrations run in order

    return files.map(filename => {
      const filepath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filepath, 'utf8');
      const id = filename.replace('.sql', '');
      
      return {
        id,
        filename,
        sql
      };
    });
  }

  /**
   * Get applied migrations from the database
   */
  private getAppliedMigrations(): Set<string> {
    try {
      const stmt = this.db.prepare(`SELECT id FROM ${this.migrationTableName}`);
      const rows = stmt.all() as { id: string }[];
      return new Set(rows.map(row => row.id));
    } catch (error) {
      // Migration table doesn't exist yet
      return new Set();
    }
  }

  /**
   * Apply a single migration
   */
  private applyMigration(migration: Migration): void {
    console.log(`Applying migration: ${migration.filename}`);
    
    const transaction = this.db.transaction(() => {
      // Execute the migration SQL
      this.db.exec(migration.sql);
      
      // Record that this migration was applied
      const stmt = this.db.prepare(
        `INSERT INTO ${this.migrationTableName} (id, filename) VALUES (?, ?)`
      );
      stmt.run(migration.id, migration.filename);
    });

    transaction();
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<{ applied: string[], skipped: string[] }> {
    this.initializeMigrationTable();
    
    const availableMigrations = this.getAvailableMigrations();
    const appliedMigrations = this.getAppliedMigrations();
    
    const applied: string[] = [];
    const skipped: string[] = [];

    for (const migration of availableMigrations) {
      if (appliedMigrations.has(migration.id)) {
        skipped.push(migration.id);
        continue;
      }

      try {
        this.applyMigration(migration);
        applied.push(migration.id);
      } catch (error) {
        console.error(`Failed to apply migration ${migration.filename}:`, error);
        throw error;
      }
    }

    return { applied, skipped };
  }

  /**
   * Check if all migrations have been applied
   */
  async isMigrated(): Promise<boolean> {
    const availableMigrations = this.getAvailableMigrations();
    const appliedMigrations = this.getAppliedMigrations();
    
    return availableMigrations.every(migration => 
      appliedMigrations.has(migration.id)
    );
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    available: number;
    applied: number;
    pending: string[];
  }> {
    const availableMigrations = this.getAvailableMigrations();
    const appliedMigrations = this.getAppliedMigrations();
    
    const pending = availableMigrations
      .filter(migration => !appliedMigrations.has(migration.id))
      .map(migration => migration.id);

    return {
      available: availableMigrations.length,
      applied: appliedMigrations.size,
      pending
    };
  }
}