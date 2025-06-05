import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const CreateServiceRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    priority: 'normal',
    attachments: [],
    additionalNotes: '',
  });
  const [errors, setErrors] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [vehiclesResponse, serviceTypesResponse] = await Promise.all([
        axios.get('/api/client/vehicles'),
        axios.get('/api/service-types'),
      ]);
      setVehicles(vehiclesResponse.data);
      setServiceTypes(serviceTypesResponse.data);
      setLoading(false);
    } catch (err) {
      setError({ type: 'error', message: 'Failed to load form data. Please try again later.' });
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
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

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValid = file.size <= 5 * 1024 * 1024; // 5MB limit
      if (!isValid) {
        setError({
          type: 'warning',
          message: `${file.name} exceeds the 5MB size limit and will be skipped.`,
        });
      }
      return isValid;
    });

    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...validFiles],
    });
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = formData.attachments.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      attachments: updatedFiles,
    });
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
    setOpenPreview(false);
  };

  const validateStep = () => {
    const newErrors = {};

    switch (activeStep) {
      case 0: // Vehicle Selection
        if (!formData.vehicleId) {
          newErrors.vehicleId = 'Please select a vehicle';
        }
        break;
      case 1: // Service Details
        if (!formData.serviceType) {
          newErrors.serviceType = 'Please select a service type';
        }
        if (!formData.description) {
          newErrors.description = 'Please provide a description';
        }
        if (!formData.preferredDate) {
          newErrors.preferredDate = 'Please select a preferred date';
        }
        if (!formData.preferredTime) {
          newErrors.preferredTime = 'Please select a preferred time';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'attachments') {
          formData.attachments.forEach(file => {
            formDataToSend.append('attachments', file);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      await axios.post('/api/client/service-requests', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate('/client/service-history', {
        state: { message: 'Service request submitted successfully!' },
      });
    } catch (err) {
      setError({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit service request. Please try again.',
      });
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      <Typography variant="h4" gutterBottom>
        Create Service Request
      </Typography>

      {error && (
        <Alert severity={error.type} sx={{ mb: 3 }}>
          {error.message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>Select Vehicle</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!errors.vehicleId}>
                      <InputLabel>Vehicle</InputLabel>
                      <Select
                        value={formData.vehicleId}
                        onChange={handleChange('vehicleId')}
                        label="Vehicle"
                      >
                        {vehicles.map((vehicle) => (
                          <MenuItem key={vehicle.id} value={vehicle.id}>
                            {`${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.licensePlate}`}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.vehicleId && (
                        <Typography color="error" variant="caption">
                          {errors.vehicleId}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!formData.vehicleId}
                    >
                      Continue
                    </Button>
                  </Grid>
                </Grid>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Service Details</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.serviceType}>
                      <InputLabel>Service Type</InputLabel>
                      <Select
                        value={formData.serviceType}
                        onChange={handleChange('serviceType')}
                        label="Service Type"
                      >
                        {serviceTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.serviceType && (
                        <Typography color="error" variant="caption">
                          {errors.serviceType}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={formData.priority}
                        onChange={handleChange('priority')}
                        label="Priority"
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      value={formData.description}
                      onChange={handleChange('description')}
                      error={!!errors.description}
                      helperText={errors.description || "Please describe the service needed in detail"}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Preferred Date"
                      value={formData.preferredDate}
                      onChange={handleChange('preferredDate')}
                      error={!!errors.preferredDate}
                      helperText={errors.preferredDate}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Preferred Time"
                      value={formData.preferredTime}
                      onChange={handleChange('preferredTime')}
                      error={!!errors.preferredTime}
                      helperText={errors.preferredTime}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!formData.serviceType || !formData.description}
                    >
                      Continue
                    </Button>
                  </Grid>
                </Grid>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Additional Information</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Additional Notes"
                      value={formData.additionalNotes}
                      onChange={handleChange('additionalNotes')}
                      placeholder="Any additional information that might help the mechanic..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Attachments
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        border: '2px dashed',
                        borderColor: 'divider',
                        textAlign: 'center',
                      }}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button
                          component="span"
                          startIcon={<CloudUploadIcon />}
                          variant="outlined"
                        >
                          Upload Files
                        </Button>
                      </label>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Supported formats: Images, PDF, DOC, DOCX (Max 5MB per file)
                      </Typography>
                    </Paper>
                  </Grid>
                  {formData.attachments.length > 0 && (
                    <Grid item xs={12}>
                      <List>
                        {formData.attachments.map((file, index) => (
                          <ListItem
                            key={index}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveFile(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <ListItemIcon>
                              <AttachFileIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={file.name}
                              secondary={formatFileSize(file.size)}
                            />
                            <Button
                              size="small"
                              onClick={() => handlePreviewFile(file)}
                            >
                              Preview
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </Grid>
                </Grid>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      <Dialog
        open={openPreview}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        {previewFile && (
          <>
            <DialogTitle>
              File Preview
            </DialogTitle>
            <DialogContent>
              {previewFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(previewFile)}
                  alt={previewFile.name}
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              ) : (
                <Box textAlign="center" py={4}>
                  <AttachFileIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {previewFile.name}
                  </Typography>
                  <Typography color="textSecondary">
                    {formatFileSize(previewFile.size)}
                  </Typography>
                  <Typography color="textSecondary" sx={{ mt: 2 }}>
                    Preview not available for this file type
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePreview}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CreateServiceRequest; 