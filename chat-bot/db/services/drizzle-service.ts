import { db } from '../index';
import { conversations, messages, interviewStates } from '../schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type {
  InterviewState,
  Message,
  Conversation,
  ConversationSummary,
} from '../../lib/services/local-storage-service';

// Utility to generate a unique interview state ID
export function generateInterviewStateId() {
  return nanoid();
}

// Utility to serialize InterviewState for DB (excluding id/conversationId)
function serializeInterviewState(state: InterviewState, id: string, conversationId: string) {
  return {
    id,
    conversationId,
    ...state,
  };
}

// Utility to deserialize InterviewState from DB row
function deserializeInterviewState(row: any): InterviewState {
  if (!row) return null as any;
  // Remove id and conversationId, return the rest
  const { id, conversationId, ...state } = row;
  return state as InterviewState;
}

// Utility to serialize Message for DB
function serializeMessage(msg: Message, conversationId: string) {
  return {
    id: nanoid(),
    conversationId,
    role: msg.role,
    content: msg.content,
    createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
  };
}

// Utility to deserialize Message from DB row
function deserializeMessage(row: any): Message {
  return {
    id: row.id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    created_at: row.createdAt
      ? typeof row.createdAt === 'number'
        ? new Date(row.createdAt * 1000).toISOString()
        : new Date(row.createdAt).toISOString()
      : undefined,
  };
}

class DrizzleService {
  /**
   * Atomically creates or updates a conversation.
   * If a race condition causes a unique constraint violation on create, falls back to update.
   */
  /**
   * Upsert a conversation: if the id exists, update; otherwise, create with a new nanoid id.
   * If id is provided and exists, update. If not, create with a new id.
   */
  async upsertConversation(
    id: string | undefined,
    state: InterviewState,
    message: Message,
  ): Promise<Conversation | null> {
    if (id) {
      const existing = await this.getConversation(id);
      if (existing) {
        // Update existing conversation
        return await this.updateConversation(id, state, message);
      } else {
        // Do not create a new conversation if the provided id does not exist
        return null;
      }
    }
    // Create new conversation with a generated id
    return await this.createConversation(state, message);
  }
  // Create a new conversation with initial state and message
  /**
   * Create a new conversation and interview state with a generated nanoid id.
   */
  async createConversation(
    initialState: InterviewState,
    initialMessage: Message,
    id?: string,
  ): Promise<Conversation> {
    const conversationId = id ?? generateInterviewStateId();
    const now = new Date();
    let transactionError: unknown = null;
    let insertValues: any = null;
    try {
      // Prepare values for insert, only including schema-compliant fields
      insertValues = {
        id: conversationId,
        candidateName: initialState.candidateName ?? null,
        createdAt: now,
        updatedAt: now,
        completed: !!initialState.completed,
        lastMessage:
          initialMessage.content
            .replace(/\[STATE:[\s\S]*?\]/, '')
            .trim()
            .substring(0, 100) ?? null,
        stateId: conversationId,
      } as typeof conversations.$inferInsert;

      // All inserts in a transaction for atomicity
      await db.transaction((tx) => {
        tx.insert(interviewStates).values(
          serializeInterviewState(initialState, conversationId, conversationId),
        );
        const conversationInsertResult = tx.insert(conversations).values(insertValues);

        // Logging before message insert
        console.info('[drizzleService.createConversation] About to insert initial message', {
          conversationId,
          message: initialMessage,
        });

        const messageInsertResult = tx
          .insert(messages)
          .values(serializeMessage(initialMessage, conversationId));

        // Logging after message insert
        Promise.resolve(messageInsertResult)
          .then((result) => {
            if (!result || (Array.isArray(result) && result.length === 0)) {
              console.error('[drizzleService.createConversation] No message row inserted', {
                conversationId,
                message: initialMessage,
                insertResult: result,
              });
            } else {
              console.info('[drizzleService.createConversation] Message insert result', {
                conversationId,
                message: initialMessage,
                insertResult: result,
              });
            }
          })
          .catch((err) => {
            console.error('[drizzleService.createConversation] Error during message insert', {
              conversationId,
              message: initialMessage,
              error: err instanceof Error ? err.message : err,
            });
          });

        // Log the result of the conversations insert
        Promise.resolve(conversationInsertResult)
          .then((result) => {
            // Drizzle returns an array of inserted rows for SQLite
            if (!result || (Array.isArray(result) && result.length === 0)) {
              console.error('[drizzleService.createConversation] No conversation row inserted', {
                conversationId,
                insertValues,
                insertResult: result,
              });
            } else {
              console.info('[drizzleService.createConversation] Conversation insert result', {
                conversationId,
                insertValues,
                insertResult: result,
              });
            }
          })
          .catch((err) => {
            console.error('[drizzleService.createConversation] Error during conversation insert', {
              conversationId,
              insertValues,
              error: err instanceof Error ? err.message : err,
            });
          });
      });
    } catch (err) {
      transactionError = err;
      console.error('[drizzleService.createConversation] Transaction failed', {
        conversationId,
        insertValues,
        initialState,
        initialMessage,
        error: err instanceof Error ? err.message : err,
      });
      throw new Error(
        `[drizzleService.createConversation] Transaction failed for conversationId: ${conversationId} - ${err instanceof Error ? err.message : err}`,
      );
    }

    // Return the full conversation object, or throw if not found
    let conversation: Conversation | null = null;
    try {
      conversation = await this.getConversation(conversationId);
    } catch (err) {
      console.error('[drizzleService.createConversation] Retrieval failed after insert', {
        conversationId,
        error: err instanceof Error ? err.message : err,
      });
      throw new Error(
        `[drizzleService.createConversation] Retrieval failed for conversationId: ${conversationId} - ${err instanceof Error ? err.message : err}`,
      );
    }
    if (!conversation) {
      console.error('[drizzleService.createConversation] Conversation not found after insert', {
        conversationId,
        insertValues,
        initialState,
        initialMessage,
        transactionError,
      });
      throw new Error(
        `[drizzleService.createConversation] Failed to create or retrieve conversation with id: ${conversationId}`,
      );
    }
    return conversation;
  }

