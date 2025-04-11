import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Container, 
  Paper 
} from '@mui/material';
import { Error, Home } from '@mui/icons-material';

const NotFoundPage = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper 
        elevation={3}
        sx={{ 
          p: 5, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Error sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
        <Typography variant="h2" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" gutterBottom>
          Page Not Found
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          align="center"
          sx={{ mb: 4 }}
        >
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>
        <Button 
          variant="contained" 
          component={RouterLink} 
          to="/"
          startIcon={<Home />}
        >
          Go to Homepage
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;