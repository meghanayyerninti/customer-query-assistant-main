const OpenAI = require('openai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('Testing OpenAI API key...');

async function testOpenAI() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Hello, are you working?"
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    
    console.log('OpenAI API test successful!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API test failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

testOpenAI(); 