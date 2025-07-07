const Database = require("better-sqlite3")
const path = require("path")

async function seedDatabase() {
  console.log("Seeding database with sample data...")

  try {
    const dbPath = path.join(process.cwd(), "sqlite.db")

    // Check if database exists
    const sqlite = new Database(dbPath)

    // Create demo user
    const demoUserId = "demo-user-123"
    const insertUser = sqlite.prepare(`
      INSERT OR IGNORE INTO users (id, email, name, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    insertUser.run(demoUserId, "demo@example.com", "Demo User", "hunter", new Date().toISOString())

    console.log("👤 Demo user created")

    // Create sample conversation
    const conversationId = `conv-${Date.now()}`
    const insertConversation = sqlite.prepare(`
      INSERT INTO conversations (id, user_id, job_role, status, agent_type, interview_stage, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    insertConversation.run(
      conversationId,
      demoUserId,
      "Software Engineer",
      "active",
      "technical_interviewer",
      "introduction",
      new Date().toISOString(),
      new Date().toISOString(),
    )

    console.log("💬 Sample conversation created")

    // Add sample messages
    const insertMessage = sqlite.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    const now = Date.now()

    insertMessage.run(
      `msg-${now}-1`,
      conversationId,
      "assistant",
      "Hello! I'm your AI recruiter. I'm excited to learn more about your background and experience as a Software Engineer. Could you start by telling me about your most recent role and what technologies you've been working with?",
      new Date(now).toISOString(),
    )

    insertMessage.run(
      `msg-${now}-2`,
      conversationId,
      "user",
      "Hi! I've been working as a full-stack developer for the past 3 years, primarily using React, Node.js, and PostgreSQL. I've been involved in building web applications from the ground up.",
      new Date(now + 1000).toISOString(),
    )

    console.log("💬 Sample messages added")

    console.log("✅ Database seeded successfully!")
    console.log("🚀 You can now start the application with: npm run dev")

    sqlite.close()
  } catch (error) {
    console.error("❌ Database seeding failed:", error)
    console.log("Make sure to run 'npm run db:setup' first")
    process.exit(1)
  }
}

seedDatabase()
