import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import theme from './theme';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Protected Routes
import ProtectedRoute from './components/auth/ProtectedRoute';
import ClientDashboard from './pages/client/ClientDashboard';
import MechanicDashboard from './pages/mechanic/MechanicDashboard';

// Layout Components
import Layout from './components/layout/Layout';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes */}
            <Route
              path="/client/*"
              element={
                <ProtectedRoute requiredRole="client">
                  <Layout>
                    <ClientDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mechanic/*"
              element={
                <ProtectedRoute requiredRole="mechanic">
                  <Layout>
                    <MechanicDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Redirect root to appropriate dashboard or login */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {({ user }) => {
                    if (!user) return <Navigate to="/login" />;
                    return <Navigate to={`/${user.role}/dashboard`} />;
                  }}
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
