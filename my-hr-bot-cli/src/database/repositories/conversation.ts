import { DatabaseService } from "../service";
import { Conversation } from "../schema";
import { IRepository, Filter } from "./base";

export class ConversationRepository implements IRepository<Conversation> {
  constructor(private dbService: DatabaseService) {}

  async findById(id: string): Promise<Conversation | null> {
    const row = this.dbService.connection
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(id);
    return row ? this.toEntity(row) : null;
  }

  async findAll(filter?: Filter): Promise<Conversation[]> {
    let query = "SELECT * FROM conversations";
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

  async create(entity: Conversation): Promise<Conversation> {
    this.dbService.connection
      .prepare(
        `INSERT INTO conversations (id, user_id, template_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        entity.id,
        entity.userId,
        entity.templateId,
        entity.status,
        entity.createdAt.toISOString(),
        entity.updatedAt.toISOString()
      );
    return entity;
  }

  async update(
    id: string,
    entity: Partial<Conversation>
  ): Promise<Conversation> {
    const fields = Object.keys(entity);
    const values = fields.map((key) => (entity as any)[key]);
    const setClause = fields
      .map((key) => `${this.toDbField(key)} = ?`)
      .join(", ");
    values.push(id);
    this.dbService.connection
      .prepare(`UPDATE conversations SET ${setClause} WHERE id = ?`)
      .run(...values);
    return this.findById(id) as Promise<Conversation>;
  }

  async delete(id: string): Promise<void> {
    this.dbService.connection
      .prepare("DELETE FROM conversations WHERE id = ?")
      .run(id);
  }

  private toEntity(row: any): Conversation {
    return {
      id: row.id,
      userId: row.user_id,
      templateId: row.template_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private toDbField(field: string): string {
    // Map camelCase to snake_case for DB columns
    return (
      {
        userId: "user_id",
        templateId: "template_id",
        createdAt: "created_at",
        updatedAt: "updated_at",
      }[field] || field
    );
  }
}
