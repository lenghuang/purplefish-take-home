import { NextResponse } from 'next/server';
import { drizzleService } from '@/db/services/drizzle-service';

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
