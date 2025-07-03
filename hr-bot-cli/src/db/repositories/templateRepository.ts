import { db } from "../client";
import { templates } from "../schema";
import { eq } from "drizzle-orm";

export class TemplateRepository {
  async create(data: Omit<typeof templates.$inferInsert, "id">) {
    const [result] = await db.insert(templates).values(data).returning();
    return result;
  }

  async findById(id: number) {
    return db.query.templates.findFirst({ where: eq(templates.id, id) });
  }

  async findAll() {
    return db.select().from(templates);
  }

  async update(id: number, data: Partial<typeof templates.$inferInsert>) {
    const [result] = await db
      .update(templates)
      .set(data)
      .where(eq(templates.id, id))
      .returning();
    return result;
  }

  async delete(id: number) {
    await db.delete(templates).where(eq(templates.id, id));
  }
}
