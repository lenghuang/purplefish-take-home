import { DatabaseService } from "../service";
import { Outcome } from "../schema";
import { IRepository, Filter } from "./base";

export class OutcomeRepository implements IRepository<Outcome> {
  constructor(private dbService: DatabaseService) {}

  async findById(id: string): Promise<Outcome | null> {
    const row = this.dbService.connection
      .prepare("SELECT * FROM outcomes WHERE id = ?")
      .get(id);
    return row ? this.toEntity(row) : null;
  }

  async findAll(filter?: Filter): Promise<Outcome[]> {
    let query = "SELECT * FROM outcomes";
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

  async create(entity: Outcome): Promise<Outcome> {
    this.dbService.connection
      .prepare(
        `INSERT INTO outcomes (id, conversation_id, type, value, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        entity.id,
        entity.conversationId,
        entity.type,
        JSON.stringify(entity.value),
        JSON.stringify(entity.metadata),
        entity.createdAt.toISOString()
      );
    return entity;
  }

  async update(id: string, entity: Partial<Outcome>): Promise<Outcome> {
    const fields = Object.keys(entity);
    const values = fields.map((key) =>
      ["value", "metadata"].includes(key)
        ? JSON.stringify((entity as any)[key])
        : (entity as any)[key]
    );
    const setClause = fields
      .map((key) => `${this.toDbField(key)} = ?`)
      .join(", ");
    values.push(id);
    this.dbService.connection
      .prepare(`UPDATE outcomes SET ${setClause} WHERE id = ?`)
      .run(...values);
    return this.findById(id) as Promise<Outcome>;
  }

  async delete(id: string): Promise<void> {
    this.dbService.connection
      .prepare("DELETE FROM outcomes WHERE id = ?")
      .run(id);
  }

  private toEntity(row: any): Outcome {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      type: row.type,
      value: JSON.parse(row.value),
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: new Date(row.created_at),
    };
  }

  private toDbField(field: string): string {
    return (
      {
        conversationId: "conversation_id",
        createdAt: "created_at",
      }[field] || field
    );
  }
}
