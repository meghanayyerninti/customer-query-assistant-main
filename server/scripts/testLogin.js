const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('\nLogin successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Test the token
    const token = response.data.token;
    console.log('\nTesting token with profile endpoint...');
    
    const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('\nProfile endpoint test successful!');
    console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
    
  } catch (error) {
    console.error('\nError:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testLogin(); 