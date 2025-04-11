import React from 'react';
import { Box, Typography, Paper, Avatar } from '@mui/material';
import { Person, SmartToy } from '@mui/icons-material';

const ChatMessage = ({ message }) => {
  // Handle message format consistently
  const text = message.message || message.text || message.content || '';
  const isUser = message.type === 'user' || message.sender === 'user';
  const timestamp = message.timestamp ? new Date(message.timestamp) : new Date();
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2
      }}
    >
      {!isUser && (
        <Avatar 
          sx={{ 
            bgcolor: 'primary.main',
            mr: 1,
            alignSelf: 'flex-end'
          }}
        >
          <SmartToy />
        </Avatar>
      )}
      
      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: isUser ? 'primary.light' : 'background.paper',
            borderRadius: 2,
            color: isUser ? 'white' : 'text.primary'
          }}
        >
          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
            {text}
          </Typography>
        </Paper>
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 0.5,
            alignSelf: isUser ? 'flex-end' : 'flex-start'
          }}
        >
          {timestamp.toLocaleTimeString()}
        </Typography>
      </Box>
      
      {isUser && (
        <Avatar 
          sx={{ 
            bgcolor: 'secondary.main',
            ml: 1,
            alignSelf: 'flex-end'
          }}
        >
          <Person />
        </Avatar>
      )}
    </Box>
  );
};

export default ChatMessage;