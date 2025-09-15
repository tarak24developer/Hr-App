import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Receipt,
  AlertCircle,
  Calendar,
  User,
  Building,
  Download,
  User as UserIcon,
  Badge,
  Calendar as CalendarIcon,
  Clock as ClockIcon
} from 'lucide-react';
import { cn } from '../utils/cn';
import firebaseService from '../services/firebaseService';
import { showNotification } from '../utils/notification';
import DashboardCard from '../components/DashboardCard';

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
  const [showFilters, setShowFilters] = useState(false);

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
        expenseDate: expense.expenseDate ? expense.expenseDate.toISOString().split('T')[0] ?? '' : '',
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

  // Loading state
  if (expensesLoading || categoriesLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expense data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600">Manage employee expenses and reimbursements</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={() => handleOpenDialog('add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
          <button 
            onClick={() => {/* Export functionality */}}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          name="Total Expenses"
          value={formatCurrency(getTotalExpenses(), 'INR')}
          icon={DollarSign}
          color="blue"
        />
        <DashboardCard
          name="Pending Approval"
          value={getPendingExpenses().length}
          icon={Clock}
          color="yellow"
        />
        <DashboardCard
          name="Approved"
          value={getApprovedExpenses().length}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          name="Rejected"
          value={getRejectedExpenses().length}
          icon={X}
          color="red"
        />
      </div>

      {/* Search and Filters */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              
              {(filters.category || filters.status || filters.department) && (
                <button
                  onClick={() => setFilters({ search: '', category: '', status: '', department: '' })}
                  className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Departments</option>
                    {Array.from(new Set(users.map(user => user.department))).map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expenses Table */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedExpenses.map((expense) => {
                  const employee = users.find(u => u.id === expense.employeeId);
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{expense.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(expense.amount, expense.currency)}
                        </div>
                        {expense.isReimbursable && expense.reimbursementAmount && (
                          <div className="text-sm text-green-600">
                            Reimbursable: {formatCurrency(expense.reimbursementAmount, expense.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ 
                            backgroundColor: categories.find(c => c.name === expense.category)?.color || '#6b7280' 
                          }}
                        >
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                          expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                          expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          expense.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        )}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employee?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{employee?.department || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">{expense.department}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {expense.expenseDate.toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenDialog('view', expense)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDialog('edit', expense)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <select
                            value={expense.status}
                            onChange={(e) => handleStatusChange(expense.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="paid">Paid</option>
                          </select>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredExpenses.length === 0 && expenses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
          <p className="text-gray-500">Try adjusting your search or filter parameters</p>
        </div>
      )}

      {/* Empty State */}
      {expenses.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Expenses Yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first expense to get started with expense management</p>
          <button
            onClick={() => handleOpenDialog('add')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Expense</span>
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredExpenses.length > rowsPerPage && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.ceil(filteredExpenses.length / rowsPerPage) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg",
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                )}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(Math.ceil(filteredExpenses.length / rowsPerPage), currentPage + 1))}
              disabled={currentPage === Math.ceil(filteredExpenses.length / rowsPerPage)}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit/View Modal */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseDialog}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {dialogMode === 'view' ? (
              // View Mode - grouped sections, read-only
              <div className="p-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                      <Eye className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Expense Details</h3>
                  </div>
                  <button
                    onClick={handleCloseDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Expense Details Content */}
                <div className="space-y-6">
                  {/* Expense Header */}
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <Receipt className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">{expenseForm.title}</h4>
                      <p className="text-gray-600">{expenseForm.category}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          expenseForm.priority === 'high' ? "bg-red-100 text-red-800" :
                          expenseForm.priority === 'medium' ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        )}>
                          {expenseForm.priority.charAt(0).toUpperCase() + expenseForm.priority.slice(1)} Priority
                        </span>
                        <span className="text-sm text-gray-500">{expenseForm.department}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {expenseForm.currency === 'INR' ? '₹' : expenseForm.currency === 'USD' ? '$' : '€'}{expenseForm.amount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Information</h5>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Receipt className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Title</p>
                            <p className="text-sm text-gray-600">{expenseForm.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Amount</p>
                            <p className="text-sm text-gray-600">
                              {expenseForm.currency === 'INR' ? '₹' : expenseForm.currency === 'USD' ? '$' : '€'}{expenseForm.amount}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Badge className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Category</p>
                            <p className="text-sm text-gray-600">{expenseForm.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Building className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Department</p>
                            <p className="text-sm text-gray-600">{expenseForm.department}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Employee & Date Information */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Employee & Date Information</h5>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Employee</p>
                            <p className="text-sm text-gray-600">
                              {users.find(u => u.id === expenseForm.employeeId)?.name || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CalendarIcon className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Expense Date</p>
                            <p className="text-sm text-gray-600">{expenseForm.expenseDate || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <ClockIcon className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Priority</p>
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                              expenseForm.priority === 'high' ? "bg-red-100 text-red-800" :
                              expenseForm.priority === 'medium' ? "bg-yellow-100 text-yellow-800" :
                              "bg-green-100 text-green-800"
                            )}>
                              {expenseForm.priority.charAt(0).toUpperCase() + expenseForm.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Reimbursable</p>
                            <p className="text-sm text-gray-600">{expenseForm.isReimbursable ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Description</h5>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900">{expenseForm.description || '—'}</p>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {expenseForm.isReimbursable && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Reimbursement Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-500">Reimbursement Amount</span>
                            <span className="text-sm text-gray-900">
                              {expenseForm.currency === 'INR' ? '₹' : expenseForm.currency === 'USD' ? '$' : '€'}{expenseForm.reimbursementAmount || '0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                  <button
                    onClick={handleCloseDialog}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Add/Edit Mode - Original Design
              <>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                {dialogMode === 'add' && <Plus className="w-5 h-5" />}
                {dialogMode === 'edit' && <Edit className="w-5 h-5" />}
                <span>
                      {dialogMode === 'add' ? 'Add New Expense' : 'Edit Expense'}
                </span>
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    disabled={false}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <select
                    value={expenseForm.employeeId}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                  <select
                    value={expenseForm.managerId}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, managerId: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Manager</option>
                    {users.filter(user => user.role === 'manager' || user.role === 'admin').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={expenseForm.department}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, department: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {Array.from(new Set(users.map(user => user.department))).map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={expenseForm.priority}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={expenseForm.currency}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, currency: e.target.value }))}
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reimbursable"
                        checked={expenseForm.isReimbursable}
                        onChange={(e) => setExpenseForm(prev => ({ 
                          ...prev, 
                          isReimbursable: e.target.checked,
                          reimbursementAmount: e.target.checked ? prev.reimbursementAmount : ''
                        }))}
                        disabled={false}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="reimbursable" className="ml-2 text-sm font-medium text-gray-700">
                        Reimbursable
                      </label>
                    </div>
                    
                    {expenseForm.isReimbursable && (
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reimbursement Amount</label>
                        <input
                          type="number"
                          value={expenseForm.reimbursementAmount}
                          onChange={(e) => setExpenseForm(prev => ({ ...prev, reimbursementAmount: e.target.value }))}
                          disabled={false}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                    Cancel
              </button>
                <button
                  onClick={handleSaveExpense}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>Save</span>
                </button>
                </div>
              </>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;