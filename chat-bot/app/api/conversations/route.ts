import { NextResponse } from 'next/server';
import {
  getAllConversations,
  createConversation,
  clearAllConversations,
} from './conversation-service';

// GET /api/conversations
export async function GET() {
  try {
    const conversations = await getAllConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 });
  }
}

// DELETE /api/conversations
// DELETE /api/conversations
export async function DELETE() {
  try {
    await clearAllConversations();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete conversations:', error);
    return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 });
  }
}

// POST /api/conversations
// POST /api/conversations
export async function POST() {
  try {
    const conversation = await createConversation();
    if (!conversation || !conversation.id) {
      return NextResponse.json(
        { error: 'Failed to create conversation: conversation is null or missing id.' },
        { status: 500 },
      );
    }
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
