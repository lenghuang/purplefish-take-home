import { conversations } from "../schema";
import { RepositoryUtils } from "./base";

export class ConversationRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async create(data: Omit<typeof conversations.$inferInsert, "id">) {
    return RepositoryUtils.create(this.db, conversations, data);
  }

  async findById(id: number) {
    return RepositoryUtils.findById(
      this.db,
      conversations,
      this.db.query,
      "conversations",
      id
    );
  }

  async findAll() {
    return RepositoryUtils.findAll(this.db, conversations);
  }

  async update(id: number, data: Partial<typeof conversations.$inferInsert>) {
    return RepositoryUtils.update(this.db, conversations, id, data);
  }

  async delete(id: number) {
    return RepositoryUtils.delete(this.db, conversations, id);
  }
}
