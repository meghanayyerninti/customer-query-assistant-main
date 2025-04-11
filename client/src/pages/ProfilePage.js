import React, { useState } from 'react';
import { 
  Typography, 
  Paper, 
  TextField,
  Button,
  Box,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { AccountCircle, Save } from '@mui/icons-material';
import { toast } from 'react-toastify';

import PageContainer from '../components/Layout/PageContainer';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { currentUser, updateProfile, error: authError, setError } = useAuth();

  const [formData, setFormData] = useState({
    username: currentUser ? currentUser.username : '',
    email: currentUser ? currentUser.email : '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Password validation only if user is trying to change password
    if (formData.password) {
      if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Only include password in update if it was provided
    const updateData = {
      username: formData.username,
      email: formData.email
    };
    
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const success = await updateProfile(updateData);
      
      if (success) {
        toast.success('Profile updated successfully');
        // Clear password fields after successful update
        setFormData({
          ...formData,
          password: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setError('Failed to update profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        
        {authError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {authError}
          </Alert>
        )}
        
        <Paper sx={{ p: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 3
            }}
          >
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main',
                mb: 2
              }}
            >
              <AccountCircle sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h5">
              {currentUser ? currentUser.username : ''}
            </Typography>
            <Chip 
              label={currentUser && currentUser.role === 'admin' ? 'Admin' : 'Core User'} 
              color={currentUser && currentUser.role === 'admin' ? 'secondary' : 'primary'}
              sx={{ mt: 1 }}
            />
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={!!formErrors.username}
                  helperText={formErrors.username}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Change Password (optional)
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default ProfilePage;