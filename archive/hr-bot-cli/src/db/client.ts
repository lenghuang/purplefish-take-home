import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Path to SQLite database file
const sqlitePath = process.env.DB_PATH || "./hr-bot.db";

// Create the better-sqlite3 database connection
export const sqlite = new Database(sqlitePath);

// Create the Drizzle ORM client
export const db = drizzle(sqlite, { schema });

export default db;
