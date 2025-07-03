import { db } from "../client";
import { conversations } from "../schema";
import { eq } from "drizzle-orm";

export class ConversationRepository {
  async create(data: Omit<typeof conversations.$inferInsert, "id">) {
    const [result] = await db.insert(conversations).values(data).returning();
    return result;
  }

  async findById(id: number) {
    return db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
  }

  async findAll() {
    return db.select().from(conversations);
  }

  async update(id: number, data: Partial<typeof conversations.$inferInsert>) {
    const [result] = await db
      .update(conversations)
      .set(data)
      .where(eq(conversations.id, id))
      .returning();
    return result;
  }

  async delete(id: number) {
    await db.delete(conversations).where(eq(conversations.id, id));
  }
}
