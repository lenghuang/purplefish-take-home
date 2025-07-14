// conversation-service.ts
// This file provides business logic for handling conversation flows. We extend it to integrate
// the FAQ switching and ReAct agent logic. We also preserve existing logic for creating and
// managing conversations.

import { drizzleService } from '@/db/services/drizzle-service';
import { nanoid } from 'nanoid';
import type { Message } from '@/lib/services/local-storage-service';
import type { PhaseState } from '@/db/services/drizzle-service';

// We import the main logic from chat-service to handle user inputs, structured data extraction,
// and possible FAQ redirection.
import { extractStructuredData, processWithReActAgent } from '@/app/api/chat/chat-service';

/**
 * Returns all conversations stored in the system.
 */
export async function getAllConversations() {
  return drizzleService.getAllConversations();
}

/**
 * Clears all conversations from the system.
 */
import { db } from '@/db/index';
import { conversations, phaseStates, messages } from '@/db/schema';

/**
 * Deletes all conversations, phase states, and messages from the database.
 */
export async function clearAllConversations() {
  await db.delete(messages);
  await db.delete(phaseStates);
  await db.delete(conversations);
}

/**
 * Creates a new conversation with a default "intro" stage and an initial greeting message.
 * In the rest of the flow, we'll handle transitions to "greeting" or other stages as needed.
 */
/**
 * Creates a new conversation with a default "intro" phase state and an initial greeting message.
 */
export async function createConversation() {
  const id = nanoid();
  const phaseState = {
    id: nanoid(),
    conversationId: id,
    phaseId: 'intro',
    status: 'in_progress',
    completedQuestions: [],
    answers: {},
    lastUpdated: new Date(),
  };
  const initialMessage = {
    id: nanoid(),
    role: 'assistant',
    content: 'Welcome! This is the start of your interview.',
    createdAt: new Date(),
  };
  await drizzleService.upsertConversation(id, phaseState, initialMessage);
  return { id };
}

/**
 * Processes a user's message within a specific conversation. We:
 * 1) Retrieve the existing conversation's state and messages from the DB.
 * 2) Detect if it's an FAQ question. If so, we invoke the FAQ tool and return its answer.
 * 3) Otherwise, continue the main interview flow using extractStructuredData and the ReAct agent.
 * 4) Update and persist the conversation state and messages.
 */
export async function processConversationMessage(
  conversationId: string,
  userMessageContent: string,
) {
  // Load all messages for the conversation
  // NOTE: Old conversation state model removed. If you need messages, load them from phase state or another new source.
  let messages: Message[] = [];

  // Load or initialize phase state
  let phaseState: PhaseState | null = await drizzleService.getPhaseState(conversationId);
  if (!phaseState) {
    // Initialize a new phase state for this conversation
    phaseState = {
      id: nanoid(),
      conversationId,
      phaseId: 'intro',
      status: 'in_progress',
      completedQuestions: [],
      answers: {},
      lastUpdated: new Date(),
    };
    await drizzleService.upsertPhaseState(phaseState);
  }
  // At this point, phaseState is guaranteed to be PhaseState (not null)

  // Add the user message
  const userMessage: Message = {
    id: nanoid(),
    role: 'user',
    content: userMessageContent,
  };
  messages.push(userMessage);

  // Pass the phase state and messages to the agent (update this to use phase state)
  // You may need to update processWithReActAgent to accept phaseState and return updated phaseState
  const { agentReply, updatedPhaseState } = await processWithReActAgent(
    messages,
    phaseState as PhaseState,
  );

  // Add the agent's reply
  const agentMessage: Message = {
    id: nanoid(),
    role: 'assistant',
    content: agentReply,
  };
  messages.push(agentMessage);

  // Persist updated phase state
  await drizzleService.upsertPhaseState(updatedPhaseState);

  // Optionally, persist messages if needed (depends on your message persistence model)
  // await drizzleService.saveMessages(conversationId, [userMessage, agentMessage]);

  // Return the latest assistant message
  return agentReply;
}
