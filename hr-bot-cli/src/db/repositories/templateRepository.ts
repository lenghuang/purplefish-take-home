import { templates } from "../schema";
import { RepositoryUtils } from "./base";

export class TemplateRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async create(data: Omit<typeof templates.$inferInsert, "id">) {
    return RepositoryUtils.create(this.db, templates, data);
  }

  async findById(id: number) {
    return RepositoryUtils.findById(
      this.db,
      templates,
      this.db.query,
      "templates",
      id
    );
  }

  async findAll() {
    return RepositoryUtils.findAll(this.db, templates);
  }

  async update(id: number, data: Partial<typeof templates.$inferInsert>) {
    return RepositoryUtils.update(this.db, templates, id, data);
  }

  async delete(id: number) {
    return RepositoryUtils.delete(this.db, templates, id);
  }
}
