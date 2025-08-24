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
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Pagination,
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
  Avatar,
  Badge,
  InputAdornment,
  OutlinedInput
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useDataService } from '../hooks/useDataService';

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  employeeId: string;
  managerId?: string;
  department: string;
  expenseDate: Date;
  submittedAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  receiptUrl?: string;
  attachments: string[];
  tags: string[];
  notes: ExpenseNote[];
  isReimbursable: boolean;
  reimbursementAmount?: number;
}

interface ExpenseNote {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  isInternal: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  budgetLimit?: number;
}

interface ExpenseFilters {
  search: string;
  category: string;
  status: string;
  priority: string;
  department: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  amountRange: {
    min: number | null;
    max: number | null;
  };
  employee: string;
}

const initialFilters: ExpenseFilters = {
  search: '',
  category: '',
  status: '',
  priority: '',
  department: '',
  dateRange: {
    start: null,
    end: null
  },
  amountRange: {
    min: null,
    max: null
  },
  employee: ''
};

const statusColors = {
  pending: '#ff9800',
  approved: '#4caf50',
  rejected: '#f44336',
  paid: '#2196f3'
};

const priorityColors = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  urgent: '#9c27b0'
};

const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
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
  const mockCategories: ExpenseCategory[] = [
    { id: '1', name: 'Travel', description: 'Business travel expenses', color: '#2196f3', budgetLimit: 5000 },
    { id: '2', name: 'Meals', description: 'Business meals and entertainment', color: '#4caf50', budgetLimit: 1000 },
    { id: '3', name: 'Office Supplies', description: 'Office equipment and supplies', color: '#ff9800', budgetLimit: 2000 },
    { id: '4', name: 'Software', description: 'Software licenses and subscriptions', color: '#9c27b0', budgetLimit: 3000 },
    { id: '5', name: 'Training', description: 'Professional development and training', color: '#607d8b', budgetLimit: 1500 }
  ];

  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Manager', department: 'IT' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Employee', department: 'Marketing' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Employee', department: 'Sales' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Manager', department: 'HR' }
  ];

  const mockExpenses: Expense[] = [
    {
      id: '1',
      title: 'Business Trip to Conference',
      description: 'Flight and hotel for annual tech conference',
      amount: 1200.00,
      currency: 'USD',
      category: 'Travel',
      status: 'approved',
      priority: 'medium',
      employeeId: '2',
      managerId: '1',
      department: 'Marketing',
      expenseDate: new Date('2024-01-20'),
      submittedAt: new Date('2024-01-15T10:30:00'),
      approvedAt: new Date('2024-01-16T14:20:00'),
      receiptUrl: 'receipts/flight_hotel.pdf',
      attachments: ['flight_receipt.pdf', 'hotel_receipt.pdf'],
      tags: ['travel', 'conference', 'approved'],
      notes: [
        {
          id: '1',
          content: 'Approved for annual tech conference attendance',
          authorId: '1',
          createdAt: new Date('2024-01-16T14:20:00'),
          isInternal: true
        }
      ],
      isReimbursable: true,
      reimbursementAmount: 1200.00
    },
    {
      id: '2',
      title: 'Office Supplies Purchase',
      description: 'New printer cartridges and paper supplies',
      amount: 85.50,
      currency: 'USD',
      category: 'Office Supplies',
      status: 'pending',
      priority: 'low',
      employeeId: '3',
      managerId: '4',
      department: 'Sales',
      expenseDate: new Date('2024-01-18'),
      submittedAt: new Date('2024-01-19T16:45:00'),
      receiptUrl: 'receipts/office_supplies.pdf',
      attachments: ['receipt.pdf'],
      tags: ['supplies', 'office', 'pending'],
      notes: [],
      isReimbursable: false
    },
    {
      id: '3',
      title: 'Software License Renewal',
      description: 'Annual renewal for design software subscription',
      amount: 450.00,
      currency: 'USD',
      category: 'Software',
      status: 'paid',
      priority: 'high',
      employeeId: '2',
      managerId: '1',
      department: 'Marketing',
      expenseDate: new Date('2024-01-10'),
      submittedAt: new Date('2024-01-08T09:15:00'),
      approvedAt: new Date('2024-01-09T11:30:00'),
      paidAt: new Date('2024-01-10T10:00:00'),
      receiptUrl: 'receipts/software_license.pdf',
      attachments: ['license_receipt.pdf'],
      tags: ['software', 'subscription', 'paid'],
      notes: [
        {
          id: '2',
          content: 'Payment processed successfully',
          authorId: '1',
          createdAt: new Date('2024-01-10T10:00:00'),
          isInternal: true
        }
      ],
      isReimbursable: false
    }
  ];

  useEffect(() => {
    // Load mock data
    setCategories(mockCategories);
    setUsers(mockUsers);
    setExpenses(mockExpenses);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...expenses];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.title.toLowerCase().includes(searchLower) ||
        expense.description.toLowerCase().includes(searchLower) ||
        expense.department.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(expense => expense.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(expense => expense.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(expense => expense.priority === filters.priority);
    }

    if (filters.department) {
      filtered = filtered.filter(expense => expense.department === filters.department);
    }

    if (filters.employee) {
      filtered = filtered.filter(expense => expense.employeeId === filters.employee);
    }

    if (filters.amountRange.min !== null) {
      filtered = filtered.filter(expense => expense.amount >= filters.amountRange.min!);
    }

    if (filters.amountRange.max !== null) {
      filtered = filtered.filter(expense => expense.amount <= filters.amountRange.max!);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(expense => expense.expenseDate >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(expense => expense.expenseDate <= filters.dateRange.end!);
    }

    setFilteredExpenses(filtered);
    setCurrentPage(1);
  }, [expenses, filters]);

  const handleFilterChange = (field: keyof ExpenseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateExpense = () => {
    setSelectedExpense(null);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
    setSnackbar({
      open: true,
      message: 'Expense deleted successfully',
      severity: 'success'
    });
  };

  const handleApproveExpense = (expenseId: string) => {
    setExpenses(prev => prev.map(exp =>
      exp.id === expenseId
        ? { ...exp, status: 'approved', approvedAt: new Date() }
        : exp
    ));
    setSnackbar({
      open: true,
      message: 'Expense approved successfully',
      severity: 'success'
    });
  };

  const handleRejectExpense = (expenseId: string) => {
    setExpenses(prev => prev.map(exp =>
      exp.id === expenseId
        ? { ...exp, status: 'rejected' }
        : exp
    ));
    setSnackbar({
      open: true,
      message: 'Expense rejected',
      severity: 'warning'
    });
  };

  const handleSaveExpense = (expenseData: Partial<Expense>) => {
    if (selectedExpense) {
      // Update existing expense
      setExpenses(prev => prev.map(exp =>
        exp.id === selectedExpense.id
          ? { ...exp, ...expenseData }
          : exp
      ));
      setSnackbar({
        open: true,
        message: 'Expense updated successfully',
        severity: 'success'
      });
    } else {
      // Create new expense
      const newExpense: Expense = {
        id: Date.now().toString(),
        title: expenseData.title || '',
        description: expenseData.description || '',
        amount: expenseData.amount || 0,
        currency: expenseData.currency || 'USD',
        category: expenseData.category || '',
        status: 'pending',
        priority: expenseData.priority || 'medium',
        employeeId: '2', // Current user ID
        department: expenseData.department || '',
        expenseDate: expenseData.expenseDate || new Date(),
        submittedAt: new Date(),
        attachments: expenseData.attachments || [],
        tags: expenseData.tags || [],
        notes: [],
        isReimbursable: expenseData.isReimbursable || false
      };
      setExpenses(prev => [newExpense, ...prev]);
      setSnackbar({
        open: true,
        message: 'Expense created successfully',
        severity: 'success'
      });
    }
    setIsDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      case 'paid':
        return <CheckCircleIcon color="primary" />;
      default:
        return <PendingIcon />;
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category ? category.color : '#9e9e9e';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getPendingExpenses = () => {
    return expenses.filter(exp => exp.status === 'pending');
  };

  const getApprovedExpenses = () => {
    return expenses.filter(exp => exp.status === 'approved');
  };

  const getRejectedExpenses = () => {
    return expenses.filter(exp => exp.status === 'rejected');
  };

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Expense Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateExpense}
          sx={{ bgcolor: 'primary.main' }}
        >
          Create Expense
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" component="div">
                {formatCurrency(getTotalExpenses(), 'USD')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {expenses.length} expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Approval
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {getPendingExpenses().length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {formatCurrency(
                  getPendingExpenses().reduce((total, exp) => total + exp.amount, 0),
                  'USD'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {getApprovedExpenses().length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {formatCurrency(
                  getApprovedExpenses().reduce((total, exp) => total + exp.amount, 0),
                  'USD'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4" component="div" color="error">
                {getRejectedExpenses().length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {formatCurrency(
                  getRejectedExpenses().reduce((total, exp) => total + exp.amount, 0),
                  'USD'
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label="Department"
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Expenses Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedExpenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {expense.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 200 }}>
                        {expense.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={expense.category}
                      size="small"
                      sx={{
                        bgcolor: getCategoryColor(expense.category),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(expense.amount, expense.currency)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(expense.status)}
                      <Chip
                        label={expense.status}
                        size="small"
                        sx={{
                          bgcolor: statusColors[expense.status],
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={expense.priority}
                      size="small"
                      sx={{
                        bgcolor: priorityColors[expense.priority],
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body2">
                        {getUserName(expense.employeeId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {expense.department}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {expense.expenseDate.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewExpense(expense)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Expense">
                        <IconButton
                          size="small"
                          onClick={() => handleEditExpense(expense)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {expense.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              onClick={() => handleApproveExpense(expense.id)}
                              color="success"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              onClick={() => handleRejectExpense(expense.id)}
                              color="error"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete Expense">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteExpense(expense.id)}
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

export default ExpenseManagement;
