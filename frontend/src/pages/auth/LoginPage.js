import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';
import LoginForm from '../../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
        <Box sx={{ width: '100%', display: 'flex', gap: 4 }}>
          {/* Left side - Welcome message */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              p: 4,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 2,
            }}
          >
            <Typography variant="h3" component="h1" gutterBottom>
              Welcome to MechConnect
            </Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Your trusted platform for automotive services
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Connect with skilled mechanics, manage your vehicle services, and get expert help when you need it most.
            </Typography>
          </Paper>

          {/* Right side - Login form */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <LoginForm />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage; 