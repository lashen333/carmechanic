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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VehicleManagement = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    color: '',
    fuelType: '',
    transmission: '',
    mileage: '',
  });
  const [errors, setErrors] = useState({});

  const fuelTypes = [
    'Gasoline',
    'Diesel',
    'Electric',
    'Hybrid',
    'Other',
  ];

  const transmissions = [
    'Automatic',
    'Manual',
    'CVT',
    'Other',
  ];

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('/api/client/vehicles');
      setVehicles(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load vehicles. Please try again later.');
      setLoading(false);
    }
  };

  const handleOpenDialog = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin || '',
        color: vehicle.color || '',
        fuelType: vehicle.fuelType || '',
        transmission: vehicle.transmission || '',
        mileage: vehicle.mileage || '',
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        vin: '',
        color: '',
        fuelType: '',
        transmission: '',
        mileage: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    const currentYear = new Date().getFullYear();

    if (!formData.make) newErrors.make = 'Make is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.year) {
      newErrors.year = 'Year is required';
    } else if (formData.year < 1900 || formData.year > currentYear + 1) {
      newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }
    if (!formData.licensePlate) {
      newErrors.licensePlate = 'License plate is required';
    }
    if (formData.vin && formData.vin.length !== 17) {
      newErrors.vin = 'VIN must be 17 characters';
    }
    if (formData.mileage && formData.mileage < 0) {
      newErrors.mileage = 'Mileage cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingVehicle) {
        await axios.put(`/api/client/vehicles/${editingVehicle.id}`, formData);
      } else {
        await axios.post('/api/client/vehicles', formData);
      }
      handleCloseDialog();
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vehicle. Please try again.');
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await axios.delete(`/api/client/vehicles/${vehicleId}`);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle. Please try again.');
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
          Vehicle Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Vehicle
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {vehicles.length === 0 ? (
            <Box textAlign="center" py={4}>
              <CarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Vehicles Added
              </Typography>
              <Typography color="text.secondary" paragraph>
                Add your first vehicle to get started with service requests.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Vehicle
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>License Plate</TableCell>
                    <TableCell>VIN</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>Fuel Type</TableCell>
                    <TableCell>Transmission</TableCell>
                    <TableCell>Mileage</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        </Typography>
                      </TableCell>
                      <TableCell>{vehicle.licensePlate}</TableCell>
                      <TableCell>{vehicle.vin || '-'}</TableCell>
                      <TableCell>{vehicle.color || '-'}</TableCell>
                      <TableCell>{vehicle.fuelType || '-'}</TableCell>
                      <TableCell>{vehicle.transmission || '-'}</TableCell>
                      <TableCell>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : '-'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(vehicle)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <DeleteIcon />
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Make"
                value={formData.make}
                onChange={handleChange('make')}
                error={!!errors.make}
                helperText={errors.make}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={handleChange('model')}
                error={!!errors.model}
                helperText={errors.model}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Year"
                value={formData.year}
                onChange={handleChange('year')}
                error={!!errors.year}
                helperText={errors.year}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Plate"
                value={formData.licensePlate}
                onChange={handleChange('licensePlate')}
                error={!!errors.licensePlate}
                helperText={errors.licensePlate}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="VIN"
                value={formData.vin}
                onChange={handleChange('vin')}
                error={!!errors.vin}
                helperText={errors.vin || 'Optional - 17 characters'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Color"
                value={formData.color}
                onChange={handleChange('color')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fuel Type</InputLabel>
                <Select
                  value={formData.fuelType}
                  onChange={handleChange('fuelType')}
                  label="Fuel Type"
                >
                  {fuelTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Transmission</InputLabel>
                <Select
                  value={formData.transmission}
                  onChange={handleChange('transmission')}
                  label="Transmission"
                >
                  {transmissions.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Mileage"
                value={formData.mileage}
                onChange={handleChange('mileage')}
                error={!!errors.mileage}
                helperText={errors.mileage}
                InputProps={{
                  endAdornment: <InputAdornment position="end">mi</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
          >
            {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleManagement; 