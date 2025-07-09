import { db } from '../index';
import { conversations, messages, interviewStates } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type {
  InterviewState,
  Message,
  Conversation,
  ConversationSummary,
} from '../../lib/services/local-storage-service';

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
    id: msg.id,
    conversationId,
    role: msg.role,
    content: msg.content,
  };
}

// Utility to deserialize Message from DB row
function deserializeMessage(row: any): Message {
  return {
    id: row.id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
  };
}

class DrizzleService {
  // Create a new conversation with initial state and message
  async createConversation(
    id: string,
    initialState: InterviewState,
    initialMessage: Message,
  ): Promise<Conversation> {
    const now = new Date();
    // Sequential inserts (no transaction due to Drizzle/Better-SQLite3 limitation)
    await db.insert(interviewStates).values(serializeInterviewState(initialState, id, id));
    await db.insert(conversations).values({
      id: id,
      candidateName: initialState.candidateName ?? null,
      createdAt: now,
      updatedAt: now,
      completed: !!initialState.completed,
      endedEarly: !!initialState.endedEarly,
      endReason: initialState.endReason ?? null,
      lastMessage:
        initialMessage.content
          .replace(/\[STATE:[\s\S]*?\]/, '')
          .trim()
          .substring(0, 100) ?? null,
      stateId: id,
    } as typeof conversations.$inferInsert);
    await db.insert(messages).values(serializeMessage(initialMessage, id));

    // Return the full conversation object
    return this.getConversation(id) as Promise<Conversation>;
  }

  // Get a conversation by id
  async getConversation(id: string): Promise<Conversation | null> {
    // Get conversation row
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
      with: {
        messages: true,
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
    // Sequential updates/inserts (no transaction due to Drizzle/Better-SQLite3 limitation)
    await db
      .update(interviewStates)
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
    await db.update(conversations).set(updateFields).where(eq(conversations.id, id));
    // Insert new message if provided
    if (newMessage) {
      await db.insert(messages).values(serializeMessage(newMessage, id));
    }

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
