import { db } from '../db';
import { favorites, users, products } from '../db/schema';
import { sql } from 'drizzle-orm';

async function checkDatabaseSchema() {
  try {
    console.log('=== Checking Database Schema ===');
    
    // Check if favorites table exists and has data
    try {
      const favoriteCount = await db.select({ count: sql<number>`count(*)` }).from(favorites);
      console.log(`Favorites table exists, ${favoriteCount[0].count} records`);
    } catch (error) {
      console.error('Favorites table error:', error);
    }
    
    // Check users table
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    console.log(`Users table: ${userCount[0].count} records`);
    
    // Check products table
    const productCount = await db.select({ count: sql<number>`count(*)` }).from(products);
    console.log(`Products table: ${productCount[0].count} records`);
    
    console.log('=== Schema Check Complete ===');
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    process.exit();
  }
}

checkDatabaseSchema();