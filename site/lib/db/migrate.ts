import { initializeDatabase } from "./index"

// Initialize database on app startup
export async function setupDatabase() {
  try {
    await initializeDatabase()
    console.log("✅ Database ready")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    // Don't crash the app, just log the error
  }
}
