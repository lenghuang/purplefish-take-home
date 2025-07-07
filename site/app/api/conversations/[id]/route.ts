import { getConversationWithMessages, updateConversationStatus, deleteConversation } from "@/lib/db/queries"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversation = await getConversationWithMessages(params.id)

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    return Response.json(conversation)
  } catch (error) {
    console.error("Get conversation error:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch conversation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, stage } = await req.json()

    await updateConversationStatus(params.id, status, stage)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Update conversation error:", error)
    return new Response(JSON.stringify({ error: "Failed to update conversation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteConversation(params.id)
    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete conversation error:", error)
    return new Response(JSON.stringify({ error: "Failed to delete conversation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
