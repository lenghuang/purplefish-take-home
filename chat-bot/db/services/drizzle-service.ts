import { db } from '../index';
import { conversations, messages, phaseStates } from '../schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type {
  Message,
  Conversation,
  ConversationSummary,
} from '../../lib/services/local-storage-service';

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
// --- Phase State Types and Helpers ---

export interface PhaseState {
  id: string;
  conversationId: string;
  phaseId: string;
  status: string;
  completedQuestions: string[]; // decoded from JSON
  answers: Record<string, any>; // decoded from JSON
  lastUpdated: Date;
}

// Serialize for DB (encode JSON fields)
function serializePhaseState(phaseState: PhaseState) {
  return {
    id: phaseState.id,
    conversationId: phaseState.conversationId,
    phaseId: phaseState.phaseId,
    status: phaseState.status,
    completedQuestions: JSON.stringify(phaseState.completedQuestions),
    answers: JSON.stringify(phaseState.answers),
    lastUpdated: phaseState.lastUpdated,
  };
}

// Deserialize from DB (decode JSON fields)
function deserializePhaseState(row: any): PhaseState {
  return {
    id: row.id,
    conversationId: row.conversationId,
    phaseId: row.phaseId,
    status: row.status,
    completedQuestions: JSON.parse(row.completedQuestions),
    answers: JSON.parse(row.answers),
    lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : new Date(),
  };
}

/*
 * Add these methods inside the existing DrizzleService class, not as a new class.
 *
 * Insert the following inside the DrizzleService class body:
 *
 *   async getPhaseState(conversationId: string): Promise<PhaseState | null> {
 *     const rows = await db
 *       .select()
 *       .from(phaseStates)
 *       .where(eq(phaseStates.conversationId, conversationId));
 *     if (!rows.length) return null;
 *     return deserializePhaseState(rows[0]);
 *   }
 *
 *   async upsertPhaseState(phaseState: PhaseState): Promise<void> {
 *     // Try update first
 *     const updated = await db
 *       .update(phaseStates)
 *       .set(serializePhaseState(phaseState))
 *       .where(eq(phaseStates.id, phaseState.id));
 *     if (updated.changes && updated.changes > 0) return;
 *     // If not updated, insert
 *     await db.insert(phaseStates).values(serializePhaseState(phaseState));
 *   }
 *
 * Remove the duplicate class DrizzleService definition here.
 */

class DrizzleService {
  /**
   * Atomically creates or updates a conversation.
   * If a race condition causes a unique constraint violation on create, falls back to update.
   */
  /**
   * Upsert a conversation: if the id exists, update; otherwise, create with a new nanoid id.
   * If id is provided and exists, update. If not, create with a new id.
   */

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

  /**
   * Get a phase state by conversationId and (optionally) phaseId.
   */
  async getPhaseState(conversationId: string, phaseId?: string): Promise<PhaseState | null> {
    let rows;
    if (phaseId) {
      rows = await db
        .select()
        .from(phaseStates)
        .where(
          and(eq(phaseStates.conversationId, conversationId), eq(phaseStates.phaseId, phaseId)),
        );
    } else {
      rows = await db
        .select()
        .from(phaseStates)
        .where(eq(phaseStates.conversationId, conversationId));
    }
    if (!rows.length) return null;
    return deserializePhaseState(rows[0]);
  }

  /**
   * Upsert a phase state (update if exists, otherwise insert).
   */
  async upsertPhaseState(phaseState: PhaseState): Promise<void> {
    // Ensure lastUpdated is a Date
    const serialized = serializePhaseState(phaseState);
    if (typeof serialized.lastUpdated === 'number') {
      serialized.lastUpdated = new Date(serialized.lastUpdated);
    } else if (typeof serialized.lastUpdated === 'string') {
      serialized.lastUpdated = new Date(Date.parse(serialized.lastUpdated));
    }
    // Use Drizzle's onConflictDoUpdate for atomic upsert
    await db
      .insert(phaseStates)
      .values({
        ...serialized,
        lastUpdated:
          typeof serialized.lastUpdated === 'number'
            ? new Date(serialized.lastUpdated)
            : typeof serialized.lastUpdated === 'string'
              ? new Date(Date.parse(serialized.lastUpdated))
              : serialized.lastUpdated,
      })
      .onConflictDoUpdate({
        target: phaseStates.id,
        set: {
          ...serialized,
          lastUpdated:
            typeof serialized.lastUpdated === 'number'
              ? new Date(serialized.lastUpdated)
              : typeof serialized.lastUpdated === 'string'
                ? new Date(Date.parse(serialized.lastUpdated))
                : serialized.lastUpdated,
        },
      });
  }
  /**
   * Get a conversation by ID, including messages and latest phase state.
   */
  async getConversation(id: string): Promise<any | null> {
    // Fetch the conversation
    const convRows = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!convRows.length) return null;
    const conversation = convRows[0];

    // Fetch messages for the conversation, sorted by createdAt
    const msgRows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    const msgs = msgRows.map(deserializeMessage);

    // Fetch the latest phase state for the conversation (if any)
    const phaseRows = await db
      .select()
      .from(phaseStates)
      .where(eq(phaseStates.conversationId, id))
      .orderBy(desc(phaseStates.lastUpdated));
    const state = phaseRows.length ? deserializePhaseState(phaseRows[0]) : undefined;

    return {
      ...conversation,
      messages: msgs,
      state,
    };
  }

  /**
   * Upsert a conversation by ID, state, and message.
   * - Updates or inserts the conversation row.
   * - Upserts the phase state.
   * - Inserts the new message.
   */
  async upsertConversation(id: string, state: any, message: any): Promise<void> {
    // Upsert conversation row (update updatedAt, lastMessage, etc.) atomically
    const now = new Date();
    await db
      .insert(conversations)
      .values({
        id,
        createdAt: now,
        updatedAt: now,
        lastMessage: message.content,
      })
      .onConflictDoUpdate({
        target: conversations.id,
        set: {
          updatedAt: now,
          lastMessage: message.content,
        },
      });

    // Upsert phase state
    if (state && state.id) {
      await this.upsertPhaseState(state);
    }

    // Insert message
    if (message) {
      await db.insert(messages).values(serializeMessage(message, id));
    }
  }
}

export const drizzleService = new DrizzleService();
