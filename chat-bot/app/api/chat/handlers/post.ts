import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { extractStructuredData, getSystemPrompt } from '../chat-service';

// POST handler for /api/chat
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, interviewState } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return new Response('No message provided', { status: 400 });
    }

    // Extract structured data from user input
    const stateUpdates = extractStructuredData(
      lastMessage.content,
      interviewState || { stage: 'greeting', completed: false },
    );
    const newState = { ...interviewState, ...stateUpdates };

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found');
      return getFallbackResponse(newState);
    }

    try {
      const result = streamText({
        model: openai('gpt-4o'),
        system: getSystemPrompt(newState),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content.replace(/\[STATE:[\s\S]*?\]/, '').trim(),
        })),
        onError: (error) => {
          console.error('StreamText internal error:', error);
        },
      });

      // Workaround: Manually pipe the text stream and append state
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let fullText = '';
            for await (const chunk of result.textStream) {
              fullText += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
            // Append state as a special string at the end
            const stateString = `[STATE:${JSON.stringify(newState)}]`;
            controller.enqueue(encoder.encode(stateString));
            controller.close();
          } catch (streamError) {
            console.error('Error during stream piping:', streamError);
            controller.error(streamError);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return getFallbackResponse(newState);
    }
  } catch (error) {
    console.error('Chat API error:', error);
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
