import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const steps = ['Service Request Details', 'Quote Details', 'Review & Submit'];

const CreateQuote = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceRequest, setServiceRequest] = useState(null);
  const [formData, setFormData] = useState({
    laborHours: '',
    laborRate: '',
    estimatedCompletionDate: null,
    parts: [],
    notes: '',
    warranty: '',
  });
  const [newPart, setNewPart] = useState({
    name: '',
    quantity: '',
    unitPrice: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchServiceRequest = async () => {
      try {
        const response = await axios.get(`/api/mechanic/service-requests/${requestId}`);
        setServiceRequest(response.data);
      } catch (err) {
        setError('Failed to load service request details. Please try again later.');
      }
    };

    fetchServiceRequest();
  }, [requestId]);

  const validateStep = () => {
    const newErrors = {};

    switch (activeStep) {
      case 1:
        if (!formData.laborHours || formData.laborHours <= 0) {
          newErrors.laborHours = 'Please enter valid labor hours';
        }
        if (!formData.laborRate || formData.laborRate <= 0) {
          newErrors.laborRate = 'Please enter valid labor rate';
        }
        if (!formData.estimatedCompletionDate) {
          newErrors.estimatedCompletionDate = 'Please select estimated completion date';
        }
        if (formData.parts.length === 0) {
          newErrors.parts = 'Please add at least one part';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      const quoteData = {
        ...formData,
        serviceRequestId: requestId,
        totalAmount: calculateTotal(),
      };
      await axios.post('/api/mechanic/quotes', quoteData);
      navigate('/quotes', { 
        state: { message: 'Quote submitted successfully!' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quote. Please try again.');
      setLoading(false);
    }
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

  const handleNewPartChange = (field) => (event) => {
    setNewPart({
      ...newPart,
      [field]: event.target.value,
    });
  };

  const addPart = () => {
    if (!newPart.name || !newPart.quantity || !newPart.unitPrice) return;

    setFormData({
      ...formData,
      parts: [...formData.parts, { ...newPart, id: Date.now() }],
    });
    setNewPart({ name: '', quantity: '', unitPrice: '' });
  };

  const removePart = (partId) => {
    setFormData({
      ...formData,
      parts: formData.parts.filter(part => part.id !== partId),
    });
  };

  const calculateTotal = () => {
    const laborCost = formData.laborHours * formData.laborRate;
    const partsCost = formData.parts.reduce(
      (total, part) => total + part.quantity * part.unitPrice,
      0
    );
    return laborCost + partsCost;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        if (!serviceRequest) return <CircularProgress />;
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Service Request Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1">
                    Vehicle Information
                  </Typography>
                </Box>
                <Typography>
                  {`${serviceRequest.vehicle.year} ${serviceRequest.vehicle.make} ${serviceRequest.vehicle.model}`}
                </Typography>
                <Typography color="textSecondary">
                  License Plate: {serviceRequest.vehicle.licensePlate}
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
                  Type: {serviceRequest.serviceType}
                </Typography>
                <Typography>
                  Description: {serviceRequest.description}
                </Typography>
                <Typography color="textSecondary">
                  Urgency: {serviceRequest.urgency}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Labor Hours"
                value={formData.laborHours}
                onChange={handleChange('laborHours')}
                error={!!errors.laborHours}
                helperText={errors.laborHours}
                InputProps={{
                  endAdornment: <InputAdornment position="end">hours</InputAdornment>,
                }}
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
                  endAdornment: <InputAdornment position="end">/hour</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Parts Required
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Part Name"
                    value={newPart.name}
                    onChange={handleNewPartChange('name')}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity"
                    value={newPart.quantity}
                    onChange={handleNewPartChange('quantity')}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Unit Price"
                    value={newPart.unitPrice}
                    onChange={handleNewPartChange('unitPrice')}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={addPart}
                    startIcon={<AddIcon />}
                    sx={{ height: '40px' }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>

              <List>
                {formData.parts.map((part) => (
                  <React.Fragment key={part.id}>
                    <ListItem>
                      <ListItemText
                        primary={part.name}
                        secondary={`Quantity: ${part.quantity} × ${formatCurrency(part.unitPrice)} = ${formatCurrency(part.quantity * part.unitPrice)}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => removePart(part.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
              {errors.parts && (
                <FormHelperText error>{errors.parts}</FormHelperText>
              )}
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
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Warranty"
                value={formData.warranty}
                onChange={handleChange('warranty')}
                placeholder="e.g., 90 days parts and labor"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes"
                value={formData.notes}
                onChange={handleChange('notes')}
                placeholder="Any additional information about the service or parts"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Quote Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="textSecondary">
                  Labor
                </Typography>
                <Typography>
                  Hours: {formData.laborHours} × {formatCurrency(formData.laborRate)}/hour
                </Typography>
                <Typography>
                  Total: {formatCurrency(formData.laborHours * formData.laborRate)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="textSecondary">
                  Parts
                </Typography>
                {formData.parts.map((part) => (
                  <Typography key={part.id}>
                    {part.name}: {part.quantity} × {formatCurrency(part.unitPrice)} = {formatCurrency(part.quantity * part.unitPrice)}
                  </Typography>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" color="primary">
                  Total Amount: {formatCurrency(calculateTotal())}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" color="textSecondary">
                  Additional Information
                </Typography>
                <Typography>
                  Estimated Completion: {formData.estimatedCompletionDate}
                </Typography>
                {formData.warranty && (
                  <Typography>
                    Warranty: {formData.warranty}
                  </Typography>
                )}
                {formData.notes && (
                  <Typography>
                    Notes: {formData.notes}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!serviceRequest && !error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create Quote
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            {activeStep > 0 && (
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
            )}
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                Submit Quote
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateQuote; 