const { drizzle } = require("drizzle-orm/better-sqlite3")
const { migrate } = require("drizzle-orm/better-sqlite3/migrator")
const Database = require("better-sqlite3")
const path = require("path")

async function setupDatabase() {
  console.log("Setting up SQLite database...")

  try {
    // Create database file in the project root
    const dbPath = path.join(process.cwd(), "sqlite.db")
    console.log(`Creating database at: ${dbPath}`)

    const sqlite = new Database(dbPath)

    // Enable WAL mode for better performance
    sqlite.pragma("journal_mode = WAL")
    console.log("WAL mode enabled")

    const db = drizzle(sqlite)

    // Check if migrations folder exists
    const migrationsPath = path.join(process.cwd(), "drizzle")
    console.log(`Looking for migrations in: ${migrationsPath}`)

    // Run migrations
    console.log("Running migrations...")
    await migrate(db, { migrationsFolder: "./drizzle" })

    console.log("✅ Database setup complete!")
    console.log(`📁 Database file created at: ${dbPath}`)

    sqlite.close()
  } catch (error) {
    console.error("❌ Database setup failed:", error)

    // If migrations folder doesn't exist, create basic tables manually
    if (error.message.includes("ENOENT") || error.message.includes("no such file")) {
      console.log("No migrations found, creating tables manually...")
      await createTablesManually()
    } else {
      process.exit(1)
    }
  }
}

async function createTablesManually() {
  try {
    const dbPath = path.join(process.cwd(), "sqlite.db")
    const sqlite = new Database(dbPath)

    // Create tables manually
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        role TEXT NOT NULL CHECK (role IN ('hunter', 'poster')),
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        job_role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
        agent_type TEXT NOT NULL,
        interview_stage TEXT DEFAULT 'introduction',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        experience TEXT,
        skills TEXT,
        education TEXT,
        resume_data TEXT,
        preferences TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id),
        category TEXT NOT NULL,
        score REAL NOT NULL,
        feedback TEXT,
        created_at TEXT NOT NULL
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
    `)

    console.log("✅ Tables created manually!")
    sqlite.close()
  } catch (error) {
    console.error("❌ Manual table creation failed:", error)
    process.exit(1)
  }
}

setupDatabase()
