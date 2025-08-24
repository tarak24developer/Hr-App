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
  Avatar,
  Switch,
  FormControlLabel,
  useTheme,
  alpha
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

  // Sample data
  const sampleUsers: User[] = [
    {
      id: '1',
      email: 'john.doe@company.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'admin',
      department: 'IT',
      position: 'System Administrator',
      hireDate: '2023-01-15',
      status: 'active',
      avatar: null,
      phone: '+1 (555) 123-4567',
      address: '123 Main St, City, State 12345',
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1 (555) 987-6543',
        relationship: 'Spouse'
      },
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      isActive: true,
      lastLoginAt: '2024-01-15T09:30:00Z'
    },
    {
      id: '2',
      email: 'jane.smith@company.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'hr',
      department: 'Human Resources',
      position: 'HR Manager',
      hireDate: '2023-02-01',
      status: 'active',
      avatar: null,
      phone: '+1 (555) 234-5678',
      address: '456 Oak Ave, City, State 12345',
      emergencyContact: {
        name: 'John Smith',
        phone: '+1 (555) 876-5432',
        relationship: 'Spouse'
      },
      createdAt: '2023-02-01T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      isActive: true
    },
    {
      id: '3',
      email: 'mike.johnson@company.com',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'manager',
      department: 'Engineering',
      position: 'Engineering Manager',
      hireDate: '2023-03-10',
      status: 'active',
      avatar: null,
      phone: '+1 (555) 345-6789',
      address: '789 Pine St, City, State 12345',
      emergencyContact: {
        name: 'Sarah Johnson',
        phone: '+1 (555) 765-4321',
        relationship: 'Sister'
      },
      createdAt: '2023-03-10T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      isActive: true
    },
    {
      id: '4',
      email: 'sarah.wilson@company.com',
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'employee',
      department: 'Engineering',
      position: 'Software Engineer',
      hireDate: '2023-04-20',
      status: 'active',
      avatar: null,
      phone: '+1 (555) 456-7890',
      address: '321 Elm St, City, State 12345',
      emergencyContact: {
        name: 'Tom Wilson',
        phone: '+1 (555) 654-3210',
        relationship: 'Father'
      },
      createdAt: '2023-04-20T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      isActive: true
    }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(sampleUsers);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

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
        const newUser: User = {
          id: Date.now().toString(),
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
        
        setUsers(prev => [newUser, ...prev]);
        setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
        setShowCreateDialog(false);
      } else if (showEditDialog && selectedUser) {
        const updatedUser: User = {
          ...selectedUser,
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
        
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? updatedUser : user
        ));
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
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
      if (selectedUser) {
        setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
        setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
        setShowDeleteDialog(false);
        setSelectedUser(null);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' });
    }
  };

  const handleStatusToggle = async (userId: string) => {
    try {
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              status: user.status === 'active' ? 'inactive' : 'active',
              isActive: user.status !== 'active',
              updatedAt: new Date().toISOString()
            }
          : user
      ));
      setSnackbar({ 
        open: true, 
        message: 'User status updated successfully', 
        severity: 'success' 
      });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
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
              User Management
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
              Add User
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
                  <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {users.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ActiveIcon sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {users.filter(u => u.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AdminIcon sx={{ mr: 2, color: 'error.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {users.filter(u => u.role === 'admin').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Administrators
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ManagerIcon sx={{ mr: 2, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {users.filter(u => u.role === 'manager').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Managers
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
                sx={{ minWidth: 300 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
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
            </Box>
          </Paper>

          {/* Users Table */}
          <Paper>
            <TableContainer>
              <Table>
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
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{ mr: 2, bgcolor: 'primary.main' }}
                              src={user.avatar || undefined}
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
                              <IconButton size="small" onClick={() => handleViewClick(user)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit User">
                              <IconButton size="small" onClick={() => handleEditClick(user)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.status === 'active' ? 'Deactivate' : 'Activate'}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleStatusToggle(user.id)}
                                color={user.status === 'active' ? 'warning' : 'success'}
                              >
                                {user.status === 'active' ? <BlockIcon /> : <ActiveIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton size="small" onClick={() => handleDeleteClick(user)}>
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

                  <TextField
                    label="Department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    fullWidth
                    required
                  />
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
    </Container>
  );
};

export default Users;
