import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { drizzleService } from '@/db/services/drizzle-service';
import type { InterviewState, Message } from '@/lib/services/local-storage-service';

// POST /api/conversations
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
