import { NextResponse } from 'next/server';
import { drizzleService } from '@/db/services/drizzle-service';

// GET /api/conversations
export async function GET() {
  try {
    const conversations = await drizzleService.getAllConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 });
  }
}
// DELETE /api/conversations
export async function DELETE() {
  try {
    await drizzleService.clearAllConversations();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete conversations:', error);
    return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 });
  }
}

// POST /api/conversations
import { nanoid } from 'nanoid';
import type { InterviewState, Message } from '@/lib/services/local-storage-service';

export async function POST() {
  try {
    // Default initial interview state
    const initialState: InterviewState = {
      stage: 'intro',
      completed: false,
    };

    // Default initial message from assistant
    const initialMessage: Message = {
      id: nanoid(),
      role: 'assistant',
      content:
        "Welcome! Let's start your interview. Please introduce yourself or ask your first question.",
    };

    const conversation = await drizzleService.createConversation(initialState, initialMessage);

    if (!conversation || !conversation.id) {
      console.error(
        '[POST /api/conversations] Conversation creation returned null/undefined or missing id.',
        { conversation },
      );
      return NextResponse.json(
        { error: 'Failed to create conversation: conversation is null or missing id.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: conversation.id });
  } catch (error) {
    console.error('[POST /api/conversations] Failed to create conversation:', error);
    return NextResponse.json(
      {
        error: `Failed to create conversation: ${error}`,
      },
      { status: 500 },
    );
  }
}
