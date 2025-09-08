import React, { useState, useEffect, useCallback } from 'react';
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
  Avatar,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  InputAdornment,
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Work as EmployeeIcon,
  SupervisorAccount as ManagerIcon,
  Security as SecurityIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { User, UserRole } from '../types';
import userService from '../services/userService';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  phone: string;
  isActive: boolean;
}

const Users: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'employee',
    department: '',
    position: '',
    phone: '',
    isActive: true
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [processing, setProcessing] = useState(false);

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load users from Firebase
        const usersResult = await userService.getUsers();
        if (usersResult && usersResult.success && Array.isArray(usersResult.data)) {
          setUsers(usersResult.data);
        } else {
          console.warn('No users data received or request failed:', usersResult);
          setUsers([]);
        }

        // Load departments
        try {
          const departmentsResult = await userService.getDepartments();
          setDepartments(departmentsResult || []);
        } catch (err) {
          console.warn('Failed to load departments:', err);
          setDepartments([]);
        }

        // Load roles
        try {
          const rolesResult = await userService.getRoles();
          setRoles(rolesResult || ['admin', 'hr', 'manager', 'employee']);
        } catch (err) {
          console.warn('Failed to load roles:', err);
          setRoles(['admin', 'hr', 'manager', 'employee']);
        }

      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
        setSnackbar({
          open: true,
          message: 'Failed to load data from Firebase',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update filtered users when users or filters change
  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, roleFilter, statusFilter, departmentFilter]);

  const applyFilters = useCallback(() => {
    let filtered = [...users];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.department.toLowerCase().includes(searchLower) ||
        user.position.toLowerCase().includes(searchLower)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        (statusFilter === 'active' && user.status === 'active') ||
        (statusFilter === 'inactive' && user.status === 'inactive')
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(user => user.department === departmentFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, statusFilter, departmentFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersResult = await userService.getUsers();
      if (usersResult && usersResult.success && Array.isArray(usersResult.data)) {
        setUsers(usersResult.data);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setError('Failed to load users');
      setSnackbar({
        open: true,
        message: 'Failed to load users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadUsers();
    setSnackbar({
      open: true,
      message: 'Users refreshed successfully',
      severity: 'success'
    });
  };

  const handleCreateClick = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'employee',
      department: '',
      position: '',
      phone: '',
      isActive: true
    });
    setShowCreateDialog(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'employee',
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || '',
      isActive: user.status === 'active'
    });
    setShowEditDialog(true);
  };

  const handleViewClick = (user: User) => {
    setSelectedUser(user);
    setShowViewDialog(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleFormSubmit = async () => {
    try {
      setProcessing(true);
      
      if (showCreateDialog) {
        const userData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          position: formData.position,
          phone: formData.phone,
          hireDate: new Date().toISOString().split('T')[0],
          status: formData.isActive ? 'active' : 'inactive',
          avatar: null,
          address: '',
          emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: formData.isActive
        };
        
        const result = await userService.createUser(userData);
        if (result && result.success) {
          setUsers(prev => [result.data, ...prev]);
        setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
        setShowCreateDialog(false);
        } else {
          throw new Error(result?.error || 'Failed to create user');
        }
      } else if (showEditDialog && selectedUser) {
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          position: formData.position,
          phone: formData.phone,
          status: formData.isActive ? 'active' : 'inactive',
          isActive: formData.isActive,
          updatedAt: new Date().toISOString()
        };
        
        const result = await userService.updateUser(selectedUser.id, updateData);
        if (result && result.success) {
        setUsers(prev => prev.map(user => 
            user.id === selectedUser.id ? result.data : user
        ));
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
        setShowEditDialog(false);
        } else {
          throw new Error(result?.error || 'Failed to update user');
      }
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Operation failed', severity: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedUser) {
        const result = await userService.deleteUser(selectedUser.id);
        if (result && result.success) {
          setUsers(prev => prev.map(user => 
            user.id === selectedUser.id 
              ? { ...user, isActive: false, status: 'inactive' }
              : user
          ));
          setSnackbar({ open: true, message: 'User deactivated successfully', severity: 'success' });
        setShowDeleteDialog(false);
        setSelectedUser(null);
        } else {
          throw new Error(result?.error || 'Failed to delete user');
      }
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete user', severity: 'error' });
    }
  };

  const handleStatusToggle = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        const newStatus = !user.isActive;
        const result = await userService.updateUserStatus(userId, newStatus);
        if (result && result.success) {
          setUsers(prev => prev.map(u => 
            u.id === userId 
              ? { 
                  ...u, 
                  status: newStatus ? 'active' : 'inactive',
                  isActive: newStatus,
              updatedAt: new Date().toISOString()
            }
              : u
      ));
      setSnackbar({ 
        open: true, 
            message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`, 
        severity: 'success' 
      });
        } else {
          throw new Error(result?.error || 'Failed to update status');
        }
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to update status', severity: 'error' });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <AdminIcon color="error" />;
      case 'hr': return <SecurityIcon color="warning" />;
      case 'manager': return <ManagerIcon color="info" />;
      default: return <EmployeeIcon color="success" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'error';
      case 'hr': return 'warning';
      case 'manager': return 'info';
      default: return 'success';
    }
  };

  const handleExportUsers = () => {
    const csv = convertToCSV(filteredUsers);
    downloadCSV(csv, 'users.csv');
    setSnackbar({
      open: true,
      message: 'User data exported successfully',
      severity: 'success'
    });
  };

  const convertToCSV = (data: User[]): string => {
    const headers = [
      'S.No', 'First Name', 'Last Name', 'Email', 'Role', 'Department', 'Position', 
      'Phone', 'Status', 'Hire Date', 'Last Login', 'Created At'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map((user, index) => [
        index + 1,
        user.firstName,
        user.lastName,
        user.email,
        user.role,
        user.department,
        user.position,
        user.phone,
        user.status,
        user.hireDate,
        user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
        new Date(user.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');
    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Users...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
  return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadUsers}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Fade in timeout={300}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              User Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportUsers}
              >
                Export Users
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
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
              Add User
            </Button>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3, 
            mb: 3 
          }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                      Total Users
                    </Typography>
                <Typography variant="h4" component="div">
                  {users.length}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                      Active Users
                    </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {users.filter(u => u.isActive !== false).length}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                      Administrators
                    </Typography>
                <Typography variant="h4" component="div" color="error.main">
                  {users.filter(u => u.role === 'admin').length}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Departments
                    </Typography>
                <Typography variant="h4" component="div" color="primary.main">
                  {departments.length}
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
                label="Search Users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  {roles.map(role => (
                    <MenuItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentFilter}
                  label="Department"
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Users Table */}
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          {users.length === 0 ? 'No users found. Add your first user to get started.' : 'No users match the current filters.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {user.firstName} {user.lastName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(user.role || 'employee')}
                            label={(user.role || 'employee').toUpperCase()}
                            size="small"
                            color={getRoleColor(user.role || 'employee') as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{user.department || 'N/A'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.position || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{user.phone || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive !== false ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.isActive !== false ? 'success' : 'default'}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.lastLoginAt 
                              ? new Date(user.lastLoginAt).toLocaleDateString()
                              : 'Never'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleViewClick(user)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit User">
                              <IconButton size="small" onClick={() => handleEditClick(user)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.isActive !== false ? 'Deactivate' : 'Activate'}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleStatusToggle(user.id)}
                                color={user.isActive !== false ? 'warning' : 'success'}
                              >
                                {user.isActive !== false ? <BlockIcon /> : <ActiveIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton size="small" onClick={() => handleDeleteClick(user)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
              {showCreateDialog ? 'Create New User' : 'Edit User'}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    fullWidth
                    required
                  />
                </Box>

                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  fullWidth
                  required
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={formData.role}
                      label="Role"
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    >
                      <MenuItem value="admin">Administrator</MenuItem>
                      <MenuItem value="hr">HR</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="employee">Employee</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                    value={formData.department}
                      label="Department"
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    >
                      <MenuItem value="">Select Department</MenuItem>
                      {departments.map(dept => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    fullWidth
                    required
                  />

                  <TextField
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    fullWidth
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label="Active User"
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
                disabled={processing || !formData.firstName || !formData.lastName || !formData.email}
              >
                {processing ? <CircularProgress size={20} /> : (showCreateDialog ? 'Create' : 'Update')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>User Details</DialogTitle>
            <DialogContent>
              {selectedUser && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
                      src={selectedUser.avatar || undefined}
                    >
                      {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.email}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          icon={getRoleIcon(selectedUser.role || 'employee')}
                          label={(selectedUser.role || 'employee').toUpperCase()}
                          size="small"
                          color={getRoleColor(selectedUser.role || 'employee') as any}
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={selectedUser.status || 'inactive'}
                          size="small"
                          color={(selectedUser.status || 'inactive') === 'active' ? 'success' : 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Work Information</Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Department</Typography>
                          <Typography variant="body1">{selectedUser.department}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Position</Typography>
                          <Typography variant="body1">{selectedUser.position}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Hire Date</Typography>
                          <Typography variant="body1">
                            {new Date(selectedUser.hireDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography variant="body1">{selectedUser.phone}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Address</Typography>
                          <Typography variant="body1">{selectedUser.address}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Emergency Contact</Typography>
                          <Typography variant="body1">
                            {selectedUser.emergencyContact.name} ({selectedUser.emergencyContact.relationship})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedUser.emergencyContact.phone}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowViewDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
            <DialogTitle>Delete User</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete "{selectedUser?.firstName} {selectedUser?.lastName}"? 
                This action cannot be undone.
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
    </Box>
  );
};

export default Users;
