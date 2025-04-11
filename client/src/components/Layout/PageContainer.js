import React from 'react';
import { Container, Box } from '@mui/material';
import Navbar from './Navbar';

const PageContainer = ({ children, maxWidth = 'lg' }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      position: 'relative'
    }}>
      <Navbar />
      <Container
        component="main"
        maxWidth={maxWidth}
        sx={{ 
          mt: 4, 
          mb: 4,
          flex: '1 0 auto',
          pb: 8 // Add padding at the bottom to prevent content from being hidden behind footer
        }}
      >
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 2,
          backgroundColor: (theme) => theme.palette.grey[200],
          textAlign: 'center',
          position: 'absolute',
          bottom: 0,
          width: '100%',
          zIndex: 1
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            © {new Date().getFullYear()} AI Customer Query Assistant
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default PageContainer;