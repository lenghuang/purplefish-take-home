import { NextResponse } from 'next/server';
import { getConversation, upsertConversation } from './conversation-id-service';

// GET /api/conversations/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const conversation = await getConversation(id);
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
export async function POST(
  req: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const { state, message } = await req.json();
    await upsertConversation(id, state, message);
    return NextResponse.json({ success: true });
  } catch (error) {
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
