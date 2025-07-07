import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "./schema"
import path from "path"

// Create database file in the project root
const dbPath = path.join(process.cwd(), "sqlite.db")

let sqlite: Database.Database
let db: ReturnType<typeof drizzle>

try {
  // Initialize SQLite database
  sqlite = new Database(dbPath)

  // Enable WAL mode for better performance
  sqlite.pragma("journal_mode = WAL")

  // Initialize Drizzle with the SQLite database
  db = drizzle(sqlite, { schema })

  console.log("✅ Database connected successfully")
} catch (error) {
  console.error("❌ Database connection failed:", error)

  // Create a fallback in-memory database for development
  console.log("🔄 Creating fallback in-memory database...")
  sqlite = new Database(":memory:")
  db = drizzle(sqlite, { schema })
}

export { db, sqlite }
export * from "./schema"
