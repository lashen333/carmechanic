import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ServiceRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchRequests();
    // Show success message if redirected from create/edit
    if (location.state?.message) {
      setError({ type: 'success', message: location.state.message });
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/client/service-requests');
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      setError({ type: 'error', message: 'Failed to load service requests. Please try again later.' });
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequest(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      quoted: { color: 'info', icon: <MoneyIcon />, label: 'Quoted' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      in_progress: { color: 'primary', icon: <BuildIcon />, label: 'In Progress' },
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

  const getUrgencyChip = (urgency) => {
    const urgencyConfig = {
      low: { color: 'success', label: 'Low' },
      normal: { color: 'info', label: 'Normal' },
      high: { color: 'warning', label: 'High' },
      urgent: { color: 'error', label: 'Urgent' },
    };

    const config = urgencyConfig[urgency] || urgencyConfig.normal;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredRequests = requests.filter(request => {
    switch (activeTab) {
      case 0: // All
        return true;
      case 1: // Pending
        return request.status === 'pending';
      case 2: // Active
        return ['quoted', 'approved', 'in_progress'].includes(request.status);
      case 3: // Completed
        return ['completed', 'cancelled'].includes(request.status);
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
          Service Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/service-requests/create')}
        >
          New Request
        </Button>
      </Box>

      {error && (
        <Alert severity={error.type} sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Active" />
          <Tab label="Completed" />
        </Tabs>
      </Card>

      <Card>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <Box textAlign="center" py={4}>
              <BuildIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Service Requests
              </Typography>
              <Typography color="text.secondary" paragraph>
                {activeTab === 0
                  ? "You haven't created any service requests yet."
                  : activeTab === 1
                  ? "You don't have any pending requests."
                  : activeTab === 2
                  ? "You don't have any active requests."
                  : "You don't have any completed requests."}
              </Typography>
              {activeTab === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/service-requests/create')}
                >
                  Create Request
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service Type</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Urgency</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Latest Quote</TableCell>
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
                      <TableCell>{getStatusChip(request.status)}</TableCell>
                      <TableCell>{getUrgencyChip(request.urgency)}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>
                        {request.latestQuote ? (
                          formatCurrency(request.latestQuote.amount)
                        ) : (
                          '-'
                        )}
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
                    Status: {getStatusChip(selectedRequest.status)}
                  </Typography>
                  <Typography>
                    Urgency: {getUrgencyChip(selectedRequest.urgency)}
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

                {selectedRequest.additionalNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Additional Notes
                    </Typography>
                    <Typography paragraph>
                      {selectedRequest.additionalNotes}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Quotes
                  </Typography>
                  {selectedRequest.quotes?.length > 0 ? (
                    <List>
                      {selectedRequest.quotes.map((quote) => (
                        <ListItem
                          key={quote.id}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemIcon>
                            <MoneyIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${formatCurrency(quote.amount)} - ${quote.mechanic.name}`}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  Status: {getStatusChip(quote.status)}
                                </Typography>
                                <br />
                                Estimated Completion: {formatDate(quote.estimatedCompletionDate)}
                                {quote.warranty && (
                                  <>
                                    <br />
                                    Warranty: {quote.warranty}
                                  </>
                                )}
                              </>
                            }
                          />
                          {quote.status === 'pending' && (
                            <Box>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                sx={{ mr: 1 }}
                                onClick={() => handleQuoteAction(quote.id, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleQuoteAction(quote.id, 'reject')}
                              >
                                Reject
                              </Button>
                            </Box>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="textSecondary">
                      No quotes received yet.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              {selectedRequest.status === 'pending' && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleCancelRequest(selectedRequest.id)}
                >
                  Cancel Request
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ServiceRequests; 