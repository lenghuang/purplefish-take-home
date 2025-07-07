// Enhanced data layer for backend integration
export interface ConversationMetadata {
  id: string
  userId: string
  jobRole: string
  status: "active" | "completed" | "paused"
  agentType: string
  createdAt: string
  updatedAt: string
  metadata: {
    userProfile?: UserProfile
    interviewStage?: string
    assessmentScores?: Record<string, number>
    nextSteps?: string[]
  }
}

export interface UserProfile {
  experience: string
  skills: string[]
  education: string
  preferences: Record<string, any>
  resumeData?: any
}

// Backend API integration functions
export async function createConversationWithBackend(
  jobRole: string,
  userProfile: UserProfile,
): Promise<ConversationMetadata> {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobRole, userProfile }),
  })
  return response.json()
}

export async function updateConversationMetadata(
  conversationId: string,
  metadata: Partial<ConversationMetadata>,
): Promise<void> {
  await fetch(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  })
}

export async function getConversationAnalytics(conversationId: string): Promise<{
  duration: number
  messageCount: number
  assessmentScores: Record<string, number>
  recommendations: string[]
}> {
  const response = await fetch(`/api/conversations/${conversationId}/analytics`)
  return response.json()
}
