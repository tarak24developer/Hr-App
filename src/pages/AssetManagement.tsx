import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Tooltip,
  Stack,
  Container,
  Fade,
  TablePagination,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Computer as ComputerIcon,
  PhoneAndroid as PhoneIcon,
  Print as PrinterIcon,
  Chair as FurnitureIcon,
  DirectionsCar as VehicleIcon,
  Category as CategoryIcon,
  Business as BuildingIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

// Types
interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  serialNumber: string;
  model: string;
  manufacturer: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  status: AssetStatus;
  assignedTo?: string;
  assignedEmployee?: string;
  location: string;
  condition: AssetCondition;
  warrantyExpiry?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

type AssetCategory = 'computer' | 'mobile' | 'printer' | 'furniture' | 'vehicle' | 'other';
type AssetStatus = 'available' | 'assigned' | 'maintenance' | 'retired' | 'lost';
type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';

interface AssetFormData {
  name: string;
  category: AssetCategory;
  serialNumber: string;
  model: string;
  manufacturer: string;
  purchaseDate: string;
  purchasePrice: number;
  status: AssetStatus;
  assignedTo: string;
  location: string;
  condition: AssetCondition;
  warrantyExpiry: string;
  description: string;
}

const AssetManagement: React.FC = () => {
  const theme = useTheme();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    category: 'computer',
    serialNumber: '',
    model: '',
    manufacturer: '',
    purchaseDate: '',
    purchasePrice: 0,
    status: 'available',
    assignedTo: '',
    location: '',
    condition: 'excellent',
    warrantyExpiry: '',
    description: ''
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [processing, setProcessing] = useState(false);

  // Sample data
  const sampleAssets: Asset[] = [
    {
      id: '1',
      name: 'MacBook Pro 16"',
      category: 'computer',
      serialNumber: 'MBP2023001',
      model: 'MacBook Pro M2',
      manufacturer: 'Apple',
      purchaseDate: '2023-01-15',
      purchasePrice: 2500,
      currentValue: 2200,
      status: 'assigned',
      assignedTo: 'emp001',
      assignedEmployee: 'John Doe',
      location: 'Office Floor 3',
      condition: 'excellent',
      warrantyExpiry: '2025-01-15',
      description: '16-inch MacBook Pro with M2 chip, 16GB RAM, 512GB SSD',
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'iPhone 14 Pro',
      category: 'mobile',
      serialNumber: 'IP14P001',
      model: 'iPhone 14 Pro',
      manufacturer: 'Apple',
      purchaseDate: '2023-02-01',
      purchasePrice: 1200,
      currentValue: 900,
      status: 'assigned',
      assignedTo: 'emp002',
      assignedEmployee: 'Jane Smith',
      location: 'Office Floor 2',
      condition: 'good',
      warrantyExpiry: '2024-02-01',
      description: 'iPhone 14 Pro 256GB Space Black',
      createdAt: '2023-02-01T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '3',
      name: 'HP LaserJet Pro',
      category: 'printer',
      serialNumber: 'HPP2023001',
      model: 'LaserJet Pro 4025dn',
      manufacturer: 'HP',
      purchaseDate: '2023-03-10',
      purchasePrice: 800,
      currentValue: 600,
      status: 'available',
      location: 'Office Floor 1',
      condition: 'good',
      warrantyExpiry: '2025-03-10',
      description: 'Color laser printer with duplex printing',
      createdAt: '2023-03-10T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '4',
      name: 'Herman Miller Chair',
      category: 'furniture',
      serialNumber: 'HMC2023001',
      model: 'Aeron Chair',
      manufacturer: 'Herman Miller',
      purchaseDate: '2023-04-20',
      purchasePrice: 1400,
      currentValue: 1200,
      status: 'assigned',
      assignedTo: 'emp003',
      assignedEmployee: 'Mike Johnson',
      location: 'Office Floor 3',
      condition: 'excellent',
      description: 'Ergonomic office chair, size B',
      createdAt: '2023-04-20T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    }
  ];

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAssets(sampleAssets);
    } catch (err) {
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateClick = () => {
    setFormData({
      name: '',
      category: 'computer',
      serialNumber: '',
      model: '',
      manufacturer: '',
      purchaseDate: '',
      purchasePrice: 0,
      status: 'available',
      assignedTo: '',
      location: '',
      condition: 'excellent',
      warrantyExpiry: '',
      description: ''
    });
    setShowCreateDialog(true);
  };

  const handleEditClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      category: asset.category,
      serialNumber: asset.serialNumber,
      model: asset.model,
      manufacturer: asset.manufacturer,
      purchaseDate: asset.purchaseDate,
      purchasePrice: asset.purchasePrice,
      status: asset.status,
      assignedTo: asset.assignedTo || '',
      location: asset.location,
      condition: asset.condition,
      warrantyExpiry: asset.warrantyExpiry || '',
      description: asset.description || ''
    });
    setShowEditDialog(true);
  };

  const handleViewClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowViewDialog(true);
  };

  const handleDeleteClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDeleteDialog(true);
  };

  const handleFormSubmit = async () => {
    try {
      setProcessing(true);
      
      if (showCreateDialog) {
        const newAsset: Asset = {
          id: Date.now().toString(),
          name: formData.name,
          category: formData.category,
          serialNumber: formData.serialNumber,
          model: formData.model,
          manufacturer: formData.manufacturer,
          purchaseDate: formData.purchaseDate,
          purchasePrice: formData.purchasePrice,
          currentValue: formData.purchasePrice, // Initially same as purchase price
          status: formData.status,
          assignedTo: formData.assignedTo || undefined,
          assignedEmployee: formData.assignedTo ? `Employee ${formData.assignedTo}` : undefined,
          location: formData.location,
          condition: formData.condition,
          warrantyExpiry: formData.warrantyExpiry || undefined,
          description: formData.description || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setAssets(prev => [newAsset, ...prev]);
        setSnackbar({ open: true, message: 'Asset created successfully', severity: 'success' });
        setShowCreateDialog(false);
      } else if (showEditDialog && selectedAsset) {
        const updatedAsset: Asset = {
          ...selectedAsset,
          name: formData.name,
          category: formData.category,
          serialNumber: formData.serialNumber,
          model: formData.model,
          manufacturer: formData.manufacturer,
          purchaseDate: formData.purchaseDate,
          purchasePrice: formData.purchasePrice,
          status: formData.status,
          assignedTo: formData.assignedTo || undefined,
          assignedEmployee: formData.assignedTo ? `Employee ${formData.assignedTo}` : undefined,
          location: formData.location,
          condition: formData.condition,
          warrantyExpiry: formData.warrantyExpiry || undefined,
          description: formData.description || undefined,
          updatedAt: new Date().toISOString()
        };
        
        setAssets(prev => prev.map(asset => 
          asset.id === selectedAsset.id ? updatedAsset : asset
        ));
        setSnackbar({ open: true, message: 'Asset updated successfully', severity: 'success' });
        setShowEditDialog(false);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Operation failed', severity: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedAsset) {
        setAssets(prev => prev.filter(asset => asset.id !== selectedAsset.id));
        setSnackbar({ open: true, message: 'Asset deleted successfully', severity: 'success' });
        setShowDeleteDialog(false);
        setSelectedAsset(null);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete asset', severity: 'error' });
    }
  };

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'computer': return <ComputerIcon />;
      case 'mobile': return <PhoneIcon />;
      case 'printer': return <PrinterIcon />;
      case 'furniture': return <FurnitureIcon />;
      case 'vehicle': return <VehicleIcon />;
      default: return <CategoryIcon />;
    }
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case 'available': return 'success';
      case 'assigned': return 'info';
      case 'maintenance': return 'warning';
      case 'retired': return 'default';
      case 'lost': return 'error';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: AssetCondition) => {
    switch (condition) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in timeout={300}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Asset Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              Add Asset
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {assets.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Assets
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BuildingIcon sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {assets.filter(a => a.status === 'available').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ mr: 2, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {assets.filter(a => a.status === 'assigned').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Assigned
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CategoryIcon sx={{ mr: 2, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {formatCurrency(assets.reduce((sum, asset) => sum + asset.currentValue, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Value
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
                sx={{ minWidth: 300 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value as AssetCategory | 'all')}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="computer">Computer</MenuItem>
                  <MenuItem value="mobile">Mobile</MenuItem>
                  <MenuItem value="printer">Printer</MenuItem>
                  <MenuItem value="furniture">Furniture</MenuItem>
                  <MenuItem value="vehicle">Vehicle</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'all')}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Assets Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAssets
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((asset) => (
                      <TableRow key={asset.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getCategoryIcon(asset.category)}
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {asset.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {asset.manufacturer} {asset.model}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={asset.category} 
                            size="small" 
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {asset.serialNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={asset.status}
                            size="small"
                            color={getStatusColor(asset.status) as any}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={asset.condition}
                            size="small"
                            color={getConditionColor(asset.condition) as any}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          {asset.assignedEmployee ? (
                            <Typography variant="body2">{asset.assignedEmployee}</Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(asset.currentValue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleViewClick(asset)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Asset">
                              <IconButton size="small" onClick={() => handleEditClick(asset)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Asset">
                              <IconButton size="small" onClick={() => handleDeleteClick(asset)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredAssets.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>

          {/* Create/Edit Dialog */}
          <Dialog 
            open={showCreateDialog || showEditDialog} 
            onClose={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
            }} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle>
              {showCreateDialog ? 'Add New Asset' : 'Edit Asset'}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField
                  label="Asset Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  required
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as AssetCategory }))}
                    >
                      <MenuItem value="computer">Computer</MenuItem>
                      <MenuItem value="mobile">Mobile</MenuItem>
                      <MenuItem value="printer">Printer</MenuItem>
                      <MenuItem value="furniture">Furniture</MenuItem>
                      <MenuItem value="vehicle">Vehicle</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Serial Number"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    fullWidth
                    required
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                    fullWidth
                  />

                  <TextField
                    label="Model"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    fullWidth
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Purchase Date"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />

                  <TextField
                    label="Purchase Price"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                    fullWidth
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                    }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as AssetStatus }))}
                    >
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="assigned">Assigned</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="retired">Retired</MenuItem>
                      <MenuItem value="lost">Lost</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={formData.condition}
                      label="Condition"
                      onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as AssetCondition }))}
                    >
                      <MenuItem value="excellent">Excellent</MenuItem>
                      <MenuItem value="good">Good</MenuItem>
                      <MenuItem value="fair">Fair</MenuItem>
                      <MenuItem value="poor">Poor</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    fullWidth
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Assigned To (Employee ID)"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    fullWidth
                    placeholder="Leave empty if not assigned"
                  />

                  <TextField
                    label="Warranty Expiry"
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Box>

                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Additional details about the asset..."
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
              }}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleFormSubmit}
                disabled={processing || !formData.name || !formData.serialNumber}
              >
                {processing ? <CircularProgress size={20} /> : (showCreateDialog ? 'Add Asset' : 'Update Asset')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogContent>
              {selectedAsset && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    {getCategoryIcon(selectedAsset.category)}
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {selectedAsset.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedAsset.manufacturer} {selectedAsset.model}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={selectedAsset.status}
                          size="small"
                          color={getStatusColor(selectedAsset.status) as any}
                          sx={{ mr: 1, textTransform: 'capitalize' }}
                        />
                        <Chip
                          label={selectedAsset.condition}
                          size="small"
                          color={getConditionColor(selectedAsset.condition) as any}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Asset Information</Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Serial Number</Typography>
                          <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                            {selectedAsset.serialNumber}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Category</Typography>
                          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                            {selectedAsset.category}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Location</Typography>
                          <Typography variant="body1">{selectedAsset.location}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Purchase Date</Typography>
                          <Typography variant="body1">
                            {new Date(selectedAsset.purchaseDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Financial Information</Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Purchase Price</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatCurrency(selectedAsset.purchasePrice)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current Value</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {formatCurrency(selectedAsset.currentValue)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Assigned To</Typography>
                          <Typography variant="body1">
                            {selectedAsset.assignedEmployee || 'Not assigned'}
                          </Typography>
                        </Box>
                        {selectedAsset.warrantyExpiry && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Warranty Expiry</Typography>
                            <Typography variant="body1">
                              {new Date(selectedAsset.warrantyExpiry).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Box>

                  {selectedAsset.description && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>Description</Typography>
                      <Typography variant="body1" color="text.secondary">
                        {selectedAsset.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowViewDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete "{selectedAsset?.name}"? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="contained" color="error" onClick={handleDelete}>
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          >
            <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default AssetManagement;
