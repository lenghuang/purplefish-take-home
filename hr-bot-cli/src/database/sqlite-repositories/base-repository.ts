import { Database } from "sqlite3";
import { IRepository, Filter, ApplicationError } from "../types";

export abstract class BaseSQLiteRepository<T> implements IRepository<T> {
  constructor(protected db: Database) {}

  abstract tableName: string;

  protected async runQuery(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  protected async getOne(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  protected async getAll(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async findById(id: string): Promise<T | null> {
    try {
      const row = await this.getOne(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return row ? this.mapToEntity(row) : null;
    } catch (error) {
      throw new ApplicationError(
        `Error finding ${this.tableName} by ID`,
        "DATABASE_ERROR",
        500
      );
    }
  }

  async findAll(filter?: Filter): Promise<T[]> {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];

      if (filter) {
        const conditions = Object.entries(filter)
          .map(([key, value]) => {
            params.push(value);
            return `${key} = ?`;
          })
          .join(" AND ");
        sql += ` WHERE ${conditions}`;
      }

      const rows = await this.getAll(sql, params);
      return rows.map((row) => this.mapToEntity(row));
    } catch (error) {
      throw new ApplicationError(
        `Error finding all ${this.tableName}`,
        "DATABASE_ERROR",
        500
      );
    }
  }

  async create(entity: T): Promise<T> {
    try {
      const { columns, values, placeholders } = this.getInsertParams(entity);
      await this.runQuery(
        `INSERT INTO ${this.tableName} (${columns.join(
          ", "
        )}) VALUES (${placeholders})`,
        values
      );
      return entity;
    } catch (error) {
      throw new ApplicationError(
        `Error creating ${this.tableName}`,
        "DATABASE_ERROR",
        500
      );
    }
  }

  async update(id: string, entity: Partial<T>): Promise<T> {
    try {
      const { columns, values } = this.getUpdateParams(entity);
      values.push(id);

      await this.runQuery(
        `UPDATE ${this.tableName} SET ${columns
          .map((c) => `${c} = ?`)
          .join(", ")} WHERE id = ?`,
        values
      );

      const updated = await this.findById(id);
      if (!updated) {
        throw new ApplicationError(
          `${this.tableName} not found`,
          "NOT_FOUND",
          404
        );
      }
      return updated;
    } catch (error) {
      throw new ApplicationError(
        `Error updating ${this.tableName}`,
        "DATABASE_ERROR",
        500
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.runQuery(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    } catch (error) {
      throw new ApplicationError(
        `Error deleting ${this.tableName}`,
        "DATABASE_ERROR",
        500
      );
    }
  }

  protected abstract mapToEntity(row: any): T;

  protected getInsertParams(entity: any): {
    columns: string[];
    values: any[];
    placeholders: string;
  } {
    const entries = Object.entries(entity).filter(
      ([_, value]) => value !== undefined
    );
    const columns = entries.map(([key]) => key);
    const values = entries.map(([_, value]) => value);
    const placeholders = entries.map(() => "?").join(", ");
    return { columns, values, placeholders };
  }

  protected getUpdateParams(entity: any): { columns: string[]; values: any[] } {
    const entries = Object.entries(entity).filter(
      ([_, value]) => value !== undefined
    );
    const columns = entries.map(([key]) => key);
    const values = entries.map(([_, value]) => value);
    return { columns, values };
  }
}
