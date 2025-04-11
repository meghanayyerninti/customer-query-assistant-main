import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL
});

// Add request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password) => 
    api.post('/api/auth/login', { email, password }),
  
  register: (username, email, password) => 
    api.post('/api/auth/register', { username, email, password }),
  
  getProfile: () => 
    api.get('/api/auth/profile'),
    
  updateProfile: (userData) => 
    api.put('/api/auth/profile', userData)
};

// Chat services
export const chatService = {
  sendMessage: (message, chatId = null) => 
    api.post('/api/chat/message', { message, chatId }),
  
  getChats: () => 
    api.get('/api/chat'),
  
  getChatById: (chatId) => 
    api.get(`/api/chat/${chatId}`),
  
  deleteChat: (chatId) => 
    api.delete(`/api/chat/${chatId}`)
};

// Product services
export const productService = {
  getAllProducts: () => 
    api.get('/api/products'),
  
  getProductById: (productId) => 
    api.get(`/api/products/${productId}`),
  
  createProduct: (productData) => 
    api.post('/api/products', productData),
  
  updateProduct: (productId, productData) => {
    console.log('Updating product:', { productId, productData });
    return api.put(`/api/products/${productId}`, productData)
      .then(response => {
        console.log('Update response:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Update error:', error.response?.data || error.message);
        throw error;
      });
  },
  
  deleteProduct: (productId) => 
    api.delete(`/api/products/${productId}`)
};

// User services
export const userService = {
  getAllUsers: async () => {
    try {
      console.log('Fetching all users...');
      const response = await api.get('/api/users');
      console.log('Users response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },
  
  getUserById: (userId) => 
    api.get(`/api/users/${userId}`),
  
  updateUser: (userId, userData) => 
    api.put(`/api/users/${userId}`, userData),
  
  deleteUser: (userId) => 
    api.delete(`/api/users/${userId}`)
};

export default api;