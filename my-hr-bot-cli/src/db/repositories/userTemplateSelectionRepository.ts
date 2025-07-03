import { db } from "../client";
import { userTemplateSelection } from "../schema";
import { eq } from "drizzle-orm";

export class UserTemplateSelectionRepository {
  async create(data: Omit<typeof userTemplateSelection.$inferInsert, "id">) {
    const [result] = await db
      .insert(userTemplateSelection)
      .values(data)
      .returning();
    return result;
  }

  async findById(id: number) {
    return db.query.userTemplateSelection.findFirst({
      where: eq(userTemplateSelection.id, id),
    });
  }

  async findAll() {
    return db.select().from(userTemplateSelection);
  }

  async findByUser(userId: string) {
    return db
      .select()
      .from(userTemplateSelection)
      .where(eq(userTemplateSelection.userId, userId));
  }

  async update(
    id: number,
    data: Partial<typeof userTemplateSelection.$inferInsert>
  ) {
    const [result] = await db
      .update(userTemplateSelection)
      .set(data)
      .where(eq(userTemplateSelection.id, id))
      .returning();
    return result;
  }

  async delete(id: number) {
    await db
      .delete(userTemplateSelection)
      .where(eq(userTemplateSelection.id, id));
  }
}
