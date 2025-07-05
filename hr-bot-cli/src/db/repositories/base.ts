import { eq } from "drizzle-orm";

/**
 * BaseRepository - Utility functions to eliminate CRUD code duplication
 * Uses composition pattern instead of inheritance to avoid TypeScript generic complexity
 */
export class RepositoryUtils {
  static async create(db: any, table: any, data: any): Promise<any> {
    const result = await db.insert(table).values(data).returning();
    return Array.isArray(result) ? result[0] : result;
  }

  static async findById(
    db: any,
    table: any,
    queryTable: any,
    tableName: string,
    id: number
  ): Promise<any> {
    return queryTable[tableName].findFirst({
      where: eq(table.id, id),
    });
  }

  static async findAll(db: any, table: any): Promise<any[]> {
    return db.select().from(table);
  }

  static async update(
    db: any,
    table: any,
    id: number,
    data: any
  ): Promise<any> {
    const result = await db
      .update(table)
      .set(data)
      .where(eq(table.id, id))
      .returning();
    return Array.isArray(result) ? result[0] : result;
  }

  static async delete(db: any, table: any, id: number): Promise<void> {
    await db.delete(table).where(eq(table.id, id));
  }
}
