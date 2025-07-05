import { messages } from "../schema";
import { eq } from "drizzle-orm";
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
    return RepositoryUtils.create(messages, data);
  }

  async findById(id: number) {
    return RepositoryUtils.findById(messages, this.db.query, "messages", id);
  }

  async findAll() {
    return RepositoryUtils.findAll(messages);
  }

  async findByConversation(conversationId: number) {
    // This method has custom logic, so we keep it separate
    return this.db
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
    // Use raw SQL for efficient pairing logic.
    // This query is fully compatible with SQLite (LEFT JOIN, NOT EXISTS, parameterization, and string escaping reviewed).
    // String literals use single quotes, and the query string uses double quotes (template literal).
    // If you change the schema or migrate to another DB, review this query for compatibility.
    const params: any[] = [conversationId];
    let stepFilter = "";
    if (stepId !== undefined) {
      stepFilter = "AND m1.step_id = ?";
      params.push(stepId);
    }

    // The query:
    // For each assistant message, find the next user message in the same step with a greater timestamp
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
        AND m2.step_id = m1.step_id
        AND m2.sender = 'user'
        AND m2.timestamp > m1.timestamp
        AND NOT EXISTS (
          SELECT 1 FROM messages m3
          WHERE m3.conversation_id = m1.conversation_id
            AND m3.step_id = m1.step_id
            AND m3.sender = 'user'
            AND m3.timestamp > m1.timestamp
            AND m3.timestamp < m2.timestamp
        )
      WHERE m1.conversation_id = ?
        AND m1.sender = 'assistant'
        ${stepFilter}
      ORDER BY m1.step_id, m1.timestamp
    `;

    try {
      // Use Drizzle ORM's raw SQL execution for better-sqlite3: use .run
      const result = await this.db.run(sql, params);
      // Drizzle's run returns { rows: [...] }
      const rows = result.rows ?? result;

      return rows.map((row: any) => ({
        questionId: row.questionId,
        question: row.question,
        answerId: row.answerId ?? null,
        answer: row.answer ?? null,
        stepId: row.stepId,
      }));
    } catch (error: any) {
      // Log the error to the CLI output
      console.error(
        "Database query failed in getQuestionAnswerPairs:",
        error?.message || error
      );
      // Optionally, rethrow to ensure CLI displays the error
      throw new Error(
        `Database query failed in getQuestionAnswerPairs: ${
          error?.message || error
        }`
      );
    }
  }
}
