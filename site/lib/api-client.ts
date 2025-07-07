"use client"

import type { Message } from "ai"

export interface Conversation {
  id: string
  userId: string
  jobRole: string
  status: "active" | "completed" | "paused"
  agentType: string
  interviewStage?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  messages?: Message[]
}

export interface JobRole {
  id: string
  name: string
  description?: string
  requiredSkills?: string[]
  interviewQuestions?: string[]
}

// Temporary user ID for demo (in production, this would come from auth)
const DEMO_USER_ID = "demo-user-123"

// Fallback data when database is unavailable
const FALLBACK_JOB_ROLES: JobRole[] = [
  { id: "software-engineer", name: "Software Engineer" },
  { id: "product-manager", name: "Product Manager" },
  { id: "data-scientist", name: "Data Scientist" },
  { id: "ux-designer", name: "UX Designer" },
]

export async function fetchConversations(userRole: "hunter" | "poster"): Promise<Conversation[]> {
  try {
    const response = await fetch(`/api/conversations?userId=${DEMO_USER_ID}&role=${userRole}`)
    if (!response.ok) {
      console.warn(`Failed to fetch conversations: ${response.status} ${response.statusText}`)
      return [] // Return empty array instead of throwing
    }
    return await response.json()
  } catch (error) {
    console.warn("Database unavailable, returning empty conversations list:", error)
    return [] // Graceful fallback - empty conversations list
  }
}

export async function fetchConversation(conversationId: string): Promise<Conversation | null> {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`)
    if (!response.ok) {
      if (response.status === 404) return null
      console.warn(`Failed to fetch conversation: ${response.status} ${response.statusText}`)
      return null
    }
    return await response.json()
  } catch (error) {
    console.warn("Database unavailable, conversation not found:", error)
    return null // Graceful fallback
  }
}

export async function createConversation(jobRole: string): Promise<Conversation | null> {
  try {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobRole, userId: DEMO_USER_ID }),
    })

    if (!response.ok) {
      console.warn(`Failed to create conversation: ${response.status} ${response.statusText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.warn("Database unavailable, cannot create conversation:", error)
    return null // Graceful fallback
  }
}

export async function updateConversationStatus(
  conversationId: string,
  status: "active" | "completed" | "paused",
  stage?: string,
): Promise<boolean> {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, stage }),
    })

    if (!response.ok) {
      console.warn(`Failed to update conversation: ${response.status} ${response.statusText}`)
      return false
    }

    return true
  } catch (error) {
    console.warn("Database unavailable, cannot update conversation:", error)
    return false // Graceful fallback
  }
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      console.warn(`Failed to delete conversation: ${response.status} ${response.statusText}`)
      return false
    }

    return true
  } catch (error) {
    console.warn("Database unavailable, cannot delete conversation:", error)
    return false // Graceful fallback
  }
}

export async function fetchJobRoles(): Promise<JobRole[]> {
  try {
    const response = await fetch("/api/job-roles")
    if (!response.ok) {
      console.warn(`Failed to fetch job roles: ${response.status} ${response.statusText}`)
      return FALLBACK_JOB_ROLES
    }
    return await response.json()
  } catch (error) {
    console.warn("Database unavailable, using fallback job roles:", error)
    return FALLBACK_JOB_ROLES // Always return fallback job roles
  }
}

// Helper function to check if the backend is available
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", { method: "HEAD" })
    return response.ok
  } catch (error) {
    return false
  }
}
