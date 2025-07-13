import { drizzleService } from '@/db/services/drizzle-service';

// Business logic for getting a conversation by ID
export async function getConversation(id: string) {
  const conversation = await drizzleService.getConversation(id);
  if (!conversation) return null;
  // Ensure robust response shape for frontend
  return {
    ...conversation,
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
    state:
      conversation.state && typeof conversation.state === 'object'
        ? conversation.state
        : { stage: 'greeting', completed: false },
  };
}

// Business logic for upserting a conversation by ID
export async function upsertConversation(id: string, state: any, message: any) {
  return drizzleService.upsertConversation(id, state, message);
}
