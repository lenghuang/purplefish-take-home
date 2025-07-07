import { messages } from "../schema";
import { eq, and, sql } from "drizzle-orm";
import { RepositoryUtils } from "./base";

/**
 * MessageRepository now requires a Drizzle db instance to be injected.
 */
export class MessageRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async create(data: Omit<typeof messages.$inferInsert, "id">) {
    const result = await RepositoryUtils.create(this.db, messages, data);
    return result;
  }

  async findById(id: number) {
    return RepositoryUtils.findById(
      this.db,
      messages,
      this.db.query,
      "messages",
      id,
    );
  }

  async findAll() {
    return RepositoryUtils.findAll(this.db, messages);
  }

  async findByConversation(conversationId: number) {
    // This method has custom logic, so we keep it separate
    return this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));
  }

  async update(id: number, data: Partial<typeof messages.$inferInsert>) {
    return RepositoryUtils.update(this.db, messages, id, data);
  }

  async delete(id: number) {
    return RepositoryUtils.delete(this.db, messages, id);
  }
  /**
   * Returns a list of question/answer pairs for a conversation (and optionally step).
   * Each assistant message is paired with the next user message in order, within the same step.
   * @param conversationId Conversation ID
   * @param stepId Optional step ID to filter
   */
  async getQuestionAnswerPairs(
    conversationId: number,
    stepId?: string,
  ): Promise<
    {
      questionId: number;
      question: string;
      answerId: number | null;
      answer: string | null;
      stepId: string;
    }[]
  > {
    // Strict 1:1 Q/A pairing: fetch assistants and users separately, zip in JS
    try {
      // Fetch assistant messages
      const assistantWhere = [
        sql`conversation_id = ${conversationId}`,
        sql`sender = 'assistant'`,
      ];
      if (stepId !== undefined) {
        assistantWhere.push(sql`step_id = ${stepId}`);
      }
      const assistants = await this.db
        .select({
          id: sql`id`,
          content: sql`content`,
          stepId: sql`step_id`,
        })
        .from(sql`messages`)
        .where(and(...assistantWhere))
        .orderBy(sql`id`);

      // Fetch user messages
      const userWhere = [
        sql`conversation_id = ${conversationId}`,
        sql`sender = 'user'`,
      ];
      if (stepId !== undefined) {
        userWhere.push(sql`step_id = ${stepId}`);
      }
      const users = await this.db
        .select({
          id: sql`id`,
          content: sql`content`,
          stepId: sql`step_id`,
        })
        .from(sql`messages`)
        .where(and(...userWhere))
        .orderBy(sql`id`);

      // Zip assistant and user messages
      const minLen = Math.min(assistants.length, users.length);
      const pairs = [];
      for (let i = 0; i < minLen; i++) {
        pairs.push({
          questionId: assistants[i].id,
          question: assistants[i].content,
          answerId: users[i].id,
          answer: users[i].content,
          stepId: assistants[i].stepId,
        });
      }
      return pairs;
    } catch (error: any) {
      throw new Error(
        `Database query failed in getQuestionAnswerPairs: ${
          error?.message || error
        }`,
      );
    }
  }
}
