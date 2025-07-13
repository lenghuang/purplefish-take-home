import { NextResponse } from 'next/server';
import { drizzleService } from '@/db/services/drizzle-service';

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
