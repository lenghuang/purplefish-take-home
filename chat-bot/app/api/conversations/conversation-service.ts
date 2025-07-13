import { drizzleService } from '@/db/services/drizzle-service';
import { nanoid } from 'nanoid';
import type { InterviewState, Message } from '@/lib/services/local-storage-service';

// Business logic for getting all conversations
export async function getAllConversations() {
  return drizzleService.getAllConversations();
}

// Business logic for clearing all conversations
export async function clearAllConversations() {
  return drizzleService.clearAllConversations();
}

// Business logic for creating a new conversation
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
