import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Tooltip,
  Pagination,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import { showNotification } from '../utils/notification';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  description: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  assignedTo?: string;
  location: string;
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  condition: 'new' | 'good' | 'fair' | 'poor';
  dateAdded: any; // Can be Date, Firebase Timestamp, or string
  lastUpdated: any; // Can be Date, Firebase Timestamp, or string
  lastAudit?: any; // Can be Date, Firebase Timestamp, or string
  supplier: string;
  supplierContact: string;
  warrantyExpiry?: any | null; // Can be Date, Firebase Timestamp, string, or null
  tags: string[];
  notes: string;
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    condition: '',
    assignedTo: '',
    location: ''
  });

  const [inventoryForm, setInventoryForm] = useState({
    name: '',
    category: '',
    sku: '',
    description: '',
    quantity: '',
    minQuantity: '',
    maxQuantity: '',
    unit: 'pieces',
    unitPrice: '',
    assignedTo: '',
    location: '',
    status: 'active' as InventoryItem['status'],
    condition: 'new' as InventoryItem['condition'],
    supplier: '',
    supplierContact: '',
    warrantyExpiry: '',
    tags: '',
    notes: ''
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    itemId?: string;
    itemName?: string;
  }>({
    open: false
  });

  // Firebase integration functions
  const fetchInventory = async () => {
    try {
      setInventoryLoading(true);
      const result = await firebaseService.getCollection('inventory');
      if (result.success) {
        setInventory(result.data as InventoryItem[] || []);
      } else {
        showNotification('Failed to fetch inventory', 'error');
        setInventory([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showNotification('Error fetching inventory', 'error');
      setInventory([]);
    } finally {
      setInventoryLoading(false);
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
    fetchInventory();
    fetchUsers();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         item.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
                         item.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                         item.category.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = !filters.category || item.category === filters.category;
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesCondition = !filters.condition || item.condition === filters.condition;
    const matchesAssignedTo = !filters.assignedTo || item.assignedTo === filters.assignedTo;
    const matchesLocation = !filters.location || item.location === filters.location;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCondition && matchesAssignedTo && matchesLocation;
  });

  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getTotalValue = () => {
    return inventory.reduce((total, item) => total + item.totalValue, 0);
  };

  const getActiveItems = () => {
    return inventory.filter(item => item.status === 'active');
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= item.minQuantity);
  };

  const getOutOfStockItems = () => {
    return inventory.filter(item => item.status === 'out_of_stock');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'discontinued': return 'error';
      case 'out_of_stock': return 'warning';
      default: return 'default';
    }
  };

  const getConditionColor = (condition: InventoryItem['condition']) => {
    switch (condition) {
      case 'new': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
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

  // Helper function to safely convert Firebase date fields to ISO date strings
  const convertToDateString = (dateField: any): string => {
    if (!dateField) return '';
    if (dateField instanceof Date) {
      return dateField.toISOString().split('T')[0] || '';
    }
    if (typeof dateField === 'string') {
      try {
        return new Date(dateField).toISOString().split('T')[0] || '';
      } catch {
        return dateField;
      }
    }
    // Handle Firebase Timestamp objects
    if (dateField && typeof dateField.toDate === 'function') {
      return dateField.toDate().toISOString().split('T')[0] || '';
    }
    return '';
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', item?: InventoryItem) => {
    setDialogMode(mode);
    if (item) {
      setSelectedItem(item);
      setInventoryForm({
        name: item.name,
        category: item.category,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity.toString(),
        minQuantity: item.minQuantity.toString(),
        maxQuantity: item.maxQuantity.toString(),
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
        assignedTo: item.assignedTo || '',
        location: item.location || '',
        status: item.status,
        condition: item.condition,
        supplier: item.supplier || '',
        supplierContact: item.supplierContact || '',
        warrantyExpiry: convertToDateString(item.warrantyExpiry),
        tags: item.tags.join(', '),
        notes: item.notes || ''
      });
    } else {
      setSelectedItem(null);
      setInventoryForm({
        name: '',
        category: '',
        sku: '',
        description: '',
        quantity: '',
        minQuantity: '',
        maxQuantity: '',
        unit: 'pieces',
        unitPrice: '',
        assignedTo: '',
        location: '',
        status: 'active',
        condition: 'new',
        supplier: '',
        supplierContact: '',
        warrantyExpiry: '',
        tags: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setInventoryForm({
      name: '',
      category: '',
      sku: '',
      description: '',
      quantity: '',
      minQuantity: '',
      maxQuantity: '',
      unit: 'pieces',
      unitPrice: '',
      assignedTo: '',
      location: '',
      status: 'active',
      condition: 'new',
      supplier: '',
      supplierContact: '',
      warrantyExpiry: '',
      tags: '',
      notes: ''
    });
  };

  const handleSaveItem = async () => {
    if (!inventoryForm.name || !inventoryForm.sku || !inventoryForm.category || !inventoryForm.quantity || !inventoryForm.unitPrice) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const itemData = {
        name: inventoryForm.name,
        category: inventoryForm.category,
        sku: inventoryForm.sku,
        description: inventoryForm.description,
        quantity: parseInt(inventoryForm.quantity),
        minQuantity: parseInt(inventoryForm.minQuantity),
        maxQuantity: parseInt(inventoryForm.maxQuantity),
        unit: inventoryForm.unit,
        unitPrice: parseFloat(inventoryForm.unitPrice),
        totalValue: parseInt(inventoryForm.quantity) * parseFloat(inventoryForm.unitPrice),
        assignedTo: inventoryForm.assignedTo || '',
        location: inventoryForm.location,
        status: inventoryForm.status,
        condition: inventoryForm.condition,
        supplier: inventoryForm.supplier || '',
        supplierContact: inventoryForm.supplierContact || '',
        tags: inventoryForm.tags ? inventoryForm.tags.split(',').map(tag => tag.trim()) : [],
        notes: inventoryForm.notes || '',
        warrantyExpiry: inventoryForm.warrantyExpiry ? new Date(inventoryForm.warrantyExpiry) : null,
        dateAdded: new Date(),
        lastUpdated: new Date(),
        lastAudit: new Date()
      };

      if (dialogMode === 'add') {
        const result = await firebaseService.addDocument('inventory', itemData);
        if (result.success) {
          showNotification('Inventory item added successfully!', 'success');
          fetchInventory();
        } else {
          showNotification('Failed to add inventory item', 'error');
        }
      } else if (dialogMode === 'edit' && selectedItem) {
        const result = await firebaseService.updateDocument('inventory', selectedItem.id, itemData);
        if (result.success) {
          showNotification('Inventory item updated successfully!', 'success');
          fetchInventory();
        } else {
          showNotification('Failed to update inventory item', 'error');
        }
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      showNotification('Error saving inventory item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const result = await firebaseService.deleteDocument('inventory', itemId);
      if (result.success) {
        showNotification('Inventory item deleted successfully!', 'success');
        fetchInventory();
      } else {
        showNotification('Failed to delete inventory item', 'error');
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      showNotification('Error deleting inventory item', 'error');
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      const updateData = {
        status: newStatus,
        lastUpdated: new Date()
      };

      const result = await firebaseService.updateDocument('inventory', itemId, updateData);
      if (result.success) {
        showNotification(`Inventory item status updated to ${newStatus}`, 'success');
        fetchInventory();
      } else {
        showNotification('Failed to update inventory item status', 'error');
      }
    } catch (error) {
      console.error('Error updating inventory item status:', error);
      showNotification('Error updating inventory item status', 'error');
    }
  };

  // CSV Export functions
  const generateCSV = () => {
    const headers = [
      'Name', 'SKU', 'Category', 'Description', 'Quantity', 'Unit', 'Unit Price', 
      'Total Value', 'Status', 'Condition', 'Location', 'Assigned To', 
      'Supplier', 'Supplier Contact', 'Warranty Expiry', 'Tags', 'Notes', 
      'Date Added', 'Last Updated'
    ];
    
    const csvRows = [headers.join(',')];
    
    inventory.forEach(item => {
      const row = [
        `"${item.name}"`,
        `"${item.sku}"`,
        `"${item.category}"`,
        `"${item.description}"`,
        item.quantity,
        `"${item.unit}"`,
        item.unitPrice,
        item.totalValue,
        `"${item.status}"`,
        `"${item.condition}"`,
        `"${item.location}"`,
        `"${item.assignedTo ? users.find(u => u.id === item.assignedTo)?.name || 'Unknown' : 'Unassigned'}"`,
        `"${item.supplier}"`,
        `"${item.supplierContact}"`,
        `"${item.warrantyExpiry ? convertToDisplayDate(item.warrantyExpiry) : 'Not specified'}"`,
        `"${item.tags.join(', ')}"`,
        `"${item.notes}"`,
        `"${convertToDisplayDate(item.dateAdded)}"`,
        `"${convertToDisplayDate(item.lastUpdated)}"`
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

  if (inventoryLoading || usersLoading) {
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
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
          >
            Add Item
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchInventory();
              fetchUsers();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Export inventory data to CSV
              const csvContent = generateCSV();
              downloadCSV(csvContent, 'inventory-export.csv');
            }}
          >
            Export
          </Button>
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
              Total Items
            </Typography>
            <Typography variant="h4" component="div">
              {inventory.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatCurrency(getTotalValue())} total value
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Items
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {getActiveItems().length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Currently available
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Low Stock
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {getLowStockItems().length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Below minimum quantity
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Out of Stock
            </Typography>
            <Typography variant="h4" component="div" color="error.main">
              {getOutOfStockItems().length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Need restocking
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
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
          <TextField
            fullWidth
            label="Category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="discontinued">Discontinued</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
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
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="good">Good</MenuItem>
              <MenuItem value="fair">Fair</MenuItem>
              <MenuItem value="poor">Poor</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Assigned To</InputLabel>
            <Select
              value={filters.assignedTo}
              label="Assigned To"
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
            >
              <MenuItem value="">All Assignments</MenuItem>
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
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
        </Box>
      </Paper>

      {/* Inventory Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInventory.map((item) => {
                const assignedUser = users.find(u => u.id === item.assignedTo);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InventoryIcon color="primary" />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {item.category}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {item.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.quantity} {item.unit}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Min: {item.minQuantity} | Max: {item.maxQuantity}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {formatCurrency(item.totalValue)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatCurrency(item.unitPrice)} per {item.unit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(item.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.condition}
                        size="small"
                        color={getConditionColor(item.condition)}
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
                        {item.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('view', item)}
                            color="info"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Item">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', item)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            size="small"
                          >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                            <MenuItem value="discontinued">Discontinued</MenuItem>
                            <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                          </Select>
                        </FormControl>
                        <Tooltip title="Delete Item">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirm({
                              open: true,
                              itemId: item.id,
                              itemName: item.name
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
        
        {filteredInventory.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No inventory items found matching your criteria
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Pagination */}
      {filteredInventory.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(filteredInventory.length / rowsPerPage)}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* Add/Edit/View Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {dialogMode === 'add' ? <AddIcon color="primary" /> : 
             dialogMode === 'edit' ? <EditIcon color="primary" /> : <ViewIcon color="primary" />}
            <Typography variant="h6" component="span">
              {dialogMode === 'add' ? 'Add New Item' :
               dialogMode === 'edit' ? 'Edit Item' : 'View Item Details'}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {dialogMode === 'view'
              ? 'Viewing item details'
              : `Fill the details below to ${dialogMode === 'edit' ? 'update the' : 'create a new'} inventory item. Fields marked with * are required.`}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {dialogMode === 'view' && selectedItem ? (
            // View Mode - Display item details in structured format
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3 
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom>Item Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <InventoryIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Item Name"
                        secondary={selectedItem.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="SKU"
                        secondary={selectedItem.sku}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CategoryIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Category"
                        secondary={selectedItem.category}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BuildIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Description"
                        secondary={selectedItem.description}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Date Added"
                        secondary={convertToDisplayDate(selectedItem.dateAdded)}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Item Details</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Status"
                        secondary={selectedItem.status.replace('_', ' ')}
                      />
                      <Chip
                        label={selectedItem.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(selectedItem.status)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Condition"
                        secondary={selectedItem.condition}
                      />
                      <Chip
                        label={selectedItem.condition}
                        size="small"
                        color={getConditionColor(selectedItem.condition)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Location"
                        secondary={selectedItem.location}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Assigned To"
                        secondary={
                          selectedItem.assignedTo ? 
                          users.find(u => u.id === selectedItem.assignedTo)?.name || 'Unknown User' :
                          'Unassigned'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Quantity"
                        secondary={`${selectedItem.quantity} ${selectedItem.unit}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Value"
                        secondary={formatCurrency(selectedItem.totalValue)}
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
              
              {selectedItem.supplier && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Supplier Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Supplier"
                        secondary={selectedItem.supplier}
                      />
                    </ListItem>
                    {selectedItem.supplierContact && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Contact"
                          secondary={selectedItem.supplierContact}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
              
              {selectedItem.warrantyExpiry && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Warranty Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Warranty Expiry"
                        secondary={convertToDisplayDate(selectedItem.warrantyExpiry)}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
              
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedItem.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {selectedItem.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedItem.notes}
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
                label="Item Name"
                value={inventoryForm.name}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, name: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
                InputProps={{
                  startAdornment: <InventoryIcon sx={{ color: 'action.active', mr: 1 }} />
                }}
              />
              <TextField
                fullWidth
                label="SKU"
                value={inventoryForm.sku}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, sku: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
                InputProps={{
                  startAdornment: <AssignmentIcon sx={{ color: 'action.active', mr: 1 }} />
                }}
              />
              <TextField
                fullWidth
                label="Category"
                value={inventoryForm.category}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, category: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
                InputProps={{
                  startAdornment: <CategoryIcon sx={{ color: 'action.active', mr: 1 }} />
                }}
              />
              <TextField
                fullWidth
                label="Description"
                value={inventoryForm.description}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, description: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={inventoryForm.quantity}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, quantity: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Unit"
                value={inventoryForm.unit}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, unit: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Minimum Quantity"
                type="number"
                value={inventoryForm.minQuantity}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, minQuantity: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Maximum Quantity"
                type="number"
                value={inventoryForm.maxQuantity}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, maxQuantity: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              />
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={inventoryForm.unitPrice}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={inventoryForm.status}
                  label="Status"
                  onChange={(e) => setInventoryForm(prev => ({ ...prev, status: e.target.value as InventoryItem['status'] }))}
                  disabled={dialogMode === 'view'}
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="discontinued">Discontinued</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={inventoryForm.condition}
                  label="Condition"
                  onChange={(e) => setInventoryForm(prev => ({ ...prev, condition: e.target.value as InventoryItem['condition'] }))}
                  disabled={dialogMode === 'view'}
                  required
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={inventoryForm.assignedTo}
                  label="Assigned To"
                  onChange={(e) => setInventoryForm(prev => ({ ...prev, assignedTo: e.target.value }))}
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
                value={inventoryForm.location}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, location: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
                InputProps={{
                  startAdornment: <LocationIcon sx={{ color: 'action.active', mr: 1 }} />
                }}
              />
              <TextField
                fullWidth
                label="Supplier"
                value={inventoryForm.supplier}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, supplier: e.target.value }))}
                disabled={dialogMode === 'view'}
              />
              <TextField
                fullWidth
                label="Supplier Contact"
                value={inventoryForm.supplierContact}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, supplierContact: e.target.value }))}
                disabled={dialogMode === 'view'}
              />
              <TextField
                fullWidth
                label="Warranty Expiry"
                type="date"
                value={inventoryForm.warrantyExpiry}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={inventoryForm.tags}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, tags: e.target.value }))}
                disabled={dialogMode === 'view'}
                placeholder="laptop, premium, business"
              />
              <TextField
                fullWidth
                label="Notes"
                value={inventoryForm.notes}
                onChange={(e) => setInventoryForm(prev => ({ ...prev, notes: e.target.value }))}
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
              onClick={handleSaveItem}
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
            Are you sure you want to delete the inventory item <strong>&quot;{deleteConfirm.itemName}&quot;</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            This action cannot be undone. All item data will be permanently removed.
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
              if (deleteConfirm.itemId) {
                handleDeleteItem(deleteConfirm.itemId);
                setDeleteConfirm(prev => ({ ...prev, open: false }));
              }
            }}
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory; 