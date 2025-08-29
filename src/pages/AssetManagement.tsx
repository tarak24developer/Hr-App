import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Pagination,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Category as CategoryIcon,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  Print as PrinterIcon,
  Chair as FurnitureIcon,
  DirectionsCar as VehicleIcon,
  Assignment as AssignmentIcon,
  LocationOn as LocationIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Archive as ArchiveIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import { showNotification } from '../utils/notification';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface Asset {
  id: string;
  name: string;
  category: 'computer' | 'mobile' | 'printer' | 'furniture' | 'vehicle' | 'other';
  serialNumber: string;
  model: string;
  manufacturer: string;
  purchaseDate: any; // Can be Date, Firebase Timestamp, or string
  purchasePrice: number;
  currentValue: number;
  status: 'available' | 'assigned' | 'maintenance' | 'retired' | 'lost';
  assignedTo?: string;
  location: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  warrantyExpiry?: any | null; // Can be Date, Firebase Timestamp, string, or null
  description?: string;
  supplier?: string;
  supplierContact?: string;
  tags?: string[];
  notes?: string;
  imageUrl?: string; // Asset image URL
  maintenanceHistory?: MaintenanceRecord[];
  depreciationRate?: number; // Annual depreciation percentage
  createdAt: any; // Can be Date, Firebase Timestamp, or string
  updatedAt: any; // Can be Date, Firebase Timestamp, or string
}

interface MaintenanceRecord {
  id: string;
  date: any;
  type: 'preventive' | 'repair' | 'upgrade' | 'inspection';
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate?: any;
}

