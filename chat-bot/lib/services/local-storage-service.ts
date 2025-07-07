export interface InterviewState {
  stage: string
  candidateName?: string
  position?: string
  desiredSalary?: number
  salaryAcceptable?: boolean
  hasLicense?: boolean
  licenseNumber?: string
  licenseExpiry?: string
  hasExperience?: boolean
  experienceYears?: number
  completed: boolean
  endedEarly?: boolean
  endReason?: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export interface Conversation {
  id: string
  candidateName?: string
  createdAt: string
  updatedAt: string // Added for sorting
  completed: boolean
  endedEarly?: boolean
  endReason?: string
  lastMessage: string
  messages: Message[] // Full message history
  state: InterviewState // Full interview state
}

export interface ConversationSummary {
  id: string
  candidateName?: string
  createdAt: string
  completed: boolean
  endedEarly?: boolean
  lastMessage: string
}

class LocalStorageService {
  private readonly CONVERSATIONS_KEY = "interview-conversations-v2" // Updated key to avoid conflicts

  private getStoredConversations(): Conversation[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.CONVERSATIONS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  private setStoredConversations(conversations: Conversation[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.CONVERSATIONS_KEY, JSON.stringify(conversations))
  }

  async createConversation(id: string, initialState: InterviewState, initialMessage: Message): Promise<Conversation> {
    const newConversation: Conversation = {
      id,
      candidateName: initialState.candidateName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: initialState.completed,
      endedEarly: initialState.endedEarly,
      endReason: initialState.endReason,
      lastMessage: initialMessage.content
        .replace(/\[STATE:.*?\]/s, "")
        .trim()
        .substring(0, 100),
      messages: [initialMessage],
      state: initialState,
    }
    const conversations = this.getStoredConversations()
    conversations.unshift(newConversation) // Add to the beginning
    this.setStoredConversations(conversations)
    return newConversation
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const conversations = this.getStoredConversations()
    return conversations.find((conv) => conv.id === id) || null
  }

  async updateConversation(id: string, newState: InterviewState, newMessage?: Message): Promise<Conversation | null> {
    const conversations = this.getStoredConversations()
    const index = conversations.findIndex((conv) => conv.id === id)

    if (index === -1) return null

    const conversation = { ...conversations[index] }
    conversation.state = newState
    conversation.updatedAt = new Date().toISOString()

    if (newMessage) {
      conversation.messages.push(newMessage)
      conversation.lastMessage = newMessage.content
        .replace(/\[STATE:.*?\]/s, "")
        .trim()
        .substring(0, 100)
    }

    // Reorder to bring the updated conversation to the top
    conversations.splice(index, 1) // Remove old entry
    conversations.unshift(conversation) // Add updated to beginning

    this.setStoredConversations(conversations)
    return conversation
  }

  async getAllConversations(): Promise<ConversationSummary[]> {
    const conversations = this.getStoredConversations()
    // Sort by updatedAt descending
    const sortedConversations = [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    return sortedConversations.map((conv) => ({
      id: conv.id,
      candidateName: conv.candidateName,
      createdAt: conv.createdAt,
      completed: conv.completed,
      endedEarly: conv.endedEarly || false,
      lastMessage: conv.lastMessage,
    }))
  }

  async clearAllConversations(): Promise<void> {
    this.setStoredConversations([])
  }
}

export const localStorageService = new LocalStorageService()
