import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // TODO: Integrate with your actual backend agentic workflows here.
  // The 'messages' array contains the conversation history.
  // You would typically send this to your backend, which then interacts
  // with your AI agent and persistent databases.
  // The response from your backend should be streamed back.

  try {
    // Using streamText from AI SDK for robust integration with useChat
    const result = streamText({
      model: openai("gpt-4.1-nano"), // Using gpt-4o as a powerful model for demonstration
      messages,
      // TODO: Add tools or other AI SDK features as needed for your agentic workflows
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error generating text with OpenAI API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate text with AI." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
