import { DatabaseService } from "./database-service";

async function seed() {
  console.log("Seeding database...");

  const dbService = new DatabaseService({
    filename: "./interview_bot.db",
  });

  try {
    await dbService.initialize();
    console.log("Database tables created successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await dbService.close();
    console.log("Database connection closed.");
  }
}

seed();
