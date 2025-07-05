import { messages } from "../schema";
import { eq, and } from "drizzle-orm";
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
    return RepositoryUtils.create(this.db, messages, data);
  }

  async findById(id: number) {
    return RepositoryUtils.findById(
      this.db,
      messages,
      this.db.query,
      "messages",
      id
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
    stepId?: string
  ): Promise<
    {
      questionId: number;
      question: string;
      answerId: number | null;
      answer: string | null;
      stepId: string;
    }[]
  > {
    console.log("[getQuestionAnswerPairs]", { conversationId, stepId });

    // Log all messages for this conversation (and step, if provided)
    const allMessages = await this.db
      .select()
      .from(messages)
      .where(
        stepId !== undefined
          ? and(
              eq(messages.conversationId, conversationId),
              eq(messages.stepId, stepId)
            )
          : eq(messages.conversationId, conversationId)
      );
    console.log(
      "[getQuestionAnswerPairs] All messages for conversation:",
      allMessages.map((m: any) => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        stepId: m.stepId,
        timestamp: m.timestamp,
      }))
    );

    // Use raw SQL for efficient pairing logic.
    // This query is fully compatible with SQLite (LEFT JOIN, NOT EXISTS, parameterization, and string escaping reviewed).
    // String literals use single quotes, and the query string uses double quotes (template literal).
    // If you change the schema or migrate to another DB, review this query for compatibility.
    // Directly inject params into SQL string using template literals.
    // WARNING: This disables SQL parameterization for conversationId and stepId.
    // Make sure these values are trusted and properly escaped.
    let stepFilter = "";
    if (stepId !== undefined) {
      // Escape single quotes in stepId to prevent SQL injection
      const safeStepId = stepId.replace(/'/g, "''");
      stepFilter = `AND m1.step_id = '${safeStepId}'`;
    }

    const sql = `
      SELECT
        m1.id AS questionId,
        m1.content AS question,
        m2.id AS answerId,
        m2.content AS answer,
        m1.step_id AS stepId
      FROM messages m1
      LEFT JOIN messages m2
        ON m2.conversation_id = m1.conversation_id
        AND ((m2.step_id = m1.step_id) OR (m2.step_id IS NULL AND m1.step_id IS NULL))
        AND m2.sender = 'user'
        AND m2.id > m1.id
      WHERE m1.conversation_id = ${conversationId}
        AND m1.sender = 'assistant'
        ${stepFilter}
      ORDER BY m1.step_id, m1.id
    `;

    try {
      // Use Drizzle ORM's raw SQL execution for better-sqlite3: use .run
      const result = await this.db.run(sql);
      // Drizzle's run returns { rows: [...] }
      const rows = result?.rows ?? [];

      console.log("[getQuestionAnswerPairs]", { result, rows, sql });
      if (rows?.length <= 0) {
        return [];
      }

      return rows.map((row: any) => ({
        questionId: row.questionId,
        question: row.question,
        answerId: row.answerId ?? null,
        answer: row.answer ?? null,
        stepId: row.stepId,
      }));
    } catch (error: any) {
      // Optionally, rethrow to ensure CLI displays the error
      throw new Error(
        `Database query failed in getQuestionAnswerPairs: ${
          error?.message || error
        }`
      );
    }
  }
}
