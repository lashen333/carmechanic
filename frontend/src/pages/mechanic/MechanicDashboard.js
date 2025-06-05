import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MechanicDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    serviceRequests: [],
    quotes: [],
    bookings: [],
    stats: {
      pendingRequests: 0,
      activeQuotes: 0,
      completedServices: 0,
      totalEarnings: 0,
      averageRating: 0,
    },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/mechanic/dashboard');
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleQuoteAction = async (quoteId, action) => {
    try {
      await axios.post(`/api/mechanic/quotes/${quoteId}/${action}`);
      // Refresh dashboard data
      const response = await axios.get('/api/mechanic/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to update quote status. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mb={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'error',
      accepted: 'success',
      rejected: 'error',
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {dashboardData.user?.name}!
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="subtitle2">
                  Pending Requests
                </Typography>
              </Box>
              <Typography variant="h4">{dashboardData.stats.pendingRequests}</Typography>
              <Button
                size="small"
                onClick={() => navigate('/service-requests')}
                sx={{ mt: 1 }}
              >
                View Requests
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PaymentIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="subtitle2">
                  Active Quotes
                </Typography>
              </Box>
              <Typography variant="h4">{dashboardData.stats.activeQuotes}</Typography>
              <Button
                size="small"
                onClick={() => navigate('/quotes')}
                sx={{ mt: 1 }}
              >
                Manage Quotes
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="subtitle2">
                  Total Earnings
                </Typography>
              </Box>
              <Typography variant="h4">
                {formatCurrency(dashboardData.stats.totalEarnings)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <StarIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="subtitle2">
                  Average Rating
                </Typography>
              </Box>
              <Typography variant="h4">
                {dashboardData.stats.averageRating.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Service Requests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Service Requests
              </Typography>
              <List>
                {dashboardData.serviceRequests.map((request) => (
                  <React.Fragment key={request.id}>
                    <ListItem
                      secondaryAction={
                        <Box>
                          <Tooltip title="View Details">
                            <IconButton
                              edge="end"
                              onClick={() => navigate(`/service-requests/${request.id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {request.status === 'pending' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => navigate(`/quotes/new/${request.id}`)}
                              sx={{ ml: 1 }}
                            >
                              Quote
                            </Button>
                          )}
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <AssignmentIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={request.serviceType}
                        secondary={`${request.vehicle.make} ${request.vehicle.model} • ${new Date(request.createdAt).toLocaleDateString()}`}
                      />
                      <Chip
                        label={request.status.replace('_', ' ')}
                        color={getStatusColor(request.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
                {dashboardData.serviceRequests.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No recent service requests"
                      secondary="Check back later for new requests"
                    />
                  </ListItem>
                )}
              </List>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/service-requests')}
                sx={{ mt: 2 }}
              >
                View All Requests
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Quotes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Quotes
              </Typography>
              <List>
                {dashboardData.quotes.map((quote) => (
                  <React.Fragment key={quote.id}>
                    <ListItem
                      secondaryAction={
                        quote.status === 'pending' && (
                          <Box>
                            <Tooltip title="Accept">
                              <IconButton
                                edge="end"
                                color="success"
                                onClick={() => handleQuoteAction(quote.id, 'accept')}
                                sx={{ mr: 1 }}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                edge="end"
                                color="error"
                                onClick={() => handleQuoteAction(quote.id, 'reject')}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <PaymentIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={formatCurrency(quote.amount)}
                        secondary={`${quote.serviceRequest.serviceType} • ${new Date(quote.createdAt).toLocaleDateString()}`}
                      />
                      <Chip
                        label={quote.status}
                        color={getStatusColor(quote.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
                {dashboardData.quotes.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No recent quotes"
                      secondary="Submit quotes for service requests to get started"
                    />
                  </ListItem>
                )}
              </List>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/quotes')}
                sx={{ mt: 2 }}
              >
                View All Quotes
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MechanicDashboard; 