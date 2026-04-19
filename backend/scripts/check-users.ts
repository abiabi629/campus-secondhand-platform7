import { db } from '../db';
import { users } from '../db/schema';

async function checkUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log('Current users in database:');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
    });
    console.log(`Total users: ${allUsers.length}`);
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    process.exit();
  }
}

checkUsers();