import { db } from '../db';
import { products, users } from '../db/schema';

async function checkData() {
  try {
    console.log('=== Checking Database Persistence ===');
    
    // Check users
    const allUsers = await db.select().from(users);
    console.log(`\nUsers (${allUsers.length}):`);
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}, ${user.role})`);
    });
    
    // Check products
    const allProducts = await db.select().from(products);
    console.log(`\nProducts (${allProducts.length}):`);
    allProducts.forEach(product => {
      console.log(`- ${product.title} (${product.price}, ${product.status})`);
    });
    
    console.log('\n=== Data Persistence Check Complete ===');
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    process.exit();
  }
}

checkData();