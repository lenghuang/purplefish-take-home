import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sqlite, db } from "./client";

async function main() {
  try {
    // Run migrations (expects migrations in ./drizzle)
    await migrate(db, { migrationsFolder: "./src/db/drizzle" });
    console.log("Migrations applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

main();
