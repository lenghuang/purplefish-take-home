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
    return NextResponse.json(conversation);
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
    // Try to get the conversation first
    const existing = await drizzleService.getConversation(id);
    let result;
    if (existing) {
      result = await drizzleService.updateConversation(id, state, message);
    } else {
      result = await drizzleService.createConversation(id, state, message);
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
