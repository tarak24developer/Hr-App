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
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import { showNotification } from '../utils/notification';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  budgetLimit: number;
}

interface ExpenseNote {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  isInternal: boolean;
}

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  priority: 'low' | 'medium' | 'high';
  employeeId: string;
  managerId: string;
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

const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    department: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'INR',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    employeeId: '',
    managerId: '',
    department: '',
    expenseDate: '',
    isReimbursable: false,
    reimbursementAmount: ''
  });

  // Firebase integration functions
  const fetchExpenses = async () => {
    try {
      setExpensesLoading(true);
      const result = await firebaseService.getCollection('expenses');
      if (result.success) {
        setExpenses(result.data as Expense[] || []);
      } else {
        showNotification('Failed to fetch expenses', 'error');
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showNotification('Error fetching expenses', 'error');
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const result = await firebaseService.getCollection('expenseCategories');
      if (result.success) {
        setCategories(result.data as ExpenseCategory[] || []);
      } else {
        showNotification('Failed to fetch categories', 'error');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('Error fetching categories', 'error');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
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
    fetchExpenses();
    fetchCategories();
    fetchUsers();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                         expense.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = !filters.category || expense.category === filters.category;
    const matchesStatus = !filters.status || expense.status === filters.status;
    const matchesDepartment = !filters.department || expense.department === filters.department;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesDepartment;
  });

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getTotalExpenses = () => {
    return expenses.reduce((total, exp) => total + exp.amount, 0);
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', expense?: Expense) => {
    setDialogMode(mode);
    if (expense) {
      setSelectedExpense(expense);
      setExpenseForm({
        title: expense.title,
        description: expense.description,
        amount: expense.amount.toString(),
        currency: expense.currency,
        category: expense.category,
        priority: expense.priority,
        employeeId: expense.employeeId,
        managerId: expense.managerId || '',
        department: expense.department,
        expenseDate: expense.expenseDate.toISOString().split('T')[0],
        isReimbursable: expense.isReimbursable,
        reimbursementAmount: expense.reimbursementAmount?.toString() || ''
      });
    } else {
      setSelectedExpense(null);
      setExpenseForm({
        title: '',
        description: '',
        amount: '',
        currency: 'INR',
        category: '',
        priority: 'medium',
        employeeId: '',
        managerId: '',
        department: '',
        expenseDate: '',
        isReimbursable: false,
        reimbursementAmount: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedExpense(null);
          setExpenseForm({
        title: '',
        description: '',
        amount: '',
        currency: 'INR',
        category: '',
        priority: 'medium',
        employeeId: '',
        managerId: '',
        department: '',
        expenseDate: '',
        isReimbursable: false,
        reimbursementAmount: ''
      });
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.category || !expenseForm.employeeId) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        reimbursementAmount: expenseForm.reimbursementAmount ? parseFloat(expenseForm.reimbursementAmount) : undefined,
        expenseDate: new Date(expenseForm.expenseDate),
        submittedAt: new Date(),
        status: 'pending' as const,
        attachments: [],
        tags: [],
        notes: [],
        managerId: expenseForm.managerId || expenseForm.employeeId
      };

      if (dialogMode === 'add') {
        const result = await firebaseService.addDocument('expenses', expenseData);
        if (result.success) {
          showNotification('Expense added successfully!', 'success');
          fetchExpenses();
        } else {
          showNotification('Failed to add expense', 'error');
        }
      } else if (dialogMode === 'edit' && selectedExpense) {
        const result = await firebaseService.updateDocument('expenses', selectedExpense.id, expenseData);
        if (result.success) {
          showNotification('Expense updated successfully!', 'success');
          fetchExpenses();
        } else {
          showNotification('Failed to update expense', 'error');
        }
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving expense:', error);
      showNotification('Error saving expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const result = await firebaseService.deleteDocument('expenses', expenseId);
        if (result.success) {
          showNotification('Expense deleted successfully!', 'success');
          fetchExpenses();
        } else {
          showNotification('Failed to delete expense', 'error');
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        showNotification('Error deleting expense', 'error');
      }
    }
  };

  const handleStatusChange = async (expenseId: string, newStatus: string) => {
    try {
      const updateData = {
        status: newStatus,
        ...(newStatus === 'approved' && { approvedAt: new Date() }),
        ...(newStatus === 'paid' && { paidAt: new Date() })
      };

      const result = await firebaseService.updateDocument('expenses', expenseId, updateData);
      if (result.success) {
        showNotification(`Expense status updated to ${newStatus}`, 'success');
        fetchExpenses();
      } else {
        showNotification('Failed to update expense status', 'error');
      }
    } catch (error) {
      console.error('Error updating expense status:', error);
      showNotification('Error updating expense status', 'error');
    }
  };

  if (expensesLoading || categoriesLoading || usersLoading) {
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
          Expense Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
        >
          Add Expense
        </Button>
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
              Total Expenses
            </Typography>
            <Typography variant="h4" component="div">
              {formatCurrency(getTotalExpenses(), 'INR')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {expenses.length} expenses
            </Typography>
          </CardContent>
        </Card>
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
                'INR'
              )}
            </Typography>
          </CardContent>
        </Card>
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
                'INR'
              )}
            </Typography>
          </CardContent>
        </Card>
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
                'INR'
              )}
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
              {categories.map(category => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
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
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
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
        </Box>
      </Paper>

      {/* Expenses Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedExpenses.map((expense) => {
                const employee = users.find(u => u.id === expense.employeeId);
                return (
                  <TableRow key={expense.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {expense.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
                          {expense.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {formatCurrency(expense.amount, expense.currency)}
                      </Typography>
                      {expense.isReimbursable && expense.reimbursementAmount && (
                        <Typography variant="caption" color="success.main">
                          Reimbursable: {formatCurrency(expense.reimbursementAmount, expense.currency)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={expense.category}
                        size="small"
                        sx={{ backgroundColor: categories.find(c => c.name === expense.category)?.color || '#ccc' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={expense.status}
                        size="small"
                        color={
                          expense.status === 'approved' ? 'success' :
                          expense.status === 'rejected' ? 'error' :
                          expense.status === 'paid' ? 'primary' : 'warning'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {employee?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {employee?.department || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {expense.department}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {expense.expenseDate.toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('view', expense)}
                            color="info"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Expense">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', expense)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={expense.status}
                            onChange={(e) => handleStatusChange(expense.id, e.target.value)}
                            size="small"
                          >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                            <MenuItem value="paid">Paid</MenuItem>
                          </Select>
                        </FormControl>
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredExpenses.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No expenses found matching your criteria
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Pagination */}
      {filteredExpenses.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(filteredExpenses.length / rowsPerPage)}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* Add/Edit/View Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Expense' :
           dialogMode === 'edit' ? 'Edit Expense' : 'View Expense Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
              disabled={dialogMode === 'view'}
              required
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              disabled={dialogMode === 'view'}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              disabled={dialogMode === 'view'}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={expenseForm.category}
                label="Category"
                onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              >
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                value={expenseForm.employeeId}
                label="Employee"
                onChange={(e) => setExpenseForm(prev => ({ ...prev, employeeId: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              >
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} - {user.department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Manager</InputLabel>
              <Select
                value={expenseForm.managerId}
                label="Manager"
                onChange={(e) => setExpenseForm(prev => ({ ...prev, managerId: e.target.value }))}
                disabled={dialogMode === 'view'}
              >
                <MenuItem value="">No Manager</MenuItem>
                {users.filter(user => user.role === 'manager' || user.role === 'admin').map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} - {user.department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={expenseForm.department}
                label="Department"
                onChange={(e) => setExpenseForm(prev => ({ ...prev, department: e.target.value }))}
                disabled={dialogMode === 'view'}
                required
              >
                {Array.from(new Set(users.map(user => user.department))).map(dept => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Expense Date"
              type="date"
              value={expenseForm.expenseDate}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
              disabled={dialogMode === 'view'}
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={expenseForm.priority}
                label="Priority"
                onChange={(e) => setExpenseForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                disabled={dialogMode === 'view'}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={expenseForm.currency}
                label="Currency"
                onChange={(e) => setExpenseForm(prev => ({ ...prev, currency: e.target.value }))}
                disabled={dialogMode === 'view'}
              >
                <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                <MenuItem value="USD">US Dollar ($)</MenuItem>
                <MenuItem value="EUR">Euro (€)</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl>
                <InputLabel>Reimbursable</InputLabel>
                <Select
                  value={expenseForm.isReimbursable ? 'yes' : 'no'}
                  label="Reimbursable"
                  onChange={(e) => setExpenseForm(prev => ({ 
                    ...prev, 
                    isReimbursable: e.target.value === 'yes',
                    reimbursementAmount: e.target.value === 'no' ? '' : prev.reimbursementAmount
                  }))}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </Select>
              </FormControl>
              {expenseForm.isReimbursable && (
                <TextField
                  fullWidth
                  label="Reimbursement Amount"
                  type="number"
                  value={expenseForm.reimbursementAmount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, reimbursementAmount: e.target.value }))}
                  disabled={dialogMode === 'view'}
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleSaveExpense}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseManagement;
