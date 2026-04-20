const axios = require('axios');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId, email) => {
  const jwtSecret = 'campus-marketplace-secret-key-2026';
  return jwt.sign({ userId, email }, jwtSecret, {
    expiresIn: '7d',
  });
};

// Test get users API
const testGetUsers = async () => {
  try {
    // Generate token for admin user
    const token = generateToken('admin-id', 'admin@example.com');
    console.log('Generated token:', token);
    
    const response = await axios.get('http://localhost:3010/api/admin/users', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

testGetUsers();
