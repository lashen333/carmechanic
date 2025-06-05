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
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Inventory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    supplier: 'all',
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editData, setEditData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: 0,
    reorderLevel: 0,
    unitPrice: 0,
    supplier: '',
    location: '',
    notes: '',
  });
  const [addData, setAddData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: 0,
    reorderLevel: 0,
    unitPrice: 0,
    supplier: '',
    location: '',
    notes: '',
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchInventory();
    fetchCategories();
    fetchSuppliers();
    if (location.state?.message) {
      setError({ type: 'success', message: location.state.message });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
      setLoading(false);
    } catch (err) {
      setError({ type: 'error', message: 'Failed to load inventory. Please try again later.' });
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/inventory/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/inventory/suppliers');
      setSuppliers(response.data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setEditData({
      name: item.name,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      unitPrice: item.unitPrice,
      supplier: item.supplier,
      location: item.location,
      notes: item.notes || '',
    });
    setOpenEditDialog(true);
  };

  const handleCloseEdit = () => {
    setOpenEditDialog(false);
    setSelectedItem(null);
    setEditData({
      name: '',
      category: '',
      description: '',
      quantity: 0,
      reorderLevel: 0,
      unitPrice: 0,
      supplier: '',
      location: '',
      notes: '',
    });
  };

  const handleOpenAdd = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAdd = () => {
    setOpenAddDialog(false);
    setAddData({
      name: '',
      category: '',
      description: '',
      quantity: 0,
      reorderLevel: 0,
      unitPrice: 0,
      supplier: '',
      location: '',
      notes: '',
    });
  };

  const handleEditChange = (field) => (event) => {
    setEditData({
      ...editData,
      [field]: event.target.value,
    });
  };

  const handleAddChange = (field) => (event) => {
    setAddData({
      ...addData,
      [field]: event.target.value,
    });
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(`/api/inventory/${selectedItem.id}`, editData);
      handleCloseEdit();
      fetchInventory();
      setError({ type: 'success', message: 'Item updated successfully!' });
    } catch (err) {
      setError({ type: 'error', message: err.response?.data?.message || 'Failed to update item. Please try again.' });
    }
  };

  const handleAddSubmit = async () => {
    try {
      await axios.post('/api/inventory', addData);
      handleCloseAdd();
      fetchInventory();
      setError({ type: 'success', message: 'Item added successfully!' });
    } catch (err) {
      setError({ type: 'error', message: err.response?.data?.message || 'Failed to add item. Please try again.' });
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/inventory/${item.id}`);
        fetchInventory();
        setError({ type: 'success', message: 'Item deleted successfully!' });
      } catch (err) {
        setError({ type: 'error', message: err.response?.data?.message || 'Failed to delete item. Please try again.' });
      }
    }
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

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusChip = (item) => {
    if (item.quantity <= 0) {
      return <Chip icon={<WarningIcon />} label="Out of Stock" color="error" size="small" />;
    } else if (item.quantity <= item.reorderLevel) {
      return <Chip icon={<WarningIcon />} label="Low Stock" color="warning" size="small" />;
    } else {
      return <Chip icon={<CheckCircleIcon />} label="In Stock" color="success" size="small" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filterItems = (items) => {
    return items.filter(item => {
      const searchMatch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const categoryMatch = filters.category === 'all' || item.category === filters.category;
      const supplierMatch = filters.supplier === 'all' || item.supplier === filters.supplier;
      const statusMatch = filters.status === 'all' || 
        (filters.status === 'out' && item.quantity <= 0) ||
        (filters.status === 'low' && item.quantity <= item.reorderLevel) ||
        (filters.status === 'in' && item.quantity > item.reorderLevel);

      return searchMatch && categoryMatch && supplierMatch && statusMatch;
    });
  };

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'price':
          comparison = a.unitPrice - b.unitPrice;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredAndSortedInventory = sortItems(filterItems(inventory));

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
          Inventory Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          Add New Item
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
                placeholder="Search by name, description, or category..."
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={handleFilterChange('category')}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={handleFilterChange('status')}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="out">Out of Stock</MenuItem>
                  <MenuItem value="low">Low Stock</MenuItem>
                  <MenuItem value="in">In Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={filters.supplier}
                  onChange={handleFilterChange('supplier')}
                  label="Supplier"
                >
                  <MenuItem value="all">All Suppliers</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {filteredAndSortedInventory.length === 0 ? (
            <Box textAlign="center" py={4}>
              <InventoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Inventory Items
              </Typography>
              <Typography color="text.secondary" paragraph>
                {searchTerm || Object.values(filters).some(f => f !== 'all')
                  ? "No items match your search criteria."
                  : "Your inventory is empty. Add some items to get started."}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        Name
                        <IconButton size="small" onClick={() => handleSortChange('name')}>
                          <SortIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        Category
                        <IconButton size="small" onClick={() => handleSortChange('category')}>
                          <SortIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        Quantity
                        <IconButton size="small" onClick={() => handleSortChange('quantity')}>
                          <SortIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        Unit Price
                        <IconButton size="small" onClick={() => handleSortChange('price')}>
                          <SortIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {item.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography sx={{ mr: 1 }}>
                            {item.quantity}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(item.quantity / (item.reorderLevel * 2)) * 100}
                            sx={{ width: 60 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{getStatusChip(item)}</TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(item)}
                            sx={{ mr: 1 }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(item)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item)}
                            color="error"
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
        maxWidth="md"
        fullWidth
      >
        {selectedItem && (
          <>
            <DialogTitle>
              Item Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1">
                      Item Information
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2">
                    {selectedItem.name}
                  </Typography>
                  <Typography color="textSecondary" paragraph>
                    {selectedItem.description}
                  </Typography>
                  <Typography>
                    Category: {selectedItem.category}
                  </Typography>
                  <Typography>
                    Location: {selectedItem.location}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1">
                      Stock Information
                    </Typography>
                  </Box>
                  <Typography>
                    Quantity: {selectedItem.quantity}
                  </Typography>
                  <Typography>
                    Reorder Level: {selectedItem.reorderLevel}
                  </Typography>
                  <Typography>
                    Unit Price: {formatCurrency(selectedItem.unitPrice)}
                  </Typography>
                  <Typography>
                    Status: {getStatusChip(selectedItem)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ShippingIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1">
                      Supplier Information
                    </Typography>
                  </Box>
                  <Typography>
                    Supplier: {selectedItem.supplier}
                  </Typography>
                  {selectedItem.supplierContact && (
                    <Typography>
                      Contact: {selectedItem.supplierContact}
                    </Typography>
                  )}
                  {selectedItem.supplierEmail && (
                    <Typography>
                      Email: {selectedItem.supplierEmail}
                    </Typography>
                  )}
                </Grid>

                {selectedItem.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Notes
                    </Typography>
                    <Typography>
                      {selectedItem.notes}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        Usage History
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {selectedItem.usageHistory?.map((usage, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <BuildIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={`Used in ${usage.serviceType}`}
                              secondary={`Date: ${new Date(usage.date).toLocaleDateString()} - Quantity: ${usage.quantity}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  handleCloseDialog();
                  handleOpenEdit(selectedItem);
                }}
              >
                Edit Item
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={openEditDialog}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
      >
        {selectedItem && (
          <>
            <DialogTitle>
              Edit Item
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={editData.name}
                    onChange={handleEditChange('name')}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={editData.description}
                    onChange={handleEditChange('description')}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={editData.category}
                      onChange={handleEditChange('category')}
                      label="Category"
                      required
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Supplier</InputLabel>
                    <Select
                      value={editData.supplier}
                      onChange={handleEditChange('supplier')}
                      label="Supplier"
                      required
                    >
                      {suppliers.map((supplier) => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity"
                    value={editData.quantity}
                    onChange={handleEditChange('quantity')}
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Reorder Level"
                    value={editData.reorderLevel}
                    onChange={handleEditChange('reorderLevel')}
                    required
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Unit Price"
                    value={editData.unitPrice}
                    onChange={handleEditChange('unitPrice')}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={editData.location}
                    onChange={handleEditChange('location')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={editData.notes}
                    onChange={handleEditChange('notes')}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEdit}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleEditSubmit}
                disabled={!editData.name || !editData.category || !editData.supplier}
              >
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={openAddDialog}
        onClose={handleCloseAdd}
        maxWidth="sm"
        fullWidth
      >
        <>
          <DialogTitle>
            Add New Item
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={addData.name}
                  onChange={handleAddChange('name')}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={addData.description}
                  onChange={handleAddChange('description')}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={addData.category}
                    onChange={handleAddChange('category')}
                    label="Category"
                    required
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={addData.supplier}
                    onChange={handleAddChange('supplier')}
                    label="Supplier"
                    required
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={addData.quantity}
                  onChange={handleAddChange('quantity')}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Reorder Level"
                  value={addData.reorderLevel}
                  onChange={handleAddChange('reorderLevel')}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Unit Price"
                  value={addData.unitPrice}
                  onChange={handleAddChange('unitPrice')}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={addData.location}
                  onChange={handleAddChange('location')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={addData.notes}
                  onChange={handleAddChange('notes')}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAdd}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAddSubmit}
              disabled={!addData.name || !addData.category || !addData.supplier}
            >
              Add Item
            </Button>
          </DialogActions>
        </>
      </Dialog>
    </Box>
  );
};

export default Inventory; 