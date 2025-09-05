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
  Fade,
  TablePagination,
  Avatar,
  Switch,
  FormControlLabel
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
  Security as SecurityIcon
} from '@mui/icons-material';
import { User, UserRole } from '../types';
import firebaseService from '../services/firebaseService';

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [processing, setProcessing] = useState(false);



  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await firebaseService.getCollection('users');
      
      if (result?.success && result.data) {
        // Transform Firebase data to match User interface
        const transformedUsers: User[] = result.data.map((user: any) => ({
          id: user.id,
          email: user.email || '',
          firstName: user.firstName || user.name?.split(' ')[0] || '',
          lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          role: user.role || 'employee',
          department: user.department || '',
          position: user.position || user.jobTitle || '',
          hireDate: user.hireDate || user.createdAt || new Date().toISOString().split('T')[0],
          status: user.status || (user.isActive ? 'active' : 'inactive'),
          avatar: user.avatar || user.photoURL || null,
          phone: user.phone || user.phoneNumber || '',
          address: user.address || '',
          emergencyContact: user.emergencyContact || {
            name: '',
            phone: '',
            relationship: ''
          },
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString(),
          isActive: user.isActive !== false,
          lastLoginAt: user.lastLoginAt || user.lastSignInTime || null
        }));
        
        setUsers(transformedUsers);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.status === 'active') ||
      (statusFilter === 'inactive' && user.status === 'inactive');
    return matchesSearch && matchesRole && matchesStatus;
  });

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
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      position: user.position,
      phone: user.phone,
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
          isActive: formData.isActive,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const result = await firebaseService.addDocument('users', userData);
        
        if (result?.success) {
        setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
        setShowCreateDialog(false);
          loadUsers(); // Reload users from Firebase
        } else {
          throw new Error(result?.error || 'Failed to create user');
        }
      } else if (showEditDialog && selectedUser) {
        const userData = {
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
        
        const result = await firebaseService.updateDocument('users', selectedUser.id, userData);
        
        if (result?.success) {
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
        setShowEditDialog(false);
          loadUsers(); // Reload users from Firebase
        } else {
          throw new Error(result?.error || 'Failed to update user');
        }
      }
    } catch (err: any) {
      console.error('Error in form submission:', err);
      setSnackbar({ open: true, message: err.message || 'Operation failed', severity: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedUser) {
        const result = await firebaseService.deleteDocument('users', selectedUser.id);
        
        if (result?.success) {
        setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
        setShowDeleteDialog(false);
        setSelectedUser(null);
          loadUsers(); // Reload users from Firebase
        } else {
          throw new Error(result?.error || 'Failed to delete user');
        }
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to delete user', severity: 'error' });
    }
  };

  const handleStatusToggle = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const userData = {
        status: newStatus,
        isActive: newStatus === 'active',
              updatedAt: new Date().toISOString()
      };
      
      const result = await firebaseService.updateDocument('users', userId, userData);
      
      if (result?.success) {
      setSnackbar({ 
        open: true, 
        message: 'User status updated successfully', 
        severity: 'success' 
      });
        loadUsers(); // Reload users from Firebase
      } else {
        throw new Error(result?.error || 'Failed to update status');
      }
    } catch (err: any) {
      console.error('Error updating user status:', err);
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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        bgcolor: 'grey.50'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Loading Users...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Fade in timeout={300}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              User Management
            </Typography>
              <Typography variant="body1" color="textSecondary">
                Manage user accounts, roles, and permissions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: '600',
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Add User
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Statistics Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
            gap: 3, 
            mb: 4 
          }}>
            <Card sx={{ 
              p: 2.5, 
              bgcolor: 'white', 
              height: '100%', 
              minHeight: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.100',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                borderColor: 'primary.200'
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1.5
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        mb: 0.5
                      }}
                    >
                      Total Users
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: '700', 
                        color: 'primary.main',
                        lineHeight: 1.1
                      }}
                    >
                      {users.length}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'primary.50',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <PersonIcon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
              p: 2.5, 
              bgcolor: 'white', 
              height: '100%', 
              minHeight: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.100',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                borderColor: 'success.200'
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1.5
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        mb: 0.5
                      }}
                    >
                      Active Users
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: '700', 
                        color: 'success.main',
                        lineHeight: 1.1
                      }}
                    >
                      {users.filter(u => u.status === 'active').length}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'success.50',
                    color: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ActiveIcon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
              p: 2.5, 
              bgcolor: 'white', 
              height: '100%', 
              minHeight: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.100',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                borderColor: 'error.200'
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1.5
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        mb: 0.5
                      }}
                    >
                      Administrators
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: '700', 
                        color: 'error.main',
                        lineHeight: 1.1
                      }}
                    >
                      {users.filter(u => u.role === 'admin').length}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'error.50',
                    color: 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AdminIcon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
              p: 2.5, 
              bgcolor: 'white', 
              height: '100%', 
              minHeight: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.100',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                borderColor: 'warning.200'
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1.5
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        mb: 0.5
                      }}
                    >
                      Managers
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: '700', 
                        color: 'warning.main',
                        lineHeight: 1.1
                      }}
                    >
                      {users.filter(u => u.role === 'manager').length}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'warning.50',
                    color: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ManagerIcon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Filters */}
          <Card sx={{ 
            bgcolor: 'white', 
            boxShadow: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                Filters & Search
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
                gap: 2, 
                alignItems: 'center' 
              }}>
              <TextField
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                  size="medium"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />
                
                <FormControl size="medium">
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </Select>
              </FormControl>

                <FormControl size="medium">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card sx={{ 
            bgcolor: 'white', 
            boxShadow: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Last Login</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow 
                        key={user.id} 
                        hover
                        sx={{ 
                          '&:hover': { 
                            bgcolor: 'primary.50' 
                          },
                          '&:nth-of-type(even)': {
                            bgcolor: 'grey.25'
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{ mr: 2, bgcolor: 'primary.main' }}
                              src={user.avatar || ''}
                            >
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {user.firstName} {user.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={user.role.toUpperCase()}
                            size="small"
                            color={getRoleColor(user.role) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{user.department}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.position}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{user.phone}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            size="small"
                            color={user.status === 'active' ? 'success' : 'default'}
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
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewClick(user)}
                                sx={{ 
                                  color: 'primary.main',
                                  '&:hover': { 
                                    bgcolor: 'primary.50',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit User">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditClick(user)}
                                sx={{ 
                                  color: 'info.main',
                                  '&:hover': { 
                                    bgcolor: 'info.50',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleStatusToggle(user.id)}
                                sx={{ 
                                  color: user.status === 'active' ? 'warning.main' : 'success.main',
                                  '&:hover': { 
                                    bgcolor: user.status === 'active' ? 'warning.50' : 'success.50',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {user.status === 'active' ? <BlockIcon /> : <ActiveIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteClick(user)}
                                sx={{ 
                                  color: 'error.main',
                                  '&:hover': { 
                                    bgcolor: 'error.50',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
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
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid',
                borderColor: 'grey.200',
                bgcolor: 'grey.50'
              }}
            />
          </Card>

          {/* Create/Edit Dialog */}
          <Dialog 
            open={showCreateDialog || showEditDialog} 
            onClose={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
            }} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: 'grey.200'
              }
            }}
          >
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              {showCreateDialog ? 'Create New User' : 'Edit User'}
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    fullWidth
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    fullWidth
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />
                </Box>

                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={formData.role}
                      label="Role"
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'grey.300'
                        }
                      }}
                    >
                      <MenuItem value="admin">Administrator</MenuItem>
                      <MenuItem value="hr">HR</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="employee">Employee</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    fullWidth
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    fullWidth
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  />

                  <TextField
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
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
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                }}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: 'grey.400',
                  color: 'text.secondary',
                  fontWeight: '600',
                  '&:hover': {
                    borderColor: 'grey.600',
                    bgcolor: 'grey.50',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleFormSubmit}
                disabled={processing || !formData.firstName || !formData.lastName || !formData.email}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: '600',
                  bgcolor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease',
                  '&:disabled': {
                    bgcolor: 'grey.400',
                    boxShadow: 'none'
                  }
                }}
              >
                {processing ? <CircularProgress size={20} /> : (showCreateDialog ? 'Create' : 'Update')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Dialog */}
          <Dialog 
            open={showViewDialog} 
            onClose={() => setShowViewDialog(false)} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: 'grey.200'
              }
            }}
          >
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              User Details
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              {selectedUser && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
                      src={selectedUser.avatar || ''}
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
                          icon={getRoleIcon(selectedUser.role)}
                          label={selectedUser.role.toUpperCase()}
                          size="small"
                          color={getRoleColor(selectedUser.role) as any}
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={selectedUser.status}
                          size="small"
                          color={selectedUser.status === 'active' ? 'success' : 'default'}
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
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setShowViewDialog(false)}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: '600',
                  '&:hover': {
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog 
            open={showDeleteDialog} 
            onClose={() => setShowDeleteDialog(false)}
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: 'grey.200'
              }
            }}
          >
            <DialogTitle sx={{ 
              bgcolor: 'error.main', 
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              Delete User
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                Are you sure you want to delete <strong>&quot;{selectedUser?.firstName} {selectedUser?.lastName}&quot;</strong>? 
                <br />
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                This action cannot be undone.
                </Typography>
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={() => setShowDeleteDialog(false)}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: 'grey.400',
                  color: 'text.secondary',
                  fontWeight: '600',
                  '&:hover': {
                    borderColor: 'grey.600',
                    bgcolor: 'grey.50',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDelete}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(211, 47, 47, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
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
