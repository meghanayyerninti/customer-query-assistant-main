const axios = require('axios');

async function testChat() {
  try {
    console.log('Testing chat functionality...');
    
    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('\nLogin successful, got token');
    
    // Test sending a message
    console.log('\nTesting send message...');
    const messageResponse = await axios.post('http://localhost:5000/api/chat/message', 
      { message: 'Hello, this is a test message' },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('\nMessage sent successfully!');
    console.log('Response:', JSON.stringify(messageResponse.data, null, 2));
    
    // Get chat history
    console.log('\nGetting chat history...');
    const historyResponse = await axios.get('http://localhost:5000/api/chat', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('\nChat history retrieved successfully!');
    console.log('History:', JSON.stringify(historyResponse.data, null, 2));
    
  } catch (error) {
    console.error('\nError:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testChat(); 