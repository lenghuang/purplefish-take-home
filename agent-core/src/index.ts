import { validate_salary, negotiate_salary } from "./tools";
import { db, messages } from "./db";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { Graph, END } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph/checkpoint/sqlite";

// Types
export interface RunTurnInput {
  threadId: string;
  userId: string;
  message: string;
}

// Main function: runTurn
export async function* runTurn({
  threadId,
  userId,
  message,
}: RunTurnInput): AsyncIterable<string> {
  // Persist user message
  await db.insert(messages).values({
    threadId,
    userId,
    role: "user",
    content: message,
    createdAt: Date.now(),
  });

  // Set up OpenAI LLM
  const llm = new ChatOpenAI({
    streaming: true,
    model: "gpt-3.5-turbo",
  });

  // Set up LangGraph with tools and checkpointer
  const checkpointer = SqliteSaver.fromConnString("./agent-core/db.sqlite");

  // Minimal graph: user message -> LLM -> tools -> output
  // The actual API for Graph construction may require nodes/edges setup.
  // Here is a minimal example for a single LLM node with tools:
  const graph = new Graph({
    channels: {
      input: "string",
      output: "string",
    },
    nodes: {
      llm: async (input: string) => {
        // Call the LLM with tools
        // (Assume tools are passed as functions or via context)
        return await llm.invoke(input);
      },
    },
    edges: [
      { from: "input", to: "llm" },
      { from: "llm", to: "output" },
    ],
    checkpointer,
  });

  // Run the graph and stream tokens
  for await (const token of graph.stream({
    input: message,
    threadId,
    userId,
  })) {
    yield token;
  }

  // Optionally, persist assistant response (not shown here)
}

export { validate_salary, negotiate_salary };
