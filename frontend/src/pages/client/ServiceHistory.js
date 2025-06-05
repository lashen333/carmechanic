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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Avatar,
  Badge,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  Pending as PendingIcon,
  Assignment as AssignmentIcon,
  Timer as TimerIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
  Edit as EditIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ServiceHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    vehicle: 'all',
    serviceType: 'all',
    dateRange: 'all',
    status: 'all',
  });
  const [vehicles, setVehicles] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [review, setReview] = useState({
    rating: 0,
    comment: '',
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchHistory();
    fetchVehicles();
    fetchServiceTypes();
    if (location.state?.message) {
      setError({ type: 'success', message: location.state.message });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/client/service-history');
      setHistory(response.data);
      setLoading(false);
    } catch (err) {
      setError({ type: 'error', message: 'Failed to load service history. Please try again later.' });
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('/api/client/vehicles');
      setVehicles(response.data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const response = await axios.get('/api/service-types');
      setServiceTypes(response.data);
    } catch (err) {
      console.error('Failed to load service types:', err);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({
      ...filters,
      [field]: event.target.value,
    });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenReview = (request) => {
    setSelectedRecord(request);
    setReview({
      rating: request.rating || 0,
      comment: request.review || '',
    });
    setOpenReviewDialog(true);
  };

  const handleCloseReview = () => {
    setOpenReviewDialog(false);
    setSelectedRecord(null);
    setReview({ rating: 0, comment: '' });
  };

  const handleReviewSubmit = async () => {
    try {
      await axios.post(`/api/client/service-requests/${selectedRecord.id}/review`, review);
      handleCloseReview();
      fetchHistory();
      setError({ type: 'success', message: 'Review submitted successfully!' });
    } catch (err) {
      setError({ type: 'error', message: err.response?.data?.message || 'Failed to submit review. Please try again.' });
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      completed: { color: 'success', icon: <CheckCircleIcon />, label: 'Completed' },
      cancelled: { color: 'error', icon: <CancelIcon />, label: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig.completed;

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

  const getDateRangeLabel = (range) => {
    const ranges = {
      week: 'Last 7 Days',
      month: 'Last 30 Days',
      quarter: 'Last 3 Months',
      year: 'Last 12 Months',
      all: 'All Time',
    };
    return ranges[range] || ranges.all;
  };

  const filterRecords = (records) => {
    return records.filter(record => {
      // Search term filter
      const searchMatch = searchTerm === '' || 
        record.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${record.vehicle.year} ${record.vehicle.make} ${record.vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase());

      // Vehicle filter
      const vehicleMatch = filters.vehicle === 'all' || record.vehicle.id === filters.vehicle;

      // Service type filter
      const serviceTypeMatch = filters.serviceType === 'all' || record.serviceType === filters.serviceType;

      // Status filter
      const statusMatch = filters.status === 'all' || record.status === filters.status;

      // Date range filter
      let dateMatch = true;
      if (filters.dateRange !== 'all') {
        const recordDate = new Date(record.completedAt);
        const now = new Date();
        const diffTime = Math.abs(now - recordDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case 'week':
            dateMatch = diffDays <= 7;
            break;
          case 'month':
            dateMatch = diffDays <= 30;
            break;
          case 'quarter':
            dateMatch = diffDays <= 90;
            break;
          case 'year':
            dateMatch = diffDays <= 365;
            break;
          default:
            dateMatch = true;
        }
      }

      return searchMatch && vehicleMatch && serviceTypeMatch && statusMatch && dateMatch;
    });
  };

  const filteredHistory = filterRecords(history);

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

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
          Service History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>

      {error && (
        <Alert severity={error.type} sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by service type, description, or vehicle..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            {showFilters && (
              <>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Vehicle</InputLabel>
                    <Select
                      value={filters.vehicle}
                      onChange={handleFilterChange('vehicle')}
                      label="Vehicle"
                    >
                      <MenuItem value="all">All Vehicles</MenuItem>
                      {vehicles.map((vehicle) => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          {`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Service Type</InputLabel>
                    <Select
                      value={filters.serviceType}
                      onChange={handleFilterChange('serviceType')}
                      label="Service Type"
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      {serviceTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={filters.dateRange}
                      onChange={handleFilterChange('dateRange')}
                      label="Date Range"
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="week">Last 7 Days</MenuItem>
                      <MenuItem value="month">Last 30 Days</MenuItem>
                      <MenuItem value="quarter">Last 3 Months</MenuItem>
                      <MenuItem value="year">Last 12 Months</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <Box textAlign="center" py={4}>
              <BuildIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Service History
              </Typography>
              <Typography color="text.secondary" paragraph>
                {searchTerm || Object.values(filters).some(f => f !== 'all')
                  ? "No records match your search criteria."
                  : "You don't have any completed service records yet."}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service Type</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Completed Date</TableCell>
                    <TableCell>Mechanic</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {record.serviceType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {`${record.vehicle.year} ${record.vehicle.make} ${record.vehicle.model}`}
                      </TableCell>
                      <TableCell>{formatDate(record.completedAt)}</TableCell>
                      <TableCell>{record.mechanic.name}</TableCell>
                      <TableCell>{formatCurrency(record.finalAmount)}</TableCell>
                      <TableCell>{getStatusChip(record.status)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(record)}
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
        {selectedRecord && (
          <>
            <DialogTitle>
              Service Record Details
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
                    {`${selectedRecord.vehicle.year} ${selectedRecord.vehicle.make} ${selectedRecord.vehicle.model}`}
                  </Typography>
                  <Typography color="textSecondary">
                    License Plate: {selectedRecord.vehicle.licensePlate}
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
                    Type: {selectedRecord.serviceType}
                  </Typography>
                  <Typography>
                    Status: {getStatusChip(selectedRecord.status)}
                  </Typography>
                  <Typography>
                    Completed: {formatDate(selectedRecord.completedAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Description
                  </Typography>
                  <Typography paragraph>
                    {selectedRecord.description}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Work Performed
                  </Typography>
                  <List>
                    {selectedRecord.workItems.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.description}
                          secondary={item.notes}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        Parts & Labor Details
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Parts Used
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Part Name</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedRecord.parts.map((part, index) => (
                                <TableRow key={index}>
                                  <TableCell>{part.name}</TableCell>
                                  <TableCell align="right">{part.quantity}</TableCell>
                                  <TableCell align="right">{formatCurrency(part.unitPrice)}</TableCell>
                                  <TableCell align="right">
                                    {formatCurrency(part.quantity * part.unitPrice)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Labor
                          </Typography>
                          <Typography>
                            Hours: {selectedRecord.laborHours}
                          </Typography>
                          <Typography>
                            Rate: {formatCurrency(selectedRecord.laborRate)}/hour
                          </Typography>
                          <Typography>
                            Total: {formatCurrency(selectedRecord.laborHours * selectedRecord.laborRate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Final Amount: {formatCurrency(selectedRecord.finalAmount)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                {selectedRecord.warranty && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Warranty Information
                    </Typography>
                    <Typography>
                      {selectedRecord.warranty}
                    </Typography>
                  </Grid>
                )}

                {selectedRecord.mechanicNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Mechanic Notes
                    </Typography>
                    <Typography>
                      {selectedRecord.mechanicNotes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={openReviewDialog}
        onClose={handleCloseReview}
        maxWidth="sm"
        fullWidth
      >
        {selectedRecord && (
          <>
            <DialogTitle>
              Rate Your Service
            </DialogTitle>
            <DialogContent>
              <Box sx={{ my: 2 }}>
                <Typography gutterBottom>
                  How would you rate your experience?
                </Typography>
                <Rating
                  value={review.rating}
                  onChange={(event, newValue) => {
                    setReview({ ...review, rating: newValue });
                  }}
                  size="large"
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Review"
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                placeholder="Share your experience with this service..."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseReview}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleReviewSubmit}
                disabled={!review.rating}
              >
                Submit Review
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ServiceHistory; 