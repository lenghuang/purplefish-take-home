import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Example tool
const getWeather = tool(
  async ({ city }: { city: string }) => `It's always sunny in ${city}!`,
  {
    name: "getWeather",
    description: "Return a (fake) weather report",
    schema: z.object({ city: z.string() }),
  }
);

// OpenAI instead of Anthropic
const llm = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0 });

const agent = createReactAgent({
  llm,
  tools: [getWeather],
  prompt: "You are a helpful assistant.",
  checkpointer: new MemorySaver(), // enables multi‑turn memory
});

// Run the agent
await agent.invoke(
  {
    messages: [{ role: "user", content: "what is the weather in SF?" }],
  },
  { configurable: { thread_id: "demo‑1" } }
);