const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    condition: ''
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'computer' as Asset['category'],
    serialNumber: '',
    model: '',
    manufacturer: '',
    purchaseDate: '',
    purchasePrice: '',
    status: 'available' as Asset['status'],
    assignedTo: '',
    location: '',
    condition: 'excellent' as Asset['condition'],
    warrantyExpiry: '',
    description: '',
    supplier: '',
    supplierContact: '',
    tags: '',
    notes: '',
    imageUrl: '',
    depreciationRate: '10'
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'preventive' as MaintenanceRecord['type'],
    description: '',
    cost: '',
    performedBy: '',
    nextMaintenanceDate: ''
  });

  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState<Asset | null>(null);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    assetId?: string;
    assetName?: string;
  }>({
    open: false
  });

  // Firebase integration functions
  const fetchAssets = async () => {
    try {
      setAssetsLoading(true);
      const result = await firebaseService.getCollection('assets');
      if (result.success) {
        setAssets(result.data as Asset[] || []);
      } else {
        showNotification('Failed to fetch assets', 'error');
        setAssets([]);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      showNotification('Error fetching assets', 'error');
      setAssets([]);
    } finally {
      setAssetsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const result = await firebaseService.getCollection('users');
      if (result.success) {
        setUsers(result.data as User[] || []);
      } else {
        showNotification('Failed to fetch users', 'error');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Error fetching users', 'error');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    // Load data from Firebase
    fetchAssets();
    fetchUsers();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         asset.serialNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
                         asset.model.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = !filters.category || asset.category === filters.category;
    const matchesStatus = !filters.status || asset.status === filters.status;
    const matchesCondition = !filters.condition || asset.condition === filters.condition;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCondition;
  });

  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getTotalAssets = () => {
    return assets.reduce((total, asset) => total + asset.purchasePrice, 0);
  };

  const getAvailableAssets = () => {
    return assets.filter(asset => asset.status === 'available');
  };

  const getAssignedAssets = () => {
    return assets.filter(asset => asset.status === 'assigned');
  };

  const getMaintenanceAssets = () => {
    return assets.filter(asset => asset.status === 'maintenance');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getCategoryIcon = (category: Asset['category']) => {
    switch (category) {
      case 'computer': return <ComputerIcon />;
      case 'mobile': return <PhoneIcon />;
      case 'printer': return <PrinterIcon />;
      case 'furniture': return <FurnitureIcon />;
      case 'vehicle': return <VehicleIcon />;
      default: return <CategoryIcon />;
    }
  };

  // Helper function to safely convert Firebase date fields to ISO date strings
  const convertToDateString = (dateField: any): string => {
    if (!dateField) return '';
    if (dateField instanceof Date) {
      return dateField.toISOString().split('T')[0];
    }
    if (typeof dateField === 'string') {
      try {
        return new Date(dateField).toISOString().split('T')[0];
      } catch {
        return dateField;
      }
    }
    // Handle Firebase Timestamp objects
    if (dateField && typeof dateField.toDate === 'function') {
      return dateField.toDate().toISOString().split('T')[0];
    }
    return '';
  };

  // Helper function to safely convert any date type to a display string
  const convertToDisplayDate = (dateField: any): string => {
    if (!dateField) return 'Not specified';
    if (dateField instanceof Date) {
      return dateField.toLocaleDateString();
    }
    if (typeof dateField === 'string') {
      try {
        return new Date(dateField).toLocaleDateString();
      } catch {
        return dateField;
      }
    }
    // Handle Firebase Timestamp objects
    if (dateField && typeof dateField.toDate === 'function') {
      return dateField.toDate().toLocaleDateString();
    }
    return 'Invalid date';
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', asset?: Asset) => {
    setDialogMode(mode);
    if (asset) {
      setSelectedAsset(asset);
      setAssetForm({
        name: asset.name,
        category: asset.category,
        serialNumber: asset.serialNumber,
        model: asset.model,
        manufacturer: asset.manufacturer,
        purchaseDate: convertToDateString(asset.purchaseDate),
        purchasePrice: asset.purchasePrice.toString(),
        status: asset.status,
        assignedTo: asset.assignedTo || '',
        location: asset.location,
        condition: asset.condition,
        warrantyExpiry: convertToDateString(asset.warrantyExpiry),
        description: asset.description || '',
        supplier: asset.supplier || '',
        supplierContact: asset.supplierContact || '',
        tags: asset.tags ? asset.tags.join(', ') : '',
        notes: asset.notes || '',
        imageUrl: asset.imageUrl || '',
        depreciationRate: asset.depreciationRate ? asset.depreciationRate.toString() : '10'
      });
    } else {
      setSelectedAsset(null);
      setAssetForm({
        name: '',
        category: 'computer',
        serialNumber: '',
        model: '',
        manufacturer: '',
        purchaseDate: '',
        purchasePrice: '',
        status: 'available',
        assignedTo: '',
        location: '',
        condition: 'excellent',
        warrantyExpiry: '',
        description: '',
        supplier: '',
        supplierContact: '',
        tags: '',
        notes: '',
        imageUrl: '',
        depreciationRate: '10'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAsset(null);
    setAssetForm({
      name: '',
      category: 'computer',
      serialNumber: '',
      model: '',
      manufacturer: '',
      purchaseDate: '',
      purchasePrice: '',
      status: 'available',
      assignedTo: '',
      location: '',
      condition: 'excellent',
      warrantyExpiry: '',
      description: '',
      supplier: '',
      supplierContact: '',
      tags: '',
      notes: '',
      imageUrl: '',
      depreciationRate: '10'
    });
  };

  const handleSaveAsset = async () => {
    if (!assetForm.name || !assetForm.serialNumber || !assetForm.model || !assetForm.manufacturer || !assetForm.purchasePrice) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
             const assetData = {
         name: assetForm.name,
         category: assetForm.category,
         serialNumber: assetForm.serialNumber,
         model: assetForm.model,
         manufacturer: assetForm.manufacturer,
         purchasePrice: parseFloat(assetForm.purchasePrice),
         currentValue: parseFloat(assetForm.purchasePrice), // Initially same as purchase price
         purchaseDate: new Date(assetForm.purchaseDate),
         status: assetForm.status,
         assignedTo: assetForm.assignedTo || '',
         location: assetForm.location,
         condition: assetForm.condition,
         warrantyExpiry: assetForm.warrantyExpiry ? new Date(assetForm.warrantyExpiry) : null,
         description: assetForm.description || '',
         supplier: assetForm.supplier || '',
         supplierContact: assetForm.supplierContact || '',
         tags: assetForm.tags ? assetForm.tags.split(',').map(tag => tag.trim()) : [],
         notes: assetForm.notes || '',
         createdAt: new Date(),
         updatedAt: new Date()
       };

      if (dialogMode === 'add') {
        const result = await firebaseService.addDocument('assets', assetData);
        if (result.success) {
          showNotification('Asset added successfully!', 'success');
          fetchAssets();
        } else {
          showNotification('Failed to add asset', 'error');
        }
      } else if (dialogMode === 'edit' && selectedAsset) {
        const result = await firebaseService.updateDocument('assets', selectedAsset.id, assetData);
        if (result.success) {
          showNotification('Asset updated successfully!', 'success');
          fetchAssets();
        } else {
          showNotification('Failed to update asset', 'error');
        }
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving asset:', error);
      showNotification('Error saving asset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const result = await firebaseService.deleteDocument('assets', assetId);
      if (result.success) {
        showNotification('Asset deleted successfully!', 'success');
        fetchAssets();
      } else {
        showNotification('Failed to delete asset', 'error');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      showNotification('Error deleting asset', 'error');
    }
  };

  const handleStatusChange = async (assetId: string, newStatus: string) => {
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      const result = await firebaseService.updateDocument('assets', assetId, updateData);
      if (result.success) {
        showNotification(`Asset status updated to ${newStatus}`, 'success');
        fetchAssets();
      } else {
        showNotification('Failed to update asset status', 'error');
      }
    } catch (error) {
      console.error('Error updating asset status:', error);
      showNotification('Error updating asset status', 'error');
    }
  };

  // CSV Export functions
  const generateCSV = () => {
    const headers = [
      'Name', 'Category', 'Serial Number', 'Model', 'Manufacturer', 'Purchase Date', 
      'Purchase Price', 'Current Value', 'Status', 'Condition', 'Location', 'Assigned To', 
      'Warranty Expiry', 'Description', 'Supplier', 'Supplier Contact', 'Tags', 'Notes', 
      'Created At', 'Updated At'
    ];
    
    const csvRows = [headers.join(',')];
    
    assets.forEach(asset => {
      const row = [
        `"${asset.name}"`,
        `"${asset.category}"`,
        `"${asset.serialNumber}"`,
        `"${asset.model}"`,
        `"${asset.manufacturer}"`,
        `"${convertToDisplayDate(asset.purchaseDate)}"`,
        asset.purchasePrice,
        asset.currentValue,
        `"${asset.status}"`,
        `"${asset.condition}"`,
        `"${asset.location}"`,
        `"${asset.assignedTo ? users.find(u => u.id === asset.assignedTo)?.name || 'Unknown' : 'Unassigned'}"`,
        `"${asset.warrantyExpiry ? convertToDisplayDate(asset.warrantyExpiry) : 'Not specified'}"`,
        `"${asset.description || ''}"`,
        `"${asset.supplier || ''}"`,
        `"${asset.supplierContact || ''}"`,
        `"${asset.tags ? asset.tags.join(', ') : ''}"`,
        `"${asset.notes || ''}"`,
        `"${convertToDisplayDate(asset.createdAt)}"`,
        `"${convertToDisplayDate(asset.updatedAt)}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk operations
  const handleBulkAssign = () => {
    // Implementation for bulk assignment
    showNotification('Bulk assignment feature coming soon!', 'info');
  };

  const handleBulkSelection = (assetId: string) => {
    setBulkSelection(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Maintenance functions
  const handleAddMaintenance = async () => {
    if (!selectedAssetForMaintenance || !maintenanceForm.description || !maintenanceForm.cost) {
      showNotification('Please fill in all required maintenance fields', 'error');
      return;
    }

    try {
      const maintenanceRecord: MaintenanceRecord = {
        id: Date.now().toString(),
        date: new Date(),
        type: maintenanceForm.type,
        description: maintenanceForm.description,
        cost: parseFloat(maintenanceForm.cost),
        performedBy: maintenanceForm.performedBy,
        nextMaintenanceDate: maintenanceForm.nextMaintenanceDate ? new Date(maintenanceForm.nextMaintenanceDate) : undefined
      };

      const updatedMaintenanceHistory = [
        ...(selectedAssetForMaintenance.maintenanceHistory || []),
        maintenanceRecord
      ];

      const result = await firebaseService.updateDocument('assets', selectedAssetForMaintenance.id, {
        maintenanceHistory: updatedMaintenanceHistory,
        updatedAt: new Date()
      });

      if (result.success) {
        showNotification('Maintenance record added successfully!', 'success');
        setShowMaintenanceDialog(false);
        setMaintenanceForm({
          type: 'preventive',
          description: '',
          cost: '',
          performedBy: '',
          nextMaintenanceDate: ''
        });
        fetchAssets();
      } else {
        showNotification('Failed to add maintenance record', 'error');
      }
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      showNotification('Error adding maintenance record', 'error');
    }
  };

  // Calculate depreciation
  const calculateDepreciation = (asset: Asset) => {
    if (!asset.depreciationRate || !asset.purchaseDate) return asset.currentValue;
    
    const purchaseDate = new Date(asset.purchaseDate);
    const yearsSincePurchase = (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const depreciationAmount = asset.purchasePrice * (asset.depreciationRate / 100) * yearsSincePurchase;
    return Math.max(asset.purchasePrice - depreciationAmount, 0);
  };

  if (assetsLoading || usersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Asset Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
          >
            Add Asset
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchAssets();
              fetchUsers();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Export assets data to CSV
              const csvContent = generateCSV();
              downloadCSV(csvContent, 'assets-export.csv');
            }}
          >
            Export
          </Button>
          {bulkSelection.length > 0 && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AssignmentIcon />}
              onClick={() => handleBulkAssign()}
            >
              Bulk Assign ({bulkSelection.length})
            </Button>
          )}
        </Box>
        
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, 
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Assets
            </Typography>
            <Typography variant="h4" component="div">
              {assets.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatCurrency(getTotalAssets())} total value
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Available
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {getAvailableAssets().length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Ready for assignment
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Assigned
            </Typography>
            <Typography variant="h4" component="div" color="primary.main">
              {getAssignedAssets().length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Currently in use
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Maintenance
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {getMaintenanceAssets().length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Under repair
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2 
        }}>
          <TextField
            fullWidth
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="computer">Computer</MenuItem>
              <MenuItem value="mobile">Mobile</MenuItem>
              <MenuItem value="printer">Printer</MenuItem>
              <MenuItem value="furniture">Furniture</MenuItem>
              <MenuItem value="vehicle">Vehicle</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
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
              value={filters.condition}
              label="Condition"
              onChange={(e) => handleFilterChange('condition', e.target.value)}
            >
              <MenuItem value="">All Conditions</MenuItem>
              <MenuItem value="excellent">Excellent</MenuItem>
              <MenuItem value="good">Good</MenuItem>
              <MenuItem value="fair">Fair</MenuItem>
              <MenuItem value="poor">Poor</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Assets Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAssets.map((asset) => {
                const assignedUser = users.find(u => u.id === asset.assignedTo);
                return (
                  <TableRow key={asset.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCategoryIcon(asset.category)}
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {asset.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {asset.model} - {asset.manufacturer}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {asset.serialNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {formatCurrency(asset.currentValue)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Purchased: {formatCurrency(asset.purchasePrice)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.status}
                        size="small"
                        color={
                          asset.status === 'available' ? 'success' :
                          asset.status === 'assigned' ? 'primary' :
                          asset.status === 'maintenance' ? 'warning' :
                          asset.status === 'retired' ? 'default' : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {assignedUser ? (
                        <Box>
                          <Typography variant="body2">
                            {assignedUser.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {assignedUser.department}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {asset.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.condition}
                        size="small"
                        color={
                          asset.condition === 'excellent' ? 'success' :
                          asset.condition === 'good' ? 'primary' :
                          asset.condition === 'fair' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('view', asset)}
                            color="info"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Asset">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', asset)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={asset.status}
                            onChange={(e) => handleStatusChange(asset.id, e.target.value)}
                            size="small"
                          >
                            <MenuItem value="available">Available</MenuItem>
                            <MenuItem value="assigned">Assigned</MenuItem>
                            <MenuItem value="maintenance">Maintenance</MenuItem>
                            <MenuItem value="retired">Retired</MenuItem>
                            <MenuItem value="lost">Lost</MenuItem>
                          </Select>
                        </FormControl>
                                                 <Tooltip title="Add Maintenance">
                           <IconButton
                             size="small"
                             onClick={() => {
                               setSelectedAssetForMaintenance(asset);
                               setShowMaintenanceDialog(true);
                             }}
                             color="secondary"
                           >
                             <BuildIcon />
                           </IconButton>
                         </Tooltip>
                         <Tooltip title="Delete Asset">
                           <IconButton
                             size="small"
                             onClick={() => setDeleteConfirm({
                               open: true,
                               assetId: asset.id,
                               assetName: asset.name
                             })}
                             color="error"
                           >
                             <DeleteIcon />
                           </IconButton>
                         </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredAssets.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No assets found matching your criteria
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Pagination */}
      {filteredAssets.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(filteredAssets.length / rowsPerPage)}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* Add/Edit/View Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {dialogMode === 'add' ? <AddIcon /> : 
             dialogMode === 'edit' ? <EditIcon /> : <ViewIcon />}
            <Typography variant="h6">
              {dialogMode === 'add' ? 'Add New Asset' :
               dialogMode === 'edit' ? 'Edit Asset' : 'View Asset Details'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {dialogMode === 'view' && selectedAsset ? (
            // View Mode - Display asset details in structured format
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3 
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom>Asset Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        {getCategoryIcon(selectedAsset.category)}
                      </ListItemIcon>
                      <ListItemText
                        primary="Asset Name"
                        secondary={selectedAsset.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Serial Number"
                        secondary={selectedAsset.serialNumber}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CategoryIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Category"
                        secondary={selectedAsset.category.charAt(0).toUpperCase() + selectedAsset.category.slice(1)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BuildIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Model"
                        secondary={selectedAsset.model}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BuildIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Manufacturer"
                        secondary={selectedAsset.manufacturer}
                      />
                    </ListItem>
                                         <ListItem>
                       <ListItemIcon>
                         <ScheduleIcon />
                       </ListItemIcon>
                       <ListItemText
                         primary="Purchase Date"
                         secondary={convertToDisplayDate(selectedAsset.purchaseDate)}
                       />
                     </ListItem>
                  </List>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Asset Details</Typography>
                  <List dense>
                                         <ListItem>
                       <ListItemIcon>
                         <CheckCircleIcon />
                       </ListItemIcon>
                       <ListItemText
                         primary="Status"
                         secondary={selectedAsset.status.charAt(0).toUpperCase() + selectedAsset.status.slice(1)}
                       />
                       <Chip
                         label={selectedAsset.status}
                         size="small"
                         sx={{
                           bgcolor: selectedAsset.status === 'available' ? 'success.main' :
                                    selectedAsset.status === 'assigned' ? 'primary.main' :
                                    selectedAsset.status === 'maintenance' ? 'warning.main' :
                                    selectedAsset.status === 'retired' ? 'default' : 'error.main',
                           color: 'white',
                           textTransform: 'capitalize'
                         }}
                       />
                     </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Location"
                        secondary={selectedAsset.location}
                      />
                    </ListItem>
                                         <ListItem>
                       <ListItemIcon>
                         <WarningIcon />
                       </ListItemIcon>
                       <ListItemText
                         primary="Condition"
                         secondary={selectedAsset.condition.charAt(0).toUpperCase() + selectedAsset.condition.slice(1)}
                       />
                       <Chip
                         label={selectedAsset.condition}
                         size="small"
                         sx={{
                           bgcolor: selectedAsset.condition === 'excellent' ? 'success.main' :
                                    selectedAsset.condition === 'good' ? 'primary.main' :
                                    selectedAsset.condition === 'fair' ? 'warning.main' : 'error.main',
                           color: 'white',
                           textTransform: 'capitalize'
                         }}
                       />
                     </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Assigned To"
                        secondary={
                          selectedAsset.assignedTo ? 
                          users.find(u => u.id === selectedAsset.assignedTo)?.name || 'Unknown User' :
                          'Unassigned'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Purchase Price"
                        secondary={formatCurrency(selectedAsset.purchasePrice)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Current Value"
                        secondary={formatCurrency(selectedAsset.currentValue)}
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
              
              {selectedAsset.warrantyExpiry && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Warranty Information</Typography>
                  <List dense>
                                         <ListItem>
                       <ListItemIcon>
                         <ScheduleIcon />
                       </ListItemIcon>
                       <ListItemText
                         primary="Warranty Expiry"
                         secondary={convertToDisplayDate(selectedAsset.warrantyExpiry)}
                       />
                     </ListItem>
                  </List>
                </Box>
              )}
              
                             {selectedAsset.supplier && (
                 <Box sx={{ mt: 3 }}>
                   <Typography variant="h6" gutterBottom>Supplier Information</Typography>
                   <List dense>
                     <ListItem>
                       <ListItemIcon>
                         <PersonIcon />
                       </ListItemIcon>
                       <ListItemText
                         primary="Supplier"
                         secondary={selectedAsset.supplier}
                       />
                     </ListItem>
                     {selectedAsset.supplierContact && (
                       <ListItem>
                         <ListItemIcon>
                           <PersonIcon />
                         </ListItemIcon>
                         <ListItemText
                           primary="Contact"
                           secondary={selectedAsset.supplierContact}
                         />
                       </ListItem>
                     )}
                   </List>
                 </Box>
               )}
               
               {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                 <Box sx={{ mt: 3 }}>
                   <Typography variant="h6" gutterBottom>Tags</Typography>
                   <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                     {selectedAsset.tags.map((tag, index) => (
                       <Chip key={index} label={tag} size="small" variant="outlined" />
                     ))}
                   </Box>
                 </Box>
               )}
               
               {selectedAsset.description && (
                 <Box sx={{ mt: 3 }}>
                   <Typography variant="h6" gutterBottom>Description</Typography>
                   <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                     <Typography variant="body2">
                       {selectedAsset.description}
                     </Typography>
                   </Paper>
                 </Box>
               )}
               
               {selectedAsset.notes && (
                 <Box sx={{ mt: 3 }}>
                   <Typography variant="h6" gutterBottom>Notes</Typography>
                   <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                     <Typography variant="body2">
                       {selectedAsset.notes}
                     </Typography>
                   </Paper>
                 </Box>
               )}
            </Box>
          ) : (
            // Edit/Add Mode - Show form fields
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, mt: 2 }}>
              <TextField
                fullWidth
                label="Asset Name"
                value={assetForm.name}
                onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
                InputProps={{
                  startAdornment: <CategoryIcon sx={{ color: 'action.active', mr: 1 }} />
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={assetForm.category}
                  label="Category"
                  onChange={(e) => setAssetForm(prev => ({ ...prev, category: e.target.value as Asset['category'] }))}
                  disabled={dialogMode === 'view'}
                  required
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
                fullWidth
                label="Serial Number"
                value={assetForm.serialNumber}
                onChange={(e) => setAssetForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
                InputProps={{
                  startAdornment: <AssignmentIcon sx={{ color: 'action.active', mr: 1 }} />
                }}
              />
              <TextField
                fullWidth
                label="Model"
                value={assetForm.model}
                onChange={(e) => setAssetForm(prev => ({ ...prev, model: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Manufacturer"
                value={assetForm.manufacturer}
                onChange={(e) => setAssetForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Purchase Price"
                type="number"
                value={assetForm.purchasePrice}
                onChange={(e) => setAssetForm(prev => ({ ...prev, purchasePrice: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Purchase Date"
                type="date"
                value={assetForm.purchaseDate}
                onChange={(e) => setAssetForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={assetForm.status}
                  label="Status"
                  onChange={(e) => setAssetForm(prev => ({ ...prev, status: e.target.value as Asset['status'] }))}
                  disabled={dialogMode === 'view'}
                  required
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={assetForm.assignedTo}
                  label="Assigned To"
                  onChange={(e) => setAssetForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} - {user.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Location"
                value={assetForm.location}
                onChange={(e) => setAssetForm(prev => ({ ...prev, location: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
                InputProps={{
                  startAdornment: <LocationIcon sx={{ color: 'action.active', mr: 1 }} />
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={assetForm.condition}
                  label="Condition"
                  onChange={(e) => setAssetForm(prev => ({ ...prev, condition: e.target.value as Asset['condition'] }))}
                  disabled={dialogMode === 'view'}
                  required
                >
                  <MenuItem value="excellent">Excellent</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Warranty Expiry"
                type="date"
                value={assetForm.warrantyExpiry}
                onChange={(e) => setAssetForm(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
                             <TextField
                 fullWidth
                 label="Description"
                 multiline
                 rows={3}
                 value={assetForm.description}
                 onChange={(e) => setAssetForm(prev => ({ ...prev, description: e.target.value }))}
                 disabled={dialogMode === 'view'}
               />
               <TextField
                 fullWidth
                 label="Supplier"
                 value={assetForm.supplier}
                 onChange={(e) => setAssetForm(prev => ({ ...prev, supplier: e.target.value }))}
                 disabled={dialogMode === 'view'}
               />
               <TextField
                 fullWidth
                 label="Supplier Contact"
                 value={assetForm.supplierContact}
                 onChange={(e) => setAssetForm(prev => ({ ...prev, supplierContact: e.target.value }))}
                 disabled={dialogMode === 'view'}
               />
               <TextField
                 fullWidth
                 label="Tags (comma separated)"
                 value={assetForm.tags}
                 onChange={(e) => setAssetForm(prev => ({ ...prev, tags: e.target.value }))}
                 disabled={dialogMode === 'view'}
                 placeholder="computer, office, business"
               />
               <TextField
                 fullWidth
                 label="Notes"
                 value={assetForm.notes}
                 onChange={(e) => setAssetForm(prev => ({ ...prev, notes: e.target.value }))}
                 disabled={dialogMode === 'view'}
                 multiline
                 rows={3}
               />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            variant={dialogMode === 'view' ? 'contained' : 'outlined'}
            startIcon={dialogMode === 'view' ? <CheckCircleIcon /> : undefined}
          >
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleSaveAsset}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Are you sure you want to delete the asset <strong>"{deleteConfirm.assetName}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            This action cannot be undone. All asset data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (deleteConfirm.assetId) {
                handleDeleteAsset(deleteConfirm.assetId);
                setDeleteConfirm(prev => ({ ...prev, open: false }));
              }
            }}
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete Asset
          </Button>
                 </DialogActions>
       </Dialog>

       {/* Maintenance Dialog */}
       <Dialog open={showMaintenanceDialog} onClose={() => setShowMaintenanceDialog(false)} maxWidth="md" fullWidth>
         <DialogTitle>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <BuildIcon />
             <Typography variant="h6">Add Maintenance Record</Typography>
           </Box>
         </DialogTitle>
         <DialogContent dividers>
           <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, mt: 2 }}>
             <FormControl fullWidth>
               <InputLabel>Maintenance Type</InputLabel>
               <Select
                 value={maintenanceForm.type}
                 label="Maintenance Type"
                 onChange={(e) => setMaintenanceForm(prev => ({ ...prev, type: e.target.value as MaintenanceRecord['type'] }))}
               >
                 <MenuItem value="preventive">Preventive</MenuItem>
                 <MenuItem value="repair">Repair</MenuItem>
                 <MenuItem value="upgrade">Upgrade</MenuItem>
                 <MenuItem value="inspection">Inspection</MenuItem>
               </Select>
             </FormControl>
             <TextField
               fullWidth
               label="Cost"
               type="number"
               value={maintenanceForm.cost}
               onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: e.target.value }))}
               InputProps={{
                 startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>₹</Typography>
               }}
             />
             <TextField
               fullWidth
               label="Performed By"
               value={maintenanceForm.performedBy}
               onChange={(e) => setMaintenanceForm(prev => ({ ...prev, performedBy: e.target.value }))}
               placeholder="Technician name or company"
             />
             <TextField
               fullWidth
               label="Next Maintenance Date"
               type="date"
               value={maintenanceForm.nextMaintenanceDate}
               onChange={(e) => setMaintenanceForm(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
               InputLabelProps={{ shrink: true }}
             />
             <TextField
               fullWidth
               label="Description"
               multiline
               rows={3}
               value={maintenanceForm.description}
               onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
               placeholder="Describe the maintenance work performed"
               sx={{ gridColumn: 'span 2' }}
             />
           </Box>
         </DialogContent>
         <DialogActions sx={{ p: 2, gap: 1 }}>
           <Button onClick={() => setShowMaintenanceDialog(false)} variant="outlined">
             Cancel
           </Button>
           <Button onClick={handleAddMaintenance} variant="contained" startIcon={<BuildIcon />}>
             Add Maintenance
           </Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };

export default AssetManagement;
