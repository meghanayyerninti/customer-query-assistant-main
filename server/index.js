const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const productRoutes = require('./routes/product.routes');
const userRoutes = require('./routes/user.routes');
const { authenticateToken } = require('./middleware/auth.middleware');
const { handleMessage } = require('./controllers/chat.controller');

// Load environment variables at the very top
dotenv.config();

// Log environment variables (temporarily for debugging)
console.log('Environment variables loaded:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'API key is set' : 'API key is missing');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'MongoDB URI is set' : 'MongoDB URI is missing');
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Gemini client with error handling
let genAI;
try {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing');
  }
  
  console.log('Initializing Gemini client...');
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim(), {
    apiVersion: 'v1'
  });
  
  // Test the connection
  console.log('Testing Gemini connection...');
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  });
  
  model.generateContent("Test connection")
    .then(result => {
      console.log('Gemini connection test successful');
    })
    .catch(error => {
      console.error('Gemini connection test failed:', error);
      if (error.message.includes('API key not valid')) {
        console.error('Please check your Gemini API key in the .env file');
        console.error('Get a valid API key from: https://makersuite.google.com/app/apikey');
      }
    });
} catch (error) {
  console.error('Failed to initialize Gemini client:', error);
  console.error('Error details:', error.stack);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (chatId) => {
    socket.join(chatId);
    console.log(`Client joined chat: ${chatId}`);
  });

  socket.on('message', async (data) => {
    try {
      const { chatId, message, userId } = data;
      const response = await handleMessage(chatId, message, userId);
      io.to(chatId).emit('message', response);
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Error processing message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});