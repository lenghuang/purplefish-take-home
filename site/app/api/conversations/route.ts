import { createConversation, getUserConversations, ensureDemoUser } from "@/lib/db/queries"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { jobRole } = await req.json()

    // Ensure demo user exists
    const userId = await ensureDemoUser()

    // Determine agent type based on job role
    const agentType = getAgentTypeForRole(jobRole)

    const conversation = await createConversation({
      userId,
      jobRole,
      agentType,
    })

    return Response.json(conversation)
  } catch (error) {
    console.error("Create conversation error:", error)
    return new Response(JSON.stringify({ error: "Failed to create conversation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const role = searchParams.get("role") as "hunter" | "poster"

    if (!role) {
      return new Response(JSON.stringify({ error: "Missing role parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Ensure demo user exists and get their conversations
    const userId = await ensureDemoUser()
    const conversations = await getUserConversations(userId, role)

    return Response.json(conversations)
  } catch (error) {
    console.error("Get conversations error:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch conversations" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function getAgentTypeForRole(jobRole: string): string {
  const agentMap = {
    "software-engineer": "technical_interviewer",
    "product-manager": "product_interviewer",
    "data-scientist": "data_interviewer",
    "ux-designer": "design_interviewer",
  }
  return agentMap[jobRole as keyof typeof agentMap] || "general_interviewer"
}
