import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { getConversationWithMessages, saveMessage, ensureDemoUser } from "@/lib/db/queries"

export const maxDuration = 60

interface ChatRequest {
  conversationId: string
  message: string
  userId: string
  jobRole: string
  userProfile?: {
    experience: string
    skills: string[]
    preferences: Record<string, any>
  }
}

export async function POST(req: Request) {
  try {
    const { conversationId, message, jobRole }: ChatRequest = await req.json()

    // Ensure demo user exists
    const userId = await ensureDemoUser()

    // Get conversation with full message history
    const conversation = await getConversationWithMessages(conversationId)
    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Save user message to database
    await saveMessage({
      conversationId,
      role: "user",
      content: message,
    })

    // Create job-role specific system prompt
    const systemPrompt = createJobRoleSystemPrompt(jobRole, conversation.interviewStage)

    // Prepare messages for AI
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversation.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ]

    // Stream response using AI SDK with OpenAI
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      temperature: 0.7,
      maxTokens: 1000,
      onFinish: async (result) => {
        // Save AI response to database
        await saveMessage({
          conversationId,
          role: "assistant",
          content: result.text,
          metadata: {
            finishReason: result.finishReason,
            usage: result.usage,
          },
        })
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function createJobRoleSystemPrompt(jobRole: string, stage = "introduction"): string {
  const basePrompt = `You are an expert AI recruiter conducting a professional interview. Be conversational, insightful, and thorough.`

  const rolePrompts = {
    "software-engineer": `${basePrompt}
    
You're interviewing for a Software Engineer position. Focus on:
- Technical problem-solving skills
- Programming experience and languages
- System design thinking
- Code quality and best practices
- Team collaboration experience

Current interview stage: ${stage}

Ask follow-up questions based on their responses. Keep the conversation natural and engaging.`,

    "product-manager": `${basePrompt}
    
You're interviewing for a Product Manager position. Focus on:
- Product strategy and vision
- Stakeholder management
- Data-driven decision making
- User experience understanding
- Cross-functional leadership

Current interview stage: ${stage}

Probe deeper into their product thinking and leadership experience.`,

    "data-scientist": `${basePrompt}
    
You're interviewing for a Data Scientist position. Focus on:
- Statistical analysis and modeling
- Machine learning experience
- Data visualization and communication
- Business problem-solving with data
- Technical tools and programming

Current interview stage: ${stage}

Ask about specific projects and methodologies they've used.`,

    "ux-designer": `${basePrompt}
    
You're interviewing for a UX Designer position. Focus on:
- Design process and methodology
- User research and testing
- Prototyping and wireframing
- Collaboration with developers
- Portfolio and case studies

Current interview stage: ${stage}

Ask them to walk through their design process and specific examples.`,
  }

  return rolePrompts[jobRole as keyof typeof rolePrompts] || rolePrompts["software-engineer"]
}
