const axios = require('axios');

async function testClientLogin() {
  try {
    console.log('Testing client-side login...');
    
    // Make login request
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('\nLogin response:', JSON.stringify(response.data, null, 2));
    
    // Simulate storing token in localStorage
    const token = response.data.token;
    console.log('\nToken to store:', token);
    
    // Test if token is valid
    console.log('\nTesting token with profile endpoint...');
    const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('\nProfile data:', JSON.stringify(profileResponse.data, null, 2));
    
    // Instructions for manual testing
    console.log('\nTo test in browser:');
    console.log('1. Open browser developer tools (F12)');
    console.log('2. Go to Application tab');
    console.log('3. Click on Local Storage on the left');
    console.log('4. Click on your website domain');
    console.log('5. Add a new item with:');
    console.log('   Key: token');
    console.log('   Value: ' + token);
    
  } catch (error) {
    console.error('\nError:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testClientLogin(); 