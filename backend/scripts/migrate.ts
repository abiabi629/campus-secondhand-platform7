import { db } from '../db';
import { users, products, messages, reports, announcements, favorites, uploads } from '../db/schema';

async function migrate() {
  try {
    // Create tables
    await db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar TEXT,
        phone TEXT,
        student_id TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_verified INTEGER NOT NULL DEFAULT 0,
        verification_status TEXT NOT NULL DEFAULT 'pending',
        credit_score INTEGER NOT NULL DEFAULT 50,
        is_banned INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS Products (
        id TEXT PRIMARY KEY NOT NULL,
        seller_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        category TEXT NOT NULL,
        condition TEXT NOT NULL,
        trade_method TEXT NOT NULL DEFAULT 'face',
        trade_location TEXT,
        images TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'pending',
        reject_reason TEXT,
        view_count INTEGER NOT NULL DEFAULT 0,
        is_featured INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS Messages (
        id TEXT PRIMARY KEY NOT NULL,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        product_id TEXT,
        content TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS Reports (
        id TEXT PRIMARY KEY NOT NULL,
        reporter_id TEXT NOT NULL,
        product_id TEXT,
        reported_user_id TEXT,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_note TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS Announcements (
        id TEXT PRIMARY KEY NOT NULL,
        author_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS Favorites (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS Uploads (
        id TEXT PRIMARY KEY NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        s3_key TEXT NOT NULL,
        s3_url TEXT NOT NULL,
        upload_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    console.log('Database tables created successfully!');
  } catch (error) {
    console.error('Error migrating database:', error);
  } finally {
    process.exit();
  }
}

migrate();
