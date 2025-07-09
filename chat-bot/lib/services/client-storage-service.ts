import type {
  InterviewState,
  Message,
  Conversation,
  ConversationSummary,
} from './local-storage-service';

// Pure client-side localStorage service for optimistic updates and offline support
class ClientStorageService {
  private LS_KEY_PREFIX = 'conversation_';

  async saveLocally(id: string, state: InterviewState, message?: Message) {
    const key = this.LS_KEY_PREFIX + id;
    let conv: Conversation | null = await this.getLocal(id);
    if (!conv) {
      conv = {
        id,
        state,
        messages: message ? [message] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Conversation;
    } else {
      conv.state = state;
      if (message) {
        conv.messages = [...conv.messages, message];
      }
      conv.updatedAt = new Date().toISOString();
    }
    localStorage.setItem(key, JSON.stringify(conv));
    return conv;
  }

  async getLocal(id: string): Promise<Conversation | null> {
    const key = this.LS_KEY_PREFIX + id;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Conversation) : null;
  }

  async getAllLocal(): Promise<ConversationSummary[]> {
    const summaries: ConversationSummary[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.LS_KEY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const conv = JSON.parse(raw) as Conversation;
          summaries.push({
            id: conv.id,
            candidateName: conv.state?.candidateName,
            createdAt: conv.createdAt,
            completed: conv.state?.completed,
            endedEarly: conv.state?.endedEarly,
            lastMessage: conv.messages?.[conv.messages.length - 1]?.content || '',
          });
        }
      }
    }
    return summaries;
  }

  async clearAllLocal() {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.LS_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  // Optionally, sync with server (fetch and update local)
  async syncWithServer(id: string) {
    const res = await fetch(`/api/conversations/${id}`);
    if (res.ok) {
      const conv = await res.json();
      localStorage.setItem(this.LS_KEY_PREFIX + id, JSON.stringify(conv));
      return conv;
    }
    return null;
  }
}

export const clientStorageService = new ClientStorageService();
