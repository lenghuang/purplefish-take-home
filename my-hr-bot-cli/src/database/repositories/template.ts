import { DatabaseService } from "../service";
import { DatabaseTemplate } from "../schema";
import { IRepository, Filter } from "./base";

export class TemplateRepository implements IRepository<DatabaseTemplate> {
  constructor(private dbService: DatabaseService) {}

  async findById(id: string): Promise<DatabaseTemplate | null> {
    const row = this.dbService.connection
      .prepare("SELECT * FROM templates WHERE id = ?")
      .get(id);
    return row ? this.toEntity(row) : null;
  }

  async findAll(filter?: Filter): Promise<DatabaseTemplate[]> {
    let query = "SELECT * FROM templates";
    const params: any[] = [];
    if (filter && Object.keys(filter).length > 0) {
      const clauses = Object.keys(filter).map((key) => {
        params.push(filter[key]);
        return `${key} = ?`;
      });
      query += " WHERE " + clauses.join(" AND ");
    }
    const rows = this.dbService.connection.prepare(query).all(...params);
    return rows.map(this.toEntity);
  }

  async create(entity: DatabaseTemplate): Promise<DatabaseTemplate> {
    this.dbService.connection
      .prepare(
        `INSERT INTO templates (id, name, description, version, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        entity.id,
        entity.name,
        entity.description,
        entity.version,
        JSON.stringify(entity.content),
        entity.createdAt.toISOString(),
        entity.updatedAt.toISOString()
      );
    return entity;
  }

  async update(
    id: string,
    entity: Partial<DatabaseTemplate>
  ): Promise<DatabaseTemplate> {
    const fields = Object.keys(entity);
    const values = fields.map((key) =>
      key === "content"
        ? JSON.stringify((entity as any)[key])
        : (entity as any)[key]
    );
    const setClause = fields
      .map((key) => `${this.toDbField(key)} = ?`)
      .join(", ");
    values.push(id);
    this.dbService.connection
      .prepare(`UPDATE templates SET ${setClause} WHERE id = ?`)
      .run(...values);
    return this.findById(id) as Promise<DatabaseTemplate>;
  }

  async delete(id: string): Promise<void> {
    this.dbService.connection
      .prepare("DELETE FROM templates WHERE id = ?")
      .run(id);
  }

  private toEntity(row: any): DatabaseTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      content: JSON.parse(row.content),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private toDbField(field: string): string {
    return (
      {
        createdAt: "created_at",
        updatedAt: "updated_at",
      }[field] || field
    );
  }
}
