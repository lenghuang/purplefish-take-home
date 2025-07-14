// conversation-service.ts
// This file provides business logic for handling conversation flows. We extend it to integrate
// the FAQ switching and ReAct agent logic. We also preserve existing logic for creating and
// managing conversations.

import { drizzleService } from '@/db/services/drizzle-service';
import { nanoid } from 'nanoid';
import type { InterviewState, Message } from '@/lib/services/local-storage-service';

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
export async function clearAllConversations() {
  return drizzleService.clearAllConversations();
}

/**
 * Creates a new conversation with a default "intro" stage and an initial greeting message.
 * In the rest of the flow, we'll handle transitions to "greeting" or other stages as needed.
 */
export async function createConversation() {
  // Default initial interview state
  const initialState: InterviewState = {
    stage: 'intro',
    completed: false,
  };

  // Default initial message from assistant
  const initialMessage: Message = {
    id: nanoid(),
    role: 'assistant',
    content:
      "Welcome! Let's start your interview. Please introduce yourself or ask your first question.",
  };

  return drizzleService.createConversation(initialState, initialMessage);
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
  const conversation = await drizzleService.getConversation(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }

  let { messages, state: interviewState } = conversation;
  if (!interviewState) {
    interviewState = { stage: 'intro', completed: false };
  }

  // Create a user message object
  const userMessage: Message = {
    id: nanoid(),
    role: 'user',
    content: userMessageContent,
  };
  messages.push(userMessage);

  /* Removed direct FAQ handling. Let the ReAct agent handle FAQ logic via the FAQ tool. */

  // If it's not an FAQ question, proceed with normal interview flow

  // If the user is in "intro" stage, we can shift them to "greeting"
  if (interviewState.stage === 'intro') {
    interviewState.stage = 'greeting';
  }

  // Use existing function to extract structured updates
  const updates = extractStructuredData(userMessageContent, interviewState);
  console.log('[DEBUG] extractStructuredData updates:', updates);
  interviewState = { ...interviewState, ...updates };
  console.log('[DEBUG] New interviewState after updates:', interviewState);

  // If not completed or ended, call the ReAct agent for reasoning or tool calls
  let agentMessage: Message | null = null;
  if (!interviewState.completed && !interviewState.endedEarly) {
    // DEBUG: Log the messages array before passing to agent
    console.log('DEBUG: Messages passed to agent:', JSON.stringify(messages, null, 2));
    const agentReply = await processWithReActAgent(messages, interviewState);

    agentMessage = {
      id: nanoid(),
      role: 'assistant',
      content: agentReply,
    };
    messages.push(agentMessage);
  }

  // Persist user message
  await drizzleService.updateConversation(conversationId, interviewState, userMessage);

  // If we created an agent message, persist that as well
  if (agentMessage) {
    await drizzleService.updateConversation(conversationId, interviewState, agentMessage);
  }

  // Return the latest assistant message or a fallback if ended
  const lastMsg = messages[messages.length - 1];
  return lastMsg?.content || 'Interview ended or completed.';
}
