import * as readline from "readline";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

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

  rl.on("line", async (input) => {
    if (input.toLowerCase() === "exit") {
      rl.close();
      db.close();
      return;
    }

    let botResponse = "";
    let payRangeToSave: string | null = null;

    // Simple Q&A logic
    if (!conversationState.askedPayRange) {
      botResponse = "Hello! What is your desired pay range?";
      conversationState.askedPayRange = true;
    } else {
      payRangeToSave = input;
      botResponse = `Thank you for providing your desired pay range: ${input}. Is there anything else I can help you with?`;
      conversationState = {}; // Reset state after getting pay range
    }

    console.log(`Bot: ${botResponse}`);
    await saveConversation(db, userId, input, botResponse, payRangeToSave);
  });

  rl.on("close", () => {
    console.log("Chatbot exiting.");
  });
}

main().catch(console.error);
