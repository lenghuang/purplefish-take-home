import { userTemplateSelection } from "../schema";
import { eq } from "drizzle-orm";

export class UserTemplateSelectionRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async create(data: Omit<typeof userTemplateSelection.$inferInsert, "id">) {
    const [result] = await this.db
      .insert(userTemplateSelection)
      .values(data)
      .returning();
    return result;
  }

  async findById(id: number) {
    return this.db.query.userTemplateSelection.findFirst({
      where: eq(userTemplateSelection.id, id),
    });
  }

  async findAll() {
    return this.db.select().from(userTemplateSelection);
  }

  async findByUser(userId: string) {
    return this.db
      .select()
      .from(userTemplateSelection)
      .where(eq(userTemplateSelection.userId, userId));
  }

  async update(
    id: number,
    data: Partial<typeof userTemplateSelection.$inferInsert>,
  ) {
    const [result] = await this.db
      .update(userTemplateSelection)
      .set(data)
      .where(eq(userTemplateSelection.id, id))
      .returning();
    return result;
  }

  async delete(id: number) {
    await this.db
      .delete(userTemplateSelection)
      .where(eq(userTemplateSelection.id, id));
  }
}
