import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Path to SQLite database file
const sqlite = new Database('./db/sqlite.db');

// Create Drizzle ORM database instance
export const db = drizzle(sqlite, { schema });
