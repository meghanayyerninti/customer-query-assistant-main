const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/user.model');

// Load environment variables
dotenv.config();

async function checkAuth() {
  try {
    // Get token from localStorage (you'll need to copy this from your browser)
    const token = process.argv[2];
    
    if (!token) {
      console.log('Please provide a token as an argument');
      console.log('You can get this from your browser\'s localStorage (key: token)');
      process.exit(1);
    }

    console.log('Verifying token...');
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('\nToken decoded successfully:');
    console.log('User ID:', decoded.id || decoded._id);
    console.log('Token payload:', decoded);

    // Check if user exists in database
    const user = await User.findById(decoded.id || decoded._id);
    if (user) {
      console.log('\nUser found in database:');
      console.log('Username:', user.username);
      console.log('Role:', user.role);
    } else {
      console.log('\nWarning: User not found in database!');
    }

  } catch (error) {
    console.error('\nError:', error.message);
    if (error.name === 'JsonWebTokenError') {
      console.log('The token is invalid or has been tampered with');
    } else if (error.name === 'TokenExpiredError') {
      console.log('The token has expired');
    }
  }
}

checkAuth(); 