import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Checking logged in status...');
        console.log('Token from localStorage:', token ? 'Present' : 'Not found');
        
        if (token) {
          // Validate token and get user data
          console.log('Fetching user profile...');
          const response = await authService.getProfile();
          console.log('Profile response:', response.data);
          setCurrentUser(response.data.user);
          console.log('Current user set:', response.data.user);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        console.error('Error details:', error.response?.data || error.message);
        localStorage.removeItem('token');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Attempting login with:', { email });
      const response = await authService.login(email, password);
      console.log('Login response:', response.data);
      
      const { token, user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      console.log('Token stored in localStorage');
      
      // Update current user
      setCurrentUser(user);
      console.log('Current user updated:', user);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.register(username, email, password);
      const { token, user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Update current user
      setCurrentUser(user);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.updateProfile(userData);
      setCurrentUser(response.data.user);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || 'Profile update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    setError,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};