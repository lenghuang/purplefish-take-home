import { db } from "../client";
import { messages } from "../schema";
import { eq } from "drizzle-orm";
import { RepositoryUtils } from "./base";

export class MessageRepository {
  async create(data: Omit<typeof messages.$inferInsert, "id">) {
    return RepositoryUtils.create(messages, data);
  }

  async findById(id: number) {
    return RepositoryUtils.findById(messages, db.query, "messages", id);
  }

  async findAll() {
    return RepositoryUtils.findAll(messages);
  }

  async findByConversation(conversationId: number) {
    // This method has custom logic, so we keep it separate
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));
  }

  async update(id: number, data: Partial<typeof messages.$inferInsert>) {
    return RepositoryUtils.update(messages, id, data);
  }

  async delete(id: number) {
    return RepositoryUtils.delete(messages, id);
  }
}
