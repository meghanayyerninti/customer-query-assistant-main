const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Auth middleware - Checking token...');
  console.log('Auth header:', authHeader);
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    // Set both the decoded token and the user ID
    req.user = {
      ...decoded,
      id: decoded.id || decoded._id // Handle both id formats
    };
    console.log('Request user set:', req.user);
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ message: 'Invalid token.' });
  }
};

const isAdmin = (req, res, next) => {
  try {
    console.log('Checking admin access...');
    console.log('User from request:', req.user);
    
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
      console.log('User is not admin. Role:', req.user.role);
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    console.log('Admin access granted');
    next();
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin
};