  // Get a conversation by id
  async getConversation(id: string): Promise<Conversation | null> {
    // Get conversation row
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
      with: {
        messages: {
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
        state: true,
      },
    });
    if (!conv) return null;

    // Compose Conversation object
    return {
      id: conv.id,
      candidateName: conv.candidateName ?? undefined,
      createdAt: conv.createdAt?.toISOString() ?? '',
      updatedAt: conv.updatedAt?.toISOString() ?? '',
      completed: !!conv.completed,
      endedEarly: !!conv.endedEarly,
      endReason: conv.endReason ?? undefined,
      lastMessage: conv.lastMessage ?? '',
      messages: (conv.messages ?? []).map(deserializeMessage),
      state: deserializeInterviewState(conv.state),
    };
  }

  // Update conversation state and/or add a new message
  async updateConversation(
    id: string,
    newState: InterviewState,
    newMessage?: Message,
  ): Promise<Conversation | null> {
    console.log(
      '[drizzleService.updateConversation] id:',
      id,
      'newState:',
      newState,
      'newMessage:',
      newMessage,
    );
    const now = new Date();
    // All updates/inserts in a transaction for atomicity
    await db.transaction((tx) => {
      tx.update(interviewStates)
        .set({ ...newState })
        .where(eq(interviewStates.id, id));
      // Update conversation fields
      const updateFields: any = {
        updatedAt: now,
        completed: newState.completed ? 1 : 0,
        endedEarly: newState.endedEarly ? 1 : 0,
        endReason: newState.endReason,
      };
      if (newMessage) {
        updateFields.lastMessage = newMessage.content
          .replace(/\[STATE:[\s\S]*?\]/, '')
          .trim()
          .substring(0, 100);
      }
      tx.update(conversations).set(updateFields).where(eq(conversations.id, id));
      // Insert new message if provided
      if (newMessage) {
        tx.insert(messages).values(serializeMessage(newMessage, id));
      }
    });

    // Return the updated conversation
    return this.getConversation(id);
  }

  // Get all conversations (summary)
  async getAllConversations(): Promise<ConversationSummary[]> {
    // Get all conversations, sorted by updatedAt desc
    const rows = await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
    return rows.map((conv) => ({
      id: conv.id,
      candidateName: conv.candidateName ?? undefined,
      createdAt: conv.createdAt?.toISOString() ?? '',
      completed: !!conv.completed,
      endedEarly: !!conv.endedEarly,
      lastMessage: conv.lastMessage ?? '',
    }));
  }

  // Clear all conversations, messages, and states
  async clearAllConversations(): Promise<void> {
    await db.delete(messages);
    await db.delete(interviewStates);
    await db.delete(conversations);
  }
}

export const drizzleService = new DrizzleService();
