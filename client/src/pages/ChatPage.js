import React, { useState, useEffect, useRef } from 'react';
import { 
  Grid, 
  Box, 
  Paper, 
  Typography, 
  Divider,
  CircularProgress,
  Button,
  Alert
} from '@mui/material';
import { AddComment } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

import PageContainer from '../components/Layout/PageContainer';
import ChatMessage from '../components/Chat/ChatMessage';
import ChatInput from '../components/Chat/ChatInput';
import ChatHistory from '../components/Chat/ChatHistory';
import { chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SOCKET_URL } from '../config/constants';

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { token } = useAuth();

  // Initialize Socket.IO connection
  useEffect(() => {
    if (token) {
      console.log('Connecting to Socket.IO server at:', SOCKET_URL);
      
      const newSocket = io(SOCKET_URL, {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server');
      });

      newSocket.on('newMessage', (message) => {
        console.log('Received new message:', message);
        if (currentChat) {
          setCurrentChat({
            ...currentChat,
            messages: [...currentChat.messages, message]
          });
        }
        setIsTyping(false);
      });

      newSocket.on('botTyping', (typing) => {
        setIsTyping(typing);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'Connection error');
        setIsTyping(false);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  // Fetch chat history on component mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await chatService.getChats();
        setChats(response.data.chats || []);
        if (response.data.chats && response.data.chats.length > 0) {
          setCurrentChat(c => response.data.chats[0]);
        }
      } catch (error) {
        console.error('Failed to fetch chats:', error);
        setError('Failed to fetch chat history');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChat?.messages]);

  const handleSelectChat = async (chatId) => {
    try {
      setLoading(true);
      const response = await chatService.getChatById(chatId);
      setCurrentChat(response.data.chat);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch chat:', error);
      setError('Failed to load chat. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await chatService.deleteChat(chatId);
      setChats(chats.filter(chat => chat._id !== chatId));
      
      // If the deleted chat is the current one, clear it
      if (currentChat && currentChat._id === chatId) {
        setCurrentChat(null);
      }
      
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat. Please try again later.');
    }
  };

  const handleNewChat = () => {
    setCurrentChat({
      _id: Date.now().toString(),
      messages: []
    });
  };

  const handleSendMessage = async (message) => {
    try {
      console.log('Sending message:', message);
      setSending(true);
      setError(null);
      
      // Create a temporary message to show immediately
      const tempMessage = {
        id: Date.now().toString(),
        type: 'user',
        message: message,
        timestamp: new Date().toISOString()
      };
      
      // Update UI immediately with user message
      if (currentChat) {
        setCurrentChat(prevChat => ({
          ...prevChat,
          messages: [...prevChat.messages, tempMessage]
        }));
      } else {
        // Create a new chat if none exists
        const newChat = {
          messages: [tempMessage]
        };
        setCurrentChat(newChat);
      }
      
      // Send message through Socket.IO or REST API
      if (socket) {
        socket.emit('sendMessage', { text: message });
        setIsTyping(true);
      } else {
        // Fallback to REST API
        const chatId = currentChat?._id?.length === 24 ? currentChat._id : null;
        const response = await chatService.sendMessage(message, chatId);
        
        if (response.data.chat) {
          // Update the entire chat with the server response
          setCurrentChat(response.data.chat);
        } else if (response.data.message) {
          // Add bot response as a new message
          const botMessage = {
            id: Date.now().toString(),
            type: 'bot',
            message: response.data.message,
            timestamp: new Date().toISOString()
          };
          
          setCurrentChat(prevChat => ({
            ...prevChat,
            messages: [...prevChat.messages, botMessage]
          }));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <PageContainer title="Chat Assistant">
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Chat History</Typography>
              <Button
                variant="contained"
                startIcon={<AddComment />}
                onClick={handleNewChat}
              >
                New Chat
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ChatHistory
                chats={chats}
                currentChatId={currentChat?._id}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
              />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {currentChat ? 'Chat' : 'Start a new chat'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
              {currentChat && currentChat.messages.length > 0 ? (
                currentChat.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                  />
                ))
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    {currentChat ? 'No messages yet. Start typing!' : 'Select a chat or start a new one'}
                  </Typography>
                </Box>
              )}
              {isTyping && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Assistant is typing...
                  </Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>
            
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={sending}
            />
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default ChatPage;