import { config } from "dotenv";
import * as readline from "readline";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

config();

// Initialize SQLite database
async function initializeDatabase() {
  const db = await open({
    filename: "./hr_bot.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            question TEXT,
            answer TEXT,
            pay_range TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
  return db;
}

// Function to save conversation data
async function saveConversation(
  db: any,
  userId: string,
  question: string,
  answer: string,
  payRange: string | null
) {
  await db.run(
    `INSERT INTO conversations (user_id, question, answer, pay_range) VALUES (?, ?, ?, ?)`,
    [userId, question, answer, payRange]
  );
  console.log("Conversation saved to database.");
}

async function main() {
  const db = await initializeDatabase();
  console.log('HR Chatbot started. Type "exit" to quit.');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let userId = "user123"; // Placeholder for a unique user ID
  let conversationState: any = {}; // To store temporary conversation data

  // Initialize LangChain OpenAI model
  // IMPORTANT: Replace "YOUR_OPENAI_API_KEY" with your actual OpenAI API key
  // For production, consider using environment variables (e.g., process.env.OPENAI_API_KEY)
  const model = new ChatOpenAI({
    modelName: "gpt-4.1-nano",
    temperature: 0.7, // Adjust for creativity (0.0-1.0)
  });

  rl.on("line", async (input) => {
    if (input.toLowerCase() === "exit") {
      rl.close();
      db.close();
      return;
    }

    let botResponse = "";
    let payRangeToSave: string | null = null;

    try {
      if (!conversationState.askedPayRange) {
        // Use LLM for a human-sounding greeting and to ask for pay range
        const prompt = `The user has just started a conversation with an HR chatbot. Greet them warmly and politely ask for their desired pay range. Make it sound natural and human.`;
        const llmResponse = await model.invoke([new HumanMessage(prompt)]);
        botResponse = llmResponse.content as string;
        conversationState.askedPayRange = true;
      } else {
        payRangeToSave = input;
        // Use LLM to acknowledge the pay range and ask for further assistance
        const prompt = `The user has just provided their desired pay range: "${input}". Acknowledge this in a friendly and human-sounding way, and then ask if there's anything else you can help them with regarding HR matters.`;
        const llmResponse = await model.invoke([new HumanMessage(prompt)]);
        botResponse = llmResponse.content as string;
        conversationState = {}; // Reset state after getting pay range
      }
    } catch (error) {
      console.error("Error communicating with LLM:", error);
      // Fallback to simple Q&A logic if LLM fails
      if (!conversationState.askedPayRange) {
        botResponse = "Hello! What is your desired pay range?";
        conversationState.askedPayRange = true;
      } else {
        payRangeToSave = input;
        botResponse = `Thank you for providing your desired pay range: ${input}. Is there anything else I can help you with?`;
        conversationState = {}; // Reset state after getting pay range
      }
    }

    console.log(`Bot: ${botResponse}`);
    await saveConversation(db, userId, input, botResponse, payRangeToSave);
  });

  rl.on("close", () => {
    console.log("Chatbot exiting.");
  });
}

main().catch(console.error);
