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
