const User = require('../models/user.model');
const bcrypt = require('bcrypt');

const getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users...');
    console.log('Request user:', req.user);
    console.log('Request headers:', req.headers);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('Access denied: User is not admin');
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    console.log('User is admin, proceeding with fetch...');
    const users = await User.find().select('-password');
    console.log(`Found ${users.length} users`);
    console.log('Users data:', JSON.stringify(users, null, 2));
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Regular users can only access their own data
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch user', 
      error: error.message 
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Regular users can only update their own data and can't change roles
    if (req.user.role !== 'admin' && (req.user.id !== userId || updates.role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    
    // Remove any attempt to update immutable fields
    delete updates._id;
    delete updates.createdAt;
    
    // Hash password if it's being updated
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }
    
    // Update with validation
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update user', 
      error: error.message 
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete user', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};