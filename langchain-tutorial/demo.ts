import { config } from "dotenv";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import readline from "readline/promises";

// Load environment variables
config();

// Define tools
const tools = [
  // Weather tool
  tool(
    async ({ city }: { city: string }) => {
      console.log(" [DEBUG] getWeather tool called with city:", city);
      // In a real app, you'd call a weather API here
      const weatherData = {
        city,
        temperature: Math.floor(Math.random() * 30) + 10, // Random temp between 10-40°C
        condition: ["Sunny", "Cloudy", "Rainy", "Partly Cloudy", "Windy"][
          Math.floor(Math.random() * 5)
        ],
        humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
      };
      console.log(" [DEBUG] Generated weather data:", weatherData);
      const result = `The weather in ${city} is ${weatherData.condition.toLowerCase()} with a temperature of ${
        weatherData.temperature
      }°C and ${weatherData.humidity}% humidity.`;
      console.log(" [DEBUG] Returning weather result:", result);
      return result;
    },
    {
      name: "getWeather",
      description: "Get the current weather in a given city",
      schema: z.object({
        city: z.string().describe("The city to get the weather for"),
      }),
    }
  ),

  // Calculator tool
  tool(
    async ({ expression }: { expression: string }) => {
      console.log(
        " [DEBUG] calculate tool called with expression:",
        expression
      );
      try {
        // Safe evaluation of mathematical expressions
        console.log(" [DEBUG] Evaluating expression:", expression);
        const result = new Function(`return (${expression})`)();
        const response = `The result of ${expression} is ${result}`;
        console.log(" [DEBUG] Calculation successful. Result:", response);
        return response;
      } catch (error) {
        const errorMessage = `Error calculating expression: ${error}`;
        console.error(" [DEBUG] Calculation error:", errorMessage);
        return errorMessage;
      }
    },
    {
      name: "calculate",
      description: "Evaluate a mathematical expression",
      schema: z.object({
        expression: z
          .string()
          .describe(
            "The mathematical expression to evaluate, e.g., '2 + 2' or '10 * (5 - 3)'"
          ),
      }),
    }
  ),
];

async function main() {
  // Initialize the LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4.1-nano",
    temperature: 0,
  });

  // Create the agent
  const agent = createReactAgent({
    llm,
    tools,
    prompt:
      "You are a helpful assistant that can get weather information and perform calculations.",
  });

  // Set up readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\nWelcome to the LangChain Tool Demo!");
  console.log("Try asking things like:");
  console.log("- What's the weather in Tokyo?");
  console.log("- Calculate 15 * 24");
  console.log("\nType 'exit' to quit.\n");

  // Chat loop
  while (true) {
    try {
      const input = await rl.question("You: ");

      if (input.toLowerCase() === "exit") {
        console.log("Goodbye!");
        break;
      }

      console.log("\nAI is thinking...");

      // Run the agent with the user's input
      const result = await agent.invoke({
        messages: [{ role: "user", content: input }],
      });

      // Extract and display the AI's response
      const aiResponse = result.messages[result.messages.length - 1]?.content;
      console.log(`\nAI: ${aiResponse}\n`);
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

  rl.close();
}

// Start the application
main().catch(console.error);
