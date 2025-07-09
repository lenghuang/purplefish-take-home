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
