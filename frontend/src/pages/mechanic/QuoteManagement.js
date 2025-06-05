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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const QuoteManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    laborHours: '',
    laborRate: '',
    estimatedCompletionDate: '',
    warranty: '',
    notes: '',
    parts: [{ name: '', quantity: 1, unitPrice: '' }],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchQuotes();
    if (location.state?.message) {
      setError({ type: 'success', message: location.state.message });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get('/api/mechanic/quotes');
      setQuotes(response.data);
      setLoading(false);
    } catch (err) {
      setError({ type: 'error', message: 'Failed to load quotes. Please try again later.' });
      setLoading(false);
    }
  };

  const handleViewDetails = (quote) => {
    setSelectedQuote(quote);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedQuote(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStepChange = (step) => {
    setActiveStep(step);
  };

  const handleAddPart = () => {
    setFormData({
      ...formData,
      parts: [...formData.parts, { name: '', quantity: 1, unitPrice: '' }],
    });
  };

  const handleRemovePart = (index) => {
    const updatedParts = formData.parts.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      parts: updatedParts,
    });
  };

  const handlePartChange = (index, field, value) => {
    const updatedParts = formData.parts.map((part, i) => {
      if (i === index) {
        return { ...part, [field]: value };
      }
      return part;
    });
    setFormData({
      ...formData,
      parts: updatedParts,
    });
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    const selectedDate = new Date(formData.estimatedCompletionDate);

    if (!formData.laborHours || formData.laborHours <= 0) {
      newErrors.laborHours = 'Labor hours must be greater than 0';
    }
    if (!formData.laborRate || formData.laborRate <= 0) {
      newErrors.laborRate = 'Labor rate must be greater than 0';
    }
    if (!formData.estimatedCompletionDate) {
      newErrors.estimatedCompletionDate = 'Estimated completion date is required';
    } else if (selectedDate < today) {
      newErrors.estimatedCompletionDate = 'Completion date cannot be in the past';
    }

    // Validate parts
    formData.parts.forEach((part, index) => {
      if (!part.name) {
        newErrors[`part${index}Name`] = 'Part name is required';
      }
      if (!part.quantity || part.quantity <= 0) {
        newErrors[`part${index}Quantity`] = 'Quantity must be greater than 0';
      }
      if (!part.unitPrice || part.unitPrice <= 0) {
        newErrors[`part${index}UnitPrice`] = 'Unit price must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const quoteData = {
        ...formData,
        totalAmount: calculateTotal(),
      };

      if (selectedQuote) {
        await axios.put(`/api/mechanic/quotes/${selectedQuote.id}`, quoteData);
      } else {
        await axios.post('/api/mechanic/quotes', quoteData);
      }

      handleCloseDialog();
      fetchQuotes();
      setError({ type: 'success', message: `Quote ${selectedQuote ? 'updated' : 'submitted'} successfully!` });
    } catch (err) {
      setError({ type: 'error', message: err.response?.data?.message || 'Failed to submit quote. Please try again.' });
    }
  };

  const calculateTotal = () => {
    const laborCost = formData.laborHours * formData.laborRate;
    const partsCost = formData.parts.reduce((total, part) => {
      return total + (part.quantity * part.unitPrice);
    }, 0);
    return laborCost + partsCost;
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' },
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

  const filteredQuotes = quotes.filter(quote => {
    switch (activeTab) {
      case 0: // All
        return true;
      case 1: // Pending
        return quote.status === 'pending';
      case 2: // Approved
        return quote.status === 'approved';
      case 3: // Rejected
        return quote.status === 'rejected';
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
          Quote Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedQuote(null);
            setFormData({
              laborHours: '',
              laborRate: '',
              estimatedCompletionDate: '',
              warranty: '',
              notes: '',
              parts: [{ name: '', quantity: 1, unitPrice: '' }],
            });
            setActiveStep(0);
            setOpenDialog(true);
          }}
        >
          New Quote
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
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Card>

      <Card>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <Box textAlign="center" py={4}>
              <MoneyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Quotes
              </Typography>
              <Typography color="text.secondary" paragraph>
                {activeTab === 0
                  ? "You haven't submitted any quotes yet."
                  : activeTab === 1
                  ? "You don't have any pending quotes."
                  : activeTab === 2
                  ? "You don't have any approved quotes."
                  : "You don't have any rejected quotes."}
              </Typography>
              {activeTab === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedQuote(null);
                    setFormData({
                      laborHours: '',
                      laborRate: '',
                      estimatedCompletionDate: '',
                      warranty: '',
                      notes: '',
                      parts: [{ name: '', quantity: 1, unitPrice: '' }],
                    });
                    setActiveStep(0);
                    setOpenDialog(true);
                  }}
                >
                  Submit Quote
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service Request</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Completion Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {quote.serviceRequest.serviceType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {`${quote.serviceRequest.vehicle.year} ${quote.serviceRequest.vehicle.make} ${quote.serviceRequest.vehicle.model}`}
                      </TableCell>
                      <TableCell>{formatCurrency(quote.totalAmount)}</TableCell>
                      <TableCell>{getStatusChip(quote.status)}</TableCell>
                      <TableCell>{formatDate(quote.createdAt)}</TableCell>
                      <TableCell>{formatDate(quote.estimatedCompletionDate)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(quote)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {quote.status === 'pending' && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedQuote(quote);
                                setFormData({
                                  laborHours: quote.laborHours,
                                  laborRate: quote.laborRate,
                                  estimatedCompletionDate: quote.estimatedCompletionDate,
                                  warranty: quote.warranty || '',
                                  notes: quote.notes || '',
                                  parts: quote.parts,
                                });
                                setActiveStep(0);
                                setOpenDialog(true);
                              }}
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
        <DialogTitle>
          {selectedQuote ? 'Edit Quote' : 'Submit New Quote'}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>Service Request Details</StepLabel>
              <StepContent>
                {selectedQuote ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Service Information
                      </Typography>
                      <Typography>
                        Type: {selectedQuote.serviceRequest.serviceType}
                      </Typography>
                      <Typography>
                        Description: {selectedQuote.serviceRequest.description}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Vehicle Information
                      </Typography>
                      <Typography>
                        {`${selectedQuote.serviceRequest.vehicle.year} ${selectedQuote.serviceRequest.vehicle.make} ${selectedQuote.serviceRequest.vehicle.model}`}
                      </Typography>
                      <Typography color="textSecondary">
                        License Plate: {selectedQuote.serviceRequest.vehicle.licensePlate}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => handleStepChange(1)}
                      >
                        Continue to Quote Details
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography>
                    Please select a service request to quote.
                  </Typography>
                )}
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Quote Details</StepLabel>
              <StepContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Labor Hours"
                      value={formData.laborHours}
                      onChange={handleChange('laborHours')}
                      error={!!errors.laborHours}
                      helperText={errors.laborHours}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Labor Rate"
                      value={formData.laborRate}
                      onChange={handleChange('laborRate')}
                      error={!!errors.laborRate}
                      helperText={errors.laborRate}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Estimated Completion Date"
                      value={formData.estimatedCompletionDate}
                      onChange={handleChange('estimatedCompletionDate')}
                      error={!!errors.estimatedCompletionDate}
                      helperText={errors.estimatedCompletionDate}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Warranty"
                      value={formData.warranty}
                      onChange={handleChange('warranty')}
                      placeholder="e.g., 12 months/12,000 miles"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Parts
                    </Typography>
                    {formData.parts.map((part, index) => (
                      <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={5}>
                          <TextField
                            fullWidth
                            label="Part Name"
                            value={part.name}
                            onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                            error={!!errors[`part${index}Name`]}
                            helperText={errors[`part${index}Name`]}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Quantity"
                            value={part.quantity}
                            onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                            error={!!errors[`part${index}Quantity`]}
                            helperText={errors[`part${index}Quantity`]}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Unit Price"
                            value={part.unitPrice}
                            onChange={(e) => handlePartChange(index, 'unitPrice', e.target.value)}
                            error={!!errors[`part${index}UnitPrice`]}
                            helperText={errors[`part${index}UnitPrice`]}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <IconButton
                            color="error"
                            onClick={() => handleRemovePart(index)}
                            disabled={formData.parts.length === 1}
                          >
                            <RemoveCircleIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                    <Button
                      startIcon={<AddCircleIcon />}
                      onClick={handleAddPart}
                      sx={{ mt: 1 }}
                    >
                      Add Part
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Additional Notes"
                      value={formData.notes}
                      onChange={handleChange('notes')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Total Amount: {formatCurrency(calculateTotal())}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                    >
                      {selectedQuote ? 'Update Quote' : 'Submit Quote'}
                    </Button>
                  </Grid>
                </Grid>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuoteManagement; 