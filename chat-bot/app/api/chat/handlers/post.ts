import { NextRequest } from 'next/server';
import { processConversationMessage } from '../../conversations/conversation-service';

// POST handler for /api/chat
export async function POST(req: NextRequest) {
  try {
    const { conversationId, userMessage } = await req.json();

    if (!conversationId || !userMessage) {
      return new Response('conversationId and userMessage are required.', {
        status: 400,
      });
    }

    // Delegate all logic to conversation-service
    const responseText = await processConversationMessage(conversationId, userMessage);

    return new Response(responseText, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Chat API error (refactored):', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

// Fallback response for when OpenAI API is not available
import { getFallbackResponse } from '../chat-service';
