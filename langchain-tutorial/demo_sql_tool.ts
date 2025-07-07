import "dotenv/config";
// This import is often used with TypeORM for decorators, ensuring metadata
// is correctly emitted for classes and properties.
import "reflect-metadata";
// DataSource is a core TypeORM class used to establish and manage connections
// to a database. It's essential for interacting with the database.
import { DataSource } from "typeorm";

// SqlDatabase is a Langchain utility that wraps a SQL database connection
// (like the one provided by TypeORM's DataSource) and provides methods
// to interact with it in a way that's compatible with Langchain's tools.
import { SqlDatabase } from "langchain/sql_db";
// SqlToolkit provides a set of pre-built tools specifically designed for
// interacting with SQL databases. These tools allow a Langchain agent
// to perform operations like listing tables, describing schemas, and
// executing SQL queries.
import { SqlToolkit } from "langchain/agents/toolkits/sql";

// ChatOpenAI is a Langchain integration for OpenAI's chat models (e.g., GPT-4).
// It allows the application to use OpenAI's powerful language models for
// generating responses and understanding natural language queries.
import { ChatOpenAI } from "@langchain/openai";
// createReactAgent is a function from LangGraph (a library built on Langchain)
// that helps in constructing agents capable of reasoning and acting.
// It uses the "ReAct" (Reasoning and Acting) pattern, where the agent
// iteratively reasons about what to do and then performs an action.
import { createReactAgent } from "@langchain/langgraph/prebuilt";
// MemorySaver is a component from LangGraph that enables agents to maintain
// conversational memory. This means the agent can remember previous turns
// in a conversation, allowing for more coherent and context-aware interactions.
import { MemorySaver } from "@langchain/langgraph";

/* -------------------------------------------------
   1.  Create / open a SQLite database on disk
--------------------------------------------------*/
// Initialize a new DataSource for a SQLite database.
// The 'database' property specifies the path to the SQLite file.
const dataSource = new DataSource({
  type: "sqlite",
  database: "./data/demo.db",
});
// Establish the database connection. This must be called before
// any database operations can be performed.
await dataSource.initialize();

/* -------------------------------------------------
   2.  Seed a tiny Candidates table (first run only)
--------------------------------------------------*/
// Execute a SQL query to create the 'Candidates' table if it doesn't already exist.
// This ensures the database has the necessary schema for the application.
await dataSource.query(`
  CREATE TABLE IF NOT EXISTS Candidates (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    position         TEXT NOT NULL,
    years_experience INTEGER,
    desired_salary   INTEGER
  );
`);

// Check if the 'Candidates' table is empty.
const [{ n }] = await dataSource.query(`SELECT COUNT(*) AS n FROM Candidates`);
// If the table is empty, insert some sample data.
if (n === 0) {
  await dataSource.query(`
    INSERT INTO Candidates (name,  position,          years_experience, desired_salary)
    VALUES
      ('Alice',  'Frontend Engineer', 4,               115000),
      ('Bob',    'Backend Engineer',  6,               130000),
      ('Carmen', 'DevOps Engineer',   3,               105000);
  `);
  console.log("✨  Seeded Candidates table");
}

/* -------------------------------------------------
   3.  Wrap the DB in LangChain helpers
--------------------------------------------------*/
// Create a SqlDatabase instance from the TypeORM DataSource.
// This makes the database accessible to Langchain's SQL tools.
const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: dataSource,
});
// Initialize the OpenAI chat model.
// 'modelName' specifies the GPT model to use (e.g., "gpt-4.1-nano").
// 'temperature' controls the randomness of the model's output (0 means deterministic).
const llm = new ChatOpenAI({ modelName: "gpt-4.1-nano", temperature: 0 });
// Create a SqlToolkit instance, providing it with the SqlDatabase and the LLM.
// The toolkit automatically generates a set of SQL-related tools that the LLM
// can use to interact with the database.
const toolkit = new SqlToolkit(db, llm); // gives us 4 SQL tools
// Get the actual tools from the toolkit. These are the functions/capabilities
// that the agent can call to perform database operations.
const tools = toolkit.getTools();

/* -------------------------------------------------
   4‑A.  Quick direct tool call (no LLM)
--------------------------------------------------*/
// Directly run a SQL query using the SqlDatabase instance.
// This demonstrates how to interact with the database without involving the LLM agent.
const rows = JSON.parse(
  await db.run(
    "SELECT name, desired_salary FROM Candidates WHERE years_experience > 4",
  ),
);
console.log("➡️  Direct SQL result:", rows); // [{ name: 'Bob', desired_salary: 130000 }]

/* -------------------------------------------------
   4‑B.  Build a LangGraph React agent (function calling)
         – adds a system message & memory
--------------------------------------------------*/
// Create a LangGraph agent using the createReactAgent function.
// This agent will use the provided LLM and tools to reason and act.
const agent = createReactAgent({
  llm, // The language model to use for reasoning.
  tools, // The tools (SQL operations) the agent can use.
  // A system message that provides context and instructions to the LLM.
  // This guides the agent's behavior, e.g., acting as an HR data bot.
  messageModifier:
    "You are an internal HR data bot. Use ONLY the provided SQL tools. Never modify data.",
  // Integrates memory into the agent, allowing it to remember past interactions.
  // This is crucial for multi-turn conversations.
  checkpointSaver: new MemorySaver(), // chat memory
});

/* A helper to invoke with the same thread_id each time */
// Configuration for the agent's invocation, specifically setting a thread_id.
// This ensures that subsequent calls to the agent are part of the same
// conversational thread, allowing the memory to persist.
const threadCfg = { configurable: { thread_id: "demo-thread" } };

// Asynchronous function to ask the agent a question.
async function ask(question: string) {
  // Invoke the agent with a user message.
  // The agent will process the question, use its tools if necessary,
  // and generate a response.
  const out = await agent.invoke(
    { messages: [{ role: "user", content: question }] },
    threadCfg,
  );
  // Extract and return the content of the agent's last message, which is its answer.
  return out.messages[out.messages.length - 1].content;
}

/* -------------------------------------------------
   5.  One‑shot question
--------------------------------------------------*/
// Ask a single question to the agent and log its answer.
// The agent will use its SQL tools to query the database based on the question.
console.log("\n🧠 Agent answer:", await ask("Who wants more than $110k?"));

/* -------------------------------------------------
   6.  Follow‑up in SAME thread (memory demo)
--------------------------------------------------*/
// Ask a follow-up question within the same conversational thread.
// Due to the MemorySaver, the agent remembers the previous question and context,
// allowing it to answer "And what role is that candidate applying for?"
// without needing to re-state "Bob".
console.log(
  "\n🧠 Follow‑up answer:",
  await ask("And what role is that candidate applying for?"),
);

/* -------------------------------------------------
   Done
--------------------------------------------------*/
console.log("\n✅  Finished – inspect ./data/demo.db to view or edit data.\n");
