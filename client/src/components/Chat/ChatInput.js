import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Paper,
  CircularProgress
} from '@mui/material';
import { Send } from '@mui/icons-material';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        boxShadow: 3,
        position: 'sticky',
        bottom: 0,
        zIndex: 1,
        backgroundColor: 'white'
      }}
    >
      <TextField
        fullWidth
        placeholder="Type your question here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        variant="outlined"
        InputProps={{
          sx: { borderRadius: 2 }
        }}
      />
      <Box sx={{ ml: 1 }}>
        <IconButton 
          color="primary" 
          aria-label="send message" 
          type="submit"
          disabled={disabled || !message.trim()}
        >
          {disabled ? <CircularProgress size={24} /> : <Send />}
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatInput;