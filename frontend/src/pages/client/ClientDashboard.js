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
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    vehicles: [],
    serviceRequests: [],
    recentBookings: [],
    stats: {
      activeRequests: 0,
      completedServices: 0,
      totalVehicles: 0,
      averageRating: 0,
    },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/client/dashboard');
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
    };
    return colors[status] || 'default';
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
                <CarIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="subtitle2">
                  Total Vehicles
                </Typography>
              </Box>
              <Typography variant="h4">{dashboardData.stats.totalVehicles}</Typography>
              <Button
                startIcon={<AddIcon />}
                size="small"
                onClick={() => navigate('/vehicles/add')}
                sx={{ mt: 1 }}
              >
                Add Vehicle
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="subtitle2">
                  Active Requests
                </Typography>
              </Box>
              <Typography variant="h4">{dashboardData.stats.activeRequests}</Typography>
              <Button
                size="small"
                onClick={() => navigate('/service-requests/new')}
                sx={{ mt: 1 }}
              >
                New Request
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <BuildIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="textSecondary" variant="subtitle2">
                  Completed Services
                </Typography>
              </Box>
              <Typography variant="h4">{dashboardData.stats.completedServices}</Typography>
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
                    <ListItem>
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
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
                {dashboardData.serviceRequests.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No recent service requests"
                      secondary="Create a new service request to get started"
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

        {/* Vehicle Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vehicle Status
              </Typography>
              <List>
                {dashboardData.vehicles.map((vehicle) => (
                  <React.Fragment key={vehicle.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <CarIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${vehicle.make} ${vehicle.model}`}
                        secondary={`${vehicle.year} • ${vehicle.licensePlate}`}
                      />
                      <Chip
                        label={vehicle.status}
                        color={vehicle.status === 'active' ? 'success' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
                {dashboardData.vehicles.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No vehicles added"
                      secondary="Add your first vehicle to get started"
                    />
                  </ListItem>
                )}
              </List>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/vehicles')}
                sx={{ mt: 2 }}
              >
                Manage Vehicles
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClientDashboard; 