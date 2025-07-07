import { db } from "./index"
import { conversations, messages, users, assessments } from "./schema"
import { eq, desc, and } from "drizzle-orm"
import type { Message } from "ai"

export async function ensureDemoUser() {
  const demoUserId = "demo-user-123"

  try {
    // Check if demo user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, demoUserId),
    })

    if (!existingUser) {
      // Create demo user
      await db.insert(users).values({
        id: demoUserId,
        email: "demo@example.com",
        name: "Demo User",
        role: "hunter",
        createdAt: new Date().toISOString(),
      })
      console.log("Demo user created")
    }

    return demoUserId
  } catch (error) {
    console.error("Error ensuring demo user:", error)
    return demoUserId // Return ID anyway for fallback
  }
}

export async function createUser(userData: {
  id: string
  email?: string
  name?: string
  role: "hunter" | "poster"
}) {
  try {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        createdAt: new Date().toISOString(),
      })
      .returning()
    return user
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function createConversation(data: {
  userId: string
  jobRole: string
  agentType: string
}) {
  try {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const [conversation] = await db
      .insert(conversations)
      .values({
        id: conversationId,
        userId: data.userId,
        jobRole: data.jobRole,
        agentType: data.agentType,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning()

    return conversation
  } catch (error) {
    console.error("Error creating conversation:", error)
    throw error
  }
}

export async function getConversationWithMessages(conversationId: string) {
  try {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        messages: {
          orderBy: [messages.createdAt],
        },
      },
    })

    if (!conversation) return null

    // Convert messages to AI SDK format
    const aiMessages: Message[] = conversation.messages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      createdAt: new Date(msg.createdAt),
    }))

    return {
      ...conversation,
      messages: aiMessages,
    }
  } catch (error) {
    console.error("Error getting conversation with messages:", error)
    return null
  }
}

export async function getUserConversations(userId: string, role: "hunter" | "poster") {
  try {
    const whereClause =
      role === "hunter"
        ? eq(conversations.userId, userId)
        : and(eq(conversations.userId, userId), eq(conversations.status, "completed"))

    return await db.query.conversations.findMany({
      where: whereClause,
      orderBy: [desc(conversations.updatedAt)],
      with: {
        messages: {
          orderBy: [desc(messages.createdAt)],
          limit: 1, // Get last message for preview
        },
      },
    })
  } catch (error) {
    console.error("Error getting user conversations:", error)
    return []
  }
}

export async function saveMessage(data: {
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: any
}) {
  try {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const [message] = await db
      .insert(messages)
      .values({
        id: messageId,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: new Date().toISOString(),
      })
      .returning()

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, data.conversationId))

    return message
  } catch (error) {
    console.error("Error saving message:", error)
    throw error
  }
}

export async function updateConversationStatus(
  conversationId: string,
  status: "active" | "completed" | "paused",
  stage?: string,
) {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    }

    if (status === "completed") {
      updateData.completedAt = new Date().toISOString()
    }

    if (stage) {
      updateData.interviewStage = stage
    }

    await db.update(conversations).set(updateData).where(eq(conversations.id, conversationId))
  } catch (error) {
    console.error("Error updating conversation status:", error)
    throw error
  }
}

export async function deleteConversation(conversationId: string) {
  try {
    // Messages will be deleted automatically due to cascade
    await db.delete(conversations).where(eq(conversations.id, conversationId))
  } catch (error) {
    console.error("Error deleting conversation:", error)
    throw error
  }
}

export async function saveAssessment(data: {
  conversationId: string
  category: string
  score: number
  feedback?: string
}) {
  try {
    const assessmentId = `assess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return await db
      .insert(assessments)
      .values({
        id: assessmentId,
        conversationId: data.conversationId,
        category: data.category,
        score: data.score,
        feedback: data.feedback,
        createdAt: new Date().toISOString(),
      })
      .returning()
  } catch (error) {
    console.error("Error saving assessment:", error)
    throw error
  }
}

export async function getConversationAssessments(conversationId: string) {
  try {
    return await db.query.assessments.findMany({
      where: eq(assessments.conversationId, conversationId),
      orderBy: [assessments.createdAt],
    })
  } catch (error) {
    console.error("Error getting conversation assessments:", error)
    return []
  }
}
