import { db } from "../client";
import { messages } from "../schema";
import { eq } from "drizzle-orm";

export class MessageRepository {
  async create(data: Omit<typeof messages.$inferInsert, "id">) {
    const [result] = await db.insert(messages).values(data).returning();
    return result;
  }

  async findById(id: number) {
    return db.query.messages.findFirst({ where: eq(messages.id, id) });
  }

  async findAll() {
    return db.select().from(messages);
  }

  async findByConversation(conversationId: number) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));
  }

  async update(id: number, data: Partial<typeof messages.$inferInsert>) {
    const [result] = await db
      .update(messages)
      .set(data)
      .where(eq(messages.id, id))
      .returning();
    return result;
  }

  async delete(id: number) {
    await db.delete(messages).where(eq(messages.id, id));
  }
}
