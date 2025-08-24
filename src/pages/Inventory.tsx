import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Snackbar,
  Pagination,
  Divider,
  Tooltip,
  Avatar,
  Badge,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  LinearProgress
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
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';

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
  assignedTo: string;
  assignedToName: string;
  assignedToEmail: string;
  location: string;
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  condition: 'new' | 'good' | 'fair' | 'poor';
  dateAdded: Date;
  lastUpdated: Date;
  lastAudit: Date;
  supplier: string;
  supplierContact: string;
  warrantyExpiry?: Date;
  tags: string[];
  notes: string;
}

interface InventoryFilters {
  search: string;
  category: string;
  status: string;
  condition: string;
  assignedTo: string;
  location: string;
}

const initialFilters: InventoryFilters = {
  search: '',
  category: '',
  status: '',
  condition: '',
  assignedTo: '',
  location: ''
};

const statusColors = {
  active: '#4caf50',
  inactive: '#9e9e9e',
  discontinued: '#f44336',
  out_of_stock: '#ff9800'
};

const conditionColors = {
  new: '#4caf50',
  good: '#2196f3',
  fair: '#ff9800',
  poor: '#f44336'
};

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Mock data for development
  const mockInventory: InventoryItem[] = [
    {
      id: '1',
      name: 'Laptop Dell XPS 13',
      category: 'Electronics',
      sku: 'LAP-DELL-XPS13-001',
      description: '13-inch premium laptop with Intel i7 processor',
      quantity: 15,
      minQuantity: 5,
      maxQuantity: 50,
      unit: 'pieces',
      unitPrice: 1299.99,
      totalValue: 19499.85,
      assignedTo: 'IT Department',
      assignedToName: 'John Smith',
      assignedToEmail: 'john.smith@company.com',
      location: 'Main Office - IT Storage',
      status: 'active',
      condition: 'new',
      dateAdded: new Date('2024-01-01'),
      lastUpdated: new Date('2024-01-15'),
      lastAudit: new Date('2024-01-10'),
      supplier: 'Dell Technologies',
      supplierContact: 'sales@dell.com',
      warrantyExpiry: new Date('2027-01-01'),
      tags: ['laptop', 'premium', 'business'],
      notes: 'High-performance laptops for senior staff'
    },
    {
      id: '2',
      name: 'Office Chair - Ergonomic',
      category: 'Furniture',
      sku: 'FUR-CHAIR-ERG-001',
      description: 'Ergonomic office chair with lumbar support',
      quantity: 8,
      minQuantity: 3,
      maxQuantity: 20,
      unit: 'pieces',
      unitPrice: 299.99,
      totalValue: 2399.92,
      assignedTo: 'HR Department',
      assignedToName: 'Sarah Johnson',
      assignedToEmail: 'sarah.johnson@company.com',
      location: 'Main Office - HR Storage',
      status: 'active',
      condition: 'good',
      dateAdded: new Date('2023-12-01'),
      lastUpdated: new Date('2024-01-10'),
      lastAudit: new Date('2024-01-05'),
      supplier: 'OfficeMax',
      supplierContact: 'orders@officemax.com',
      tags: ['chair', 'ergonomic', 'office'],
      notes: 'For new employee onboarding'
    },
    {
      id: '3',
      name: 'Network Switch 24-Port',
      category: 'Networking',
      sku: 'NET-SWITCH-24P-001',
      description: '24-port Gigabit Ethernet switch',
      quantity: 2,
      minQuantity: 1,
      maxQuantity: 10,
      unit: 'pieces',
      unitPrice: 199.99,
      totalValue: 399.98,
      assignedTo: 'IT Department',
      assignedToName: 'Mike Wilson',
      assignedToEmail: 'mike.wilson@company.com',
      location: 'Server Room',
      status: 'active',
      condition: 'new',
      dateAdded: new Date('2024-01-10'),
      lastUpdated: new Date('2024-01-10'),
      lastAudit: new Date('2024-01-10'),
      supplier: 'Cisco Systems',
      supplierContact: 'sales@cisco.com',
      warrantyExpiry: new Date('2029-01-10'),
      tags: ['switch', 'network', 'gigabit'],
      notes: 'Backup switch for network redundancy'
    },
    {
      id: '4',
      name: 'Coffee Machine - Commercial',
      category: 'Appliances',
      sku: 'APP-COFFEE-COM-001',
      description: 'Commercial coffee machine for office use',
      quantity: 0,
      minQuantity: 1,
      maxQuantity: 3,
      unit: 'pieces',
      unitPrice: 899.99,
      totalValue: 0,
      assignedTo: 'Facilities',
      assignedToName: 'Lisa Brown',
      assignedToEmail: 'lisa.brown@company.com',
      location: 'Break Room',
      status: 'out_of_stock',
      condition: 'good',
      dateAdded: new Date('2023-06-01'),
      lastUpdated: new Date('2024-01-12'),
      lastAudit: new Date('2024-01-12'),
      supplier: 'Coffee Solutions Inc',
      supplierContact: 'orders@coffeesolutions.com',
      tags: ['coffee', 'commercial', 'breakroom'],
      notes: 'Needs maintenance - out of order'
    }
  ];

  useEffect(() => {
    // Load mock data
    setInventory(mockInventory);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inventory, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...inventory];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.assignedToName.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.condition) {
      filtered = filtered.filter(item => item.condition === filters.condition);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(item => item.assignedTo === filters.assignedTo);
    }

    if (filters.location) {
      filtered = filtered.filter(item => item.location === filters.location);
    }

    setFilteredInventory(filtered);
    setCurrentPage(1);
  }, [inventory, filters]);

  const handleFilterChange = (field: keyof InventoryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateItem = () => {
    setSelectedItem(null);
    setIsViewMode(false);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewMode(false);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewMode(true);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
    setSnackbar({
      open: true,
      message: 'Inventory item deleted successfully',
      severity: 'success'
    });
  };

  const handleArchiveItem = (itemId: string) => {
    setInventory(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, status: 'inactive', lastUpdated: new Date() }
        : item
    ));
    setSnackbar({
      open: true,
      message: 'Inventory item archived successfully',
      severity: 'info'
    });
  };

  const handleSaveItem = (itemData: Partial<InventoryItem>) => {
    if (selectedItem && !isCreateMode) {
      // Update existing item
      setInventory(prev => prev.map(item =>
        item.id === selectedItem.id
          ? { ...item, ...itemData, lastUpdated: new Date() }
          : item
      ));
      setSnackbar({
        open: true,
        message: 'Inventory item updated successfully',
        severity: 'success'
      });
    } else {
      // Create new item
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: itemData.name || '',
        category: itemData.category || '',
        sku: itemData.sku || '',
        description: itemData.description || '',
        quantity: itemData.quantity || 0,
        minQuantity: itemData.minQuantity || 0,
        maxQuantity: itemData.maxQuantity || 100,
        unit: itemData.unit || 'pieces',
        unitPrice: itemData.unitPrice || 0,
        totalValue: (itemData.quantity || 0) * (itemData.unitPrice || 0),
        assignedTo: itemData.assignedTo || '',
        assignedToName: itemData.assignedToName || '',
        assignedToEmail: itemData.assignedToEmail || '',
        location: itemData.location || '',
        status: 'active',
        condition: 'new',
        dateAdded: new Date(),
        lastUpdated: new Date(),
        lastAudit: new Date(),
        supplier: itemData.supplier || '',
        supplierContact: itemData.supplierContact || '',
        tags: itemData.tags || [],
        notes: itemData.notes || ''
      };
      setInventory(prev => [newItem, ...prev]);
      setSnackbar({
        open: true,
        message: 'Inventory item created successfully',
        severity: 'success'
      });
    }
    setIsDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon color="success" />;
      case 'inactive':
        return <ArchiveIcon color="action" />;
      case 'discontinued':
        return <ErrorIcon color="error" />;
      case 'out_of_stock':
        return <WarningIcon color="warning" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'new':
        return <CheckCircleIcon color="success" />;
      case 'good':
        return <CheckCircleIcon color="primary" />;
      case 'fair':
        return <WarningIcon color="warning" />;
      case 'poor':
        return <ErrorIcon color="error" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getStockLevel = (item: InventoryItem) => {
    if (item.quantity === 0) return 'out_of_stock';
    if (item.quantity <= item.minQuantity) return 'low';
    if (item.quantity >= item.maxQuantity) return 'high';
    return 'normal';
  };

  const getStockLevelColor = (level: string) => {
    switch (level) {
      case 'out_of_stock':
        return '#f44336';
      case 'low':
        return '#ff9800';
      case 'high':
        return '#4caf50';
      default:
        return '#2196f3';
    }
  };

  const getUniqueCategories = () => {
    return [...new Set(inventory.map(item => item.category))];
  };

  const getUniqueLocations = () => {
    return [...new Set(inventory.map(item => item.location))];
  };

  const getUniqueAssignedTo = () => {
    return [...new Set(inventory.map(item => item.assignedTo))];
  };

  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Export functionality
              setSnackbar({
                open: true,
                message: 'Inventory exported successfully',
                severity: 'success'
              });
            }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateItem}
            sx={{ bgcolor: 'primary.main' }}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Items
            </Typography>
            <Typography variant="h4" component="div">
              {inventory.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Items
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {inventory.filter(item => item.status === 'active').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Value
            </Typography>
            <Typography variant="h4" component="div" color="primary.main">
              ${inventory.reduce((total, item) => total + item.totalValue, 0).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Low Stock Items
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {inventory.filter(item => item.quantity <= item.minQuantity).length}
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          <TextField
            fullWidth
            label="Search Inventory"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
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
              {getUniqueCategories().map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
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
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="discontinued">Discontinued</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Inventory Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInventory.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        SKU: {item.sku}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 200 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.category}
                      size="small"
                      variant="outlined"
                      icon={<CategoryIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {item.quantity} {item.unit}
                      </Typography>
                      <Box sx={{ width: '100%', maxWidth: 100, mt: 0.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(item.quantity / item.maxQuantity) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getStockLevelColor(getStockLevel(item))
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {getStockLevel(item).replace('_', ' ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      ${item.totalValue.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ${item.unitPrice} per {item.unit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.assignedToName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.assignedTo}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {item.location}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(item.status)}
                      <Chip
                        label={item.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: statusColors[item.status],
                          color: 'white',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewItem(item)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Item">
                        <IconButton
                          size="small"
                          onClick={() => handleEditItem(item)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {item.status !== 'inactive' && (
                        <Tooltip title="Archive Item">
                          <IconButton
                            size="small"
                            onClick={() => handleArchiveItem(item.id)}
                            color="default"
                          >
                            <ArchiveIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete Item">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(item.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Item Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon />
            <Typography variant="h6">
              {isViewMode ? 'Item Details' : isCreateMode ? 'Add New Item' : 'Edit Item'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>Item Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Name"
                        secondary={selectedItem.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="SKU"
                        secondary={selectedItem.sku}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Category"
                        secondary={selectedItem.category}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Description"
                        secondary={selectedItem.description}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={selectedItem.status.replace('_', ' ')}
                            size="small"
                            sx={{
                              bgcolor: statusColors[selectedItem.status],
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Stock Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Current Quantity"
                        secondary={`${selectedItem.quantity} ${selectedItem.unit}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Min Quantity"
                        secondary={selectedItem.minQuantity}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Max Quantity"
                        secondary={selectedItem.maxQuantity}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Unit Price"
                        secondary={`$${selectedItem.unitPrice}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Value"
                        secondary={`$${selectedItem.totalValue.toLocaleString()}`}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                  <Typography variant="h6" gutterBottom>Assignment Details</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Assigned To"
                        secondary={selectedItem.assignedToName}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Department"
                        secondary={selectedItem.assignedTo}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Location"
                        secondary={selectedItem.location}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Supplier"
                        secondary={selectedItem.supplier}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                  <Typography variant="h6" gutterBottom>Additional Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Date Added"
                        secondary={selectedItem.dateAdded.toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Last Updated"
                        secondary={selectedItem.lastUpdated.toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Last Audit"
                        secondary={selectedItem.lastAudit.toLocaleDateString()}
                      />
                    </ListItem>
                    {selectedItem.warrantyExpiry && (
                      <ListItem>
                        <ListItemText
                          primary="Warranty Expiry"
                          secondary={selectedItem.warrantyExpiry.toLocaleDateString()}
                        />
                      </ListItem>
                    )}
                    {selectedItem.tags.length > 0 && (
                      <ListItem>
                        <ListItemText
                          primary="Tags"
                          secondary={
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {selectedItem.tags.map((tag, index) => (
                                <Chip
                                  key={index}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          }
                        />
                      </ListItem>
                    )}
                    {selectedItem.notes && (
                      <ListItem>
                        <ListItemText
                          primary="Notes"
                          secondary={selectedItem.notes}
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventory; 