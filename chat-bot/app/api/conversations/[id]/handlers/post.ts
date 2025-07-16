import { NextResponse } from 'next/server';
import { drizzleService } from '@/db/services/drizzle-service';

// POST /api/conversations/[id]
export async function POST() {
  // This endpoint is deprecated: old state management logic has been removed.
  return NextResponse.json(
    {
      error:
        'This endpoint is deprecated. Conversation update via old state model is no longer supported.',
    },
    { status: 410 },
  );
}
