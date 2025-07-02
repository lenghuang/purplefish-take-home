import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";

import { SqlDatabase } from "langchain/sql_db";
import { SqlToolkit } from "langchain/agents/toolkits/sql";

import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";

/* -------------------------------------------------
   1.  Create / open a SQLite database on disk
--------------------------------------------------*/
const dataSource = new DataSource({
  type: "sqlite",
  database: "./data/demo.db",
});
await dataSource.initialize();

/* -------------------------------------------------
   2.  Seed a tiny Candidates table (first run only)
--------------------------------------------------*/
await dataSource.query(`
  CREATE TABLE IF NOT EXISTS Candidates (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    position         TEXT NOT NULL,
    years_experience INTEGER,
    desired_salary   INTEGER
  );
`);

const [{ n }] = await dataSource.query(`SELECT COUNT(*) AS n FROM Candidates`);
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
const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: dataSource,
});
const llm = new ChatOpenAI({ modelName: "gpt-4.1-nano", temperature: 0 });
const toolkit = new SqlToolkit(db, llm); // gives us 4 SQL tools
const tools = toolkit.getTools();

/* -------------------------------------------------
   4‑A.  Quick direct tool call (no LLM)
--------------------------------------------------*/
const rows = JSON.parse(
  await db.run(
    "SELECT name, desired_salary FROM Candidates WHERE years_experience > 4"
  )
);
console.log("➡️  Direct SQL result:", rows); // [{ name: 'Bob', desired_salary: 130000 }]

/* -------------------------------------------------
   4‑B.  Build a LangGraph React agent (function calling)
         – adds a system message & memory
--------------------------------------------------*/
const agent = createReactAgent({
  llm,
  tools,
  messageModifier:
    "You are an internal HR data bot. Use ONLY the provided SQL tools. Never modify data.",
  checkpointSaver: new MemorySaver(), // chat memory
});

/* A helper to invoke with the same thread_id each time */
const threadCfg = { configurable: { thread_id: "demo-thread" } };

async function ask(question: string) {
  const out = await agent.invoke(
    { messages: [{ role: "user", content: question }] },
    threadCfg
  );
  // Last message is the agent’s answer
  return out.messages[out.messages.length - 1].content;
}

/* -------------------------------------------------
   5.  One‑shot question
--------------------------------------------------*/
console.log("\n🧠 Agent answer:", await ask("Who wants more than $110k?"));

/* -------------------------------------------------
   6.  Follow‑up in SAME thread (memory demo)
--------------------------------------------------*/
console.log(
  "\n🧠 Follow‑up answer:",
  await ask("And what role is that candidate applying for?")
);

/* -------------------------------------------------
   Done
--------------------------------------------------*/
console.log("\n✅  Finished – inspect ./data/demo.db to view or edit data.\n");
