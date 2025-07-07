import { runTurn } from "agent-core";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { threadId, userId, message } = await req.json();

    // Create a ReadableStream from the async generator
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of runTurn({ threadId, userId, message })) {
            controller.enqueue(new TextEncoder().encode(token));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate text with agent-core." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
