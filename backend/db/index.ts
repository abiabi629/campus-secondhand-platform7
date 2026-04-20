import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { config } from 'dotenv';

// Ensure environment variables are loaded
config();

// Use SQLite database file
const sqliteDatabase = 'campus_marketplace.db';

// Create SQLite connection
const sqlite = new Database(sqliteDatabase);

export const db = drizzle(sqlite);
