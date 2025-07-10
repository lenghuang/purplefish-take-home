import { NextResponse } from 'next/server';
import { drizzleService } from '@/db/services/drizzle-service';

// GET /api/conversations/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const conversation = await drizzleService.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    // Log the number of messages retrieved for this conversation
    console.info(
      '[api/conversations/[id]] GET: Number of messages for conversation',
      id,
      Array.isArray(conversation.messages) ? conversation.messages.length : 0,
    );
    // Ensure robust response shape for frontend
    const safeConversation = {
      ...conversation,
      messages: Array.isArray(conversation.messages) ? conversation.messages : [],
      state:
        conversation.state && typeof conversation.state === 'object'
          ? conversation.state
          : { stage: 'greeting', completed: false },
    };
    return NextResponse.json(safeConversation);
  } catch (error) {
    console.error('Failed to get conversation:', error instanceof Error ? error.stack : error);
    return NextResponse.json({ error: 'Failed to get conversation' }, { status: 500 });
  }
}

// POST /api/conversations/[id]
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const { state, message } = await req.json();
    // Atomically create or update the conversation to avoid race conditions
    const result = await drizzleService.upsertConversation(id, state, message);
    if (!result) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    // Enhanced error logging for debugging
    if (error instanceof Error) {
      console.error('Failed to create or update conversation:', error.message, error.stack);
      return NextResponse.json(
        { error: 'Failed to create or update conversation', details: error.message },
        { status: 500 },
      );
    } else {
      console.error('Failed to create or update conversation:', error);
      return NextResponse.json(
        { error: 'Failed to create or update conversation', details: String(error) },
        { status: 500 },
      );
    }
  }
}
