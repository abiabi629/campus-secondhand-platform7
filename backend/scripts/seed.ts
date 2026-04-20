import { db } from '../db';
import { users, products, favorites, announcements, reports, messages } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    // Check if database already has users
    const existingUsers = await db.select({ count: db.fn.count() }).from(users);
    const userCount = Number(existingUsers[0].count);
    
    if (userCount > 0) {
      console.log('Database already has users. Skipping seed data insertion.');
      console.log(`Found ${userCount} existing users.`);
      process.exit();
      return;
    }
    
    console.log('No existing users found. Inserting seed data...');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const now = Date.now();
    
    const adminUser = await db
      .insert(users)
      .values({
        id: uuidv4(),
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: 1,
        verificationStatus: 'approved',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create test user
    const testUser = await db
      .insert(users)
      .values({
        id: uuidv4(),
        name: 'Test User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        isVerified: 1,
        verificationStatus: 'approved',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Sample products
    const sampleProducts = [
      {
        title: 'iPhone 13 Pro',
        description: 'Used iPhone 13 Pro in good condition. 128GB storage, Sierra Blue color.',
        price: 699.99,
        originalPrice: 999.99,
        category: 'electronics',
        condition: 'like-new',
        tradeMethod: 'face',
        tradeLocation: 'Campus Center',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1592492152545-b16b8e7df305?w=800&h=800&fit=crop'
        ]),
        status: 'approved',
        sellerId: testUser[0].id
      },
      {
        title: 'MacBook Air M1',
        description: '2020 MacBook Air with M1 chip. 8GB RAM, 256GB SSD. Perfect for students.',
        price: 799.99,
        originalPrice: 999.99,
        category: 'electronics',
        condition: 'like-new',
        tradeMethod: 'face',
        tradeLocation: 'Library',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1526925539332-aa3b66e35444?w=800&h=800&fit=crop'
        ]),
        status: 'approved',
        sellerId: testUser[0].id
      },
      {
        title: 'Introduction to Computer Science',
        description: 'Textbook for CS101 course. Almost new, no markings.',
        price: 30.00,
        originalPrice: 120.00,
        category: 'books',
        condition: 'like-new',
        tradeMethod: 'face',
        tradeLocation: 'Bookstore',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=800&fit=crop'
        ]),
        status: 'approved',
        sellerId: testUser[0].id
      },
      {
        title: 'Nike Air Max 270',
        description: 'Used Nike Air Max 270 sneakers. Size 10. Still in good condition.',
        price: 50.00,
        originalPrice: 150.00,
        category: 'daily',
        condition: 'used',
        tradeMethod: 'face',
        tradeLocation: 'Gym',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop'
        ]),
        status: 'approved',
        sellerId: testUser[0].id
      },
      {
        title: 'Basketball',
        description: 'Official size 7 basketball. Used but still bounces well.',
        price: 20.00,
        originalPrice: 50.00,
        category: 'sports',
        condition: 'used',
        tradeMethod: 'face',
        tradeLocation: 'Gym',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1578959151288-3279f76c942d?w=800&h=800&fit=crop'
        ]),
        status: 'approved',
        sellerId: testUser[0].id
      },
      {
        title: 'Bluetooth Headphones',
        description: 'Wireless Bluetooth headphones with noise cancellation.',
        price: 40.00,
        originalPrice: 120.00,
        category: 'electronics',
        condition: 'used',
        tradeMethod: 'face',
        tradeLocation: 'Campus Center',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop'
        ]),
        status: 'approved',
        sellerId: testUser[0].id
      },
      {
        title: 'Calculus Textbook',
        description: 'Calculus textbook for Math 101. Some highlighting but still usable.',
        price: 25.00,
        originalPrice: 100.00,
        category: 'books',
        condition: 'used',
        tradeMethod: 'face',
        tradeLocation: 'Library',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=800&fit=crop'
        ]),
        status: 'approved',
        sellerId: testUser[0].id
      },
      {
        title: 'Portable Charger',
        description: '10000mAh portable charger. Perfect for students on the go.',
        price: 15.00,
        originalPrice: 30.00,
        category: 'electronics',
        condition: 'like-new',
        tradeMethod: 'face',
        tradeLocation: 'Campus Center',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=800&fit=crop'
        ]),
        status: 'approved',
        sellerId: testUser[0].id
      }
    ];

    // Insert products
    for (const product of sampleProducts) {
      await db.insert(products).values({
        ...product,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log('Seed data inserted successfully!');
    console.log(`Created ${sampleProducts.length} products`);
    console.log(`Created admin user: admin@example.com (password: admin123)`);
    console.log(`Created test user: user@example.com (password: admin123)`);
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit();
  }
}

seed();
