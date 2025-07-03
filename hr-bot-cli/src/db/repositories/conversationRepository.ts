import { db } from "../client";
import { conversations } from "../schema";
import { RepositoryUtils } from "./base";

export class ConversationRepository {
  async create(data: Omit<typeof conversations.$inferInsert, "id">) {
    return RepositoryUtils.create(conversations, data);
  }

  async findById(id: number) {
    return RepositoryUtils.findById(conversations, db.query, "conversations", id);
  }

  async findAll() {
    return RepositoryUtils.findAll(conversations);
  }

  async update(id: number, data: Partial<typeof conversations.$inferInsert>) {
    return RepositoryUtils.update(conversations, id, data);
  }

  async delete(id: number) {
    return RepositoryUtils.delete(conversations, id);
  }
}
