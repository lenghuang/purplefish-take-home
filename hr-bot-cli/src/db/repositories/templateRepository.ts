import { db } from "../client";
import { templates } from "../schema";
import { RepositoryUtils } from "./base";

export class TemplateRepository {
  async create(data: Omit<typeof templates.$inferInsert, "id">) {
    return RepositoryUtils.create(templates, data);
  }

  async findById(id: number) {
    return RepositoryUtils.findById(templates, db.query, "templates", id);
  }

  async findAll() {
    return RepositoryUtils.findAll(templates);
  }

  async update(id: number, data: Partial<typeof templates.$inferInsert>) {
    return RepositoryUtils.update(templates, id, data);
  }

  async delete(id: number) {
    return RepositoryUtils.delete(templates, id);
  }
}
