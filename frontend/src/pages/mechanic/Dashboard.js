import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Assignment as AssignmentIcon,
  Timer as TimerIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [metrics, setMetrics] = useState({
    completedToday: 0,
    pendingRequests: 0,
    averageCompletionTime: 0,
    customerSatisfaction: 0,
    monthlyRevenue: 0,
    upcomingAppointments: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: '',
    estimatedCompletionTime: '',
  });

  useEffect(() => {
    fetchDashboardData();
    if (location.state?.message) {
      setError({ type: 'success', message: location.state.message });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchDashboardData = async () => {
    try {
      const [requestsResponse, metricsResponse] = await Promise.all([
        axios.get('/api/mechanic/service-requests'),
        axios.get('/api/mechanic/metrics'),
      ]);
      setServiceRequests(requestsResponse.data);
      setMetrics(metricsResponse.data);
      setLoading(false);
    } catch (err) {
      setError({ type: 'error', message: 'Failed to load dashboard data. Please try again later.' });
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setStatusUpdate({
      status: request.status,
      notes: request.mechanicNotes || '',
      estimatedCompletionTime: request.estimatedCompletionTime || '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
  };

  const handleStatusUpdate = async () => {
    try {
      await axios.put(`/api/mechanic/service-requests/${selectedRequest.id}/status`, statusUpdate);
      handleCloseDialog();
      fetchDashboardData();
      setError({ type: 'success', message: 'Service request status updated successfully!' });
    } catch (err) {
      setError({ type: 'error', message: err.response?.data?.message || 'Failed to update status. Please try again.' });
    }
  };

  const handleStatusChange = (event) => {
    setStatusUpdate({
      ...statusUpdate,
      status: event.target.value,
    });
  };

  const handleNotesChange = (event) => {
    setStatusUpdate({
      ...statusUpdate,
      notes: event.target.value,
    });
  };

  const handleCompletionTimeChange = (event) => {
    setStatusUpdate({
      ...statusUpdate,
      estimatedCompletionTime: event.target.value,
    });
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      in_progress: { color: 'info', icon: <BuildIcon />, label: 'In Progress' },
      completed: { color: 'success', icon: <CheckCircleIcon />, label: 'Completed' },
      cancelled: { color: 'error', icon: <CancelIcon />, label: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredRequests = serviceRequests.filter(request => {
    switch (activeTab) {
      case 0: // All
        return true;
      case 1: // Pending
        return request.status === 'pending';
      case 2: // In Progress
        return request.status === 'in_progress';
      case 3: // Completed
        return request.status === 'completed';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Mechanic Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AssignmentIcon />}
          onClick={() => navigate('/mechanic/quotes')}
        >
          Manage Quotes
        </Button>
      </Box>

      {error && (
        <Alert severity={error.type} sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Today's Overview
                </Typography>
              </Box>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Completed Services"
                    secondary={metrics.completedToday}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PendingIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pending Requests"
                    secondary={metrics.pendingRequests}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Upcoming Appointments"
                    secondary={metrics.upcomingAppointments}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Performance Metrics
                </Typography>
              </Box>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <TimerIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Average Completion Time"
                    secondary={`${metrics.averageCompletionTime} hours`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <StarIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Customer Satisfaction"
                    secondary={`${metrics.customerSatisfaction}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Monthly Revenue"
                    secondary={formatCurrency(metrics.monthlyRevenue)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Quick Actions
                </Typography>
              </Box>
              <List>
                <ListItem button onClick={() => navigate('/mechanic/quotes/new')}>
                  <ListItemIcon>
                    <AddIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Create New Quote" />
                </ListItem>
                <ListItem button onClick={() => navigate('/mechanic/schedule')}>
                  <ListItemIcon>
                    <ScheduleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="View Schedule" />
                </ListItem>
                <ListItem button onClick={() => navigate('/mechanic/inventory')}>
                  <ListItemIcon>
                    <BuildIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Check Inventory" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Requests" />
          <Tab label="Pending" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <Box textAlign="center" py={4}>
              <BuildIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Service Requests
              </Typography>
              <Typography color="text.secondary" paragraph>
                {activeTab === 0
                  ? "You don't have any service requests."
                  : activeTab === 1
                  ? "You don't have any pending requests."
                  : activeTab === 2
                  ? "You don't have any in-progress requests."
                  : "You don't have any completed requests."}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service Type</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Estimated Completion</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {request.serviceType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {`${request.vehicle.year} ${request.vehicle.make} ${request.vehicle.model}`}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                            {request.client.name.charAt(0)}
                          </Avatar>
                          {request.client.name}
                        </Box>
                      </TableCell>
                      <TableCell>{getStatusChip(request.status)}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.priority}
                          color={request.priority === 'high' ? 'error' : request.priority === 'medium' ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>
                        {request.estimatedCompletionTime
                          ? formatDate(request.estimatedCompletionTime)
                          : 'Not set'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(request)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'pending' && (
                          <Tooltip title="Update Status">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(request)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle>
              Service Request Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1">
                      Vehicle Information
                    </Typography>
                  </Box>
                  <Typography>
                    {`${selectedRequest.vehicle.year} ${selectedRequest.vehicle.make} ${selectedRequest.vehicle.model}`}
                  </Typography>
                  <Typography color="textSecondary">
                    License Plate: {selectedRequest.vehicle.licensePlate}
                  </Typography>
                  <Typography color="textSecondary">
                    VIN: {selectedRequest.vehicle.vin}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1">
                      Service Information
                    </Typography>
                  </Box>
                  <Typography>
                    Type: {selectedRequest.serviceType}
                  </Typography>
                  <Typography>
                    Priority: {selectedRequest.priority}
                  </Typography>
                  <Typography>
                    Status: {getStatusChip(selectedRequest.status)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Description
                  </Typography>
                  <Typography paragraph>
                    {selectedRequest.description}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Update Status
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusUpdate.status}
                          onChange={handleStatusChange}
                          label="Status"
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="in_progress">In Progress</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Estimated Completion Time"
                        value={statusUpdate.estimatedCompletionTime}
                        onChange={handleCompletionTimeChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Mechanic Notes"
                        value={statusUpdate.notes}
                        onChange={handleNotesChange}
                        placeholder="Add any notes about the service or status update..."
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {selectedRequest.clientNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Client Notes
                    </Typography>
                    <Typography>
                      {selectedRequest.clientNotes}
                    </Typography>
                  </Grid>
                )}

                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Attachments
                    </Typography>
                    <List>
                      {selectedRequest.attachments.map((attachment, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AttachmentIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={attachment.name}
                            secondary={attachment.type}
                          />
                          <Button
                            size="small"
                            onClick={() => window.open(attachment.url, '_blank')}
                          >
                            View
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleStatusUpdate}
                disabled={!statusUpdate.status}
              >
                Update Status
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Dashboard; 