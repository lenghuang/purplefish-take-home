// Import required libraries
// dotenv: Loads environment variables from a .env file
import { config } from "dotenv";

// LangChain imports for creating AI agents and tools
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";

// Zod for schema validation
import { z } from "zod";

// Node's readline for handling command line input
import readline from "readline/promises";

// Load environment variables from .env file into process.env
// This is where you'd store your OpenAI API key
config();

/**
 * Define the tools that our AI agent can use
 * Each tool is a function that the AI can call to perform specific tasks
 */
const tools = [
  // Weather tool - provides weather information for a given city
  tool(
    // The actual function that gets called when the tool is used
    async ({ city }: { city: string }) => {
      console.log(" [DEBUG] getWeather tool called with city:", city);

      // In a real application, this would call a weather API
      // For demo purposes, we're generating random weather data
      const weatherData = {
        city,
        temperature: Math.floor(Math.random() * 30) + 10, // Random temp between 10-40°C
        condition: ["Sunny", "Cloudy", "Rainy", "Partly Cloudy", "Windy"][
          Math.floor(Math.random() * 5)
        ],
        humidity: Math.floor(Math.random() * 50) + 30, // 30-80% humidity
      };

      console.log(" [DEBUG] Generated weather data:", weatherData);

      // Format the weather information into a user-friendly string
      const result = `The weather in ${city} is ${weatherData.condition.toLowerCase()} with a temperature of ${
        weatherData.temperature
      }°C and ${weatherData.humidity}% humidity.`;

      console.log(" [DEBUG] Returning weather result:", result);
      return result;
    },
    {
      // Metadata about the tool that helps the AI understand when and how to use it
      name: "getWeather",
      description: "Get the current weather in a given city",
      // Define the expected input schema using Zod
      schema: z.object({
        city: z.string().describe("The city to get the weather for"),
      }),
    }
  ),

  // Calculator tool - performs mathematical calculations
  tool(
    // Function that evaluates mathematical expressions
    async ({ expression }: { expression: string }) => {
      console.log(
        " [DEBUG] calculate tool called with expression:",
        expression
      );

      try {
        // Safely evaluate the mathematical expression
        // Note: Using new Function() is generally not recommended for user input in production
        // as it can execute arbitrary code. This is just for demonstration.
        console.log(" [DEBUG] Evaluating expression:", expression);
        const result = new Function(`return (${expression})`)();

        // Format the result
        const response = `The result of ${expression} is ${result}`;
        console.log(" [DEBUG] Calculation successful. Result:", response);
        return response;
      } catch (error) {
        // Handle any errors during calculation
        const errorMessage = `Error calculating expression: ${error}`;
        console.error(" [DEBUG] Calculation error:", errorMessage);
        return errorMessage;
      }
    },
    {
      // Tool metadata
      name: "calculate",
      description: "Evaluate a mathematical expression",
      // Define the expected input schema
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

/**
 * Main function that sets up and runs the chat interface
 */
async function main() {
  // Initialize the language model (LLM)
  // We're using OpenAI's GPT-4 model with temperature set to 0 for deterministic responses
  const llm = new ChatOpenAI({
    modelName: "gpt-4.1-nano",
    temperature: 0, // 0 = more deterministic, 1 = more creative
  });

  // Create the agent with our defined tools
  const agent = createReactAgent({
    llm, // The language model to use
    tools, // The tools the agent can use
    // System prompt that guides the AI's behavior
    prompt:
      "You are a helpful assistant that can get weather information and perform calculations.",
  });

  // Set up readline interface for command line interaction
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Display welcome message and instructions
  console.log("\nWelcome to the LangChain Tool Demo!");
  console.log("Try asking things like:");
  console.log("- What's the weather in Tokyo?");
  console.log("- Calculate 15 * 24");
  console.log("\nType 'exit' to quit.\n");

  // Main chat loop
  while (true) {
    try {
      // Get user input
      const input = await rl.question("You: ");

      // Check if user wants to exit
      if (input.toLowerCase() === "exit") {
        console.log("Goodbye!");
        break;
      }

      console.log("\nAI is thinking...");

      // Process the input using our agent
      const result = await agent.invoke({
        // Format the input as a user message
        messages: [{ role: "user", content: input }],
      });

      // Extract and display the AI's response
      // The response is in the last message of the conversation
      const aiResponse = result.messages[result.messages.length - 1]?.content;
      console.log(`\nAI: ${aiResponse}\n`);
    } catch (error) {
      // Handle any errors that occur during processing
      console.error("An error occurred:", error);
    }
  }

  // Clean up the readline interface
  rl.close();
}

// Start the application and handle any uncaught errors
main().catch(console.error);
