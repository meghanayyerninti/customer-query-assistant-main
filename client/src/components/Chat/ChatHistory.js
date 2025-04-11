import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton, 
  IconButton, 
  ListItemSecondaryAction,
  Typography,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Delete, ChatBubble } from '@mui/icons-material';

const ChatHistory = ({ chats = [], onSelectChat, onDeleteChat, currentChatId }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const handleDeleteClick = (chat, event) => {
    event.stopPropagation();
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      onDeleteChat(chatToDelete._id);
    }
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  return (
    <>
      {!chats || chats.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <ChatBubble sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            No chat history yet. Start a new conversation!
          </Typography>
        </Box>
      ) : (
        <List sx={{ 
          width: '100%',
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}>
          {chats.map((chat) => (
            <ListItem 
              key={chat._id}
              disablePadding
              divider
            >
              <ListItemButton
                selected={currentChatId === chat._id}
                onClick={() => onSelectChat(chat._id)}
              >
                <ListItemText
                  primary={chat.title || 'New Conversation'}
                  secondary={new Date(chat.updatedAt || chat.createdAt).toLocaleString()}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Delete chat">
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={(e) => handleDeleteClick(chat, e)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Chat</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this chat? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatHistory;