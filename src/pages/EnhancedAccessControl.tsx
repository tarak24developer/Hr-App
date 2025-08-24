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
  Alert,
  Snackbar,
  Pagination,
  Tooltip,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  AdminPanelSettings as AdminIcon,
  VpnKey as KeyIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  priority: number;
  userCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  isLocked: boolean;
}

interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  type: 'allow' | 'deny' | 'conditional';
  priority: number;
  isActive: boolean;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  path: string;
  permissions: string[];
  isProtected: boolean;
}

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  success: boolean;
}

interface AccessControlFilters {
  search: string;
  type: string;
  status: string;
  category: string;
}

const initialFilters: AccessControlFilters = {
  search: '',
  type: '',
  status: '',
  category: ''
};

const EnhancedAccessControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [accessPolicies, setAccessPolicies] = useState<AccessPolicy[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [filters, setFilters] = useState<AccessControlFilters>(initialFilters);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Mock data
  const mockPermissions: Permission[] = [
    {
      id: '1',
      name: 'user.read',
      description: 'Read user information',
      resource: 'users',
      action: 'read',
      category: 'User Management',
      isActive: true
    },
    {
      id: '2',
      name: 'user.write',
      description: 'Create and update users',
      resource: 'users',
      action: 'write',
      category: 'User Management',
      isActive: true
    }
  ];

  const mockRoles: Role[] = [
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access',
      permissions: ['1', '2'],
      isSystem: true,
      isActive: true,
      priority: 1,
      userCount: 2
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Department manager',
      permissions: ['1'],
      isSystem: false,
      isActive: true,
      priority: 2,
      userCount: 5
    }
  ];

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Admin',
      email: 'admin@example.com',
      roles: ['1'],
      permissions: ['1', '2'],
      isActive: true,
      lastLogin: new Date(),
      isLocked: false
    },
    {
      id: '2',
      name: 'Jane Manager',
      email: 'manager@example.com',
      roles: ['2'],
      permissions: ['1'],
      isActive: true,
      isLocked: false
    }
  ];

  const mockAccessPolicies: AccessPolicy[] = [
    {
      id: '1',
      name: 'Admin Only Access',
      description: 'Restrict to admin users',
      type: 'allow',
      priority: 1,
      isActive: true
    }
  ];

  const mockResources: Resource[] = [
    {
      id: '1',
      name: 'User Management',
      type: 'Page',
      path: '/users',
      permissions: ['1', '2'],
      isProtected: true
    }
  ];

  const mockAccessLogs: AccessLog[] = [
    {
      id: '1',
      userId: '1',
      userName: 'John Admin',
      action: 'login',
      resource: 'system',
      timestamp: new Date(),
      ipAddress: '192.168.1.100',
      success: true
    }
  ];

  useEffect(() => {
    setPermissions(mockPermissions);
    setRoles(mockRoles);
    setUsers(mockUsers);
    setAccessPolicies(mockAccessPolicies);
    setResources(mockResources);
    setAccessLogs(mockAccessLogs);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (field: keyof AccessControlFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteItem = (itemId: string, itemType: string) => {
    switch (itemType) {
      case 'permission':
        setPermissions(prev => prev.filter(p => p.id !== itemId));
        break;
      case 'role':
        setRoles(prev => prev.filter(r => r.id !== itemId));
        break;
      case 'user':
        setUsers(prev => prev.filter(u => u.id !== itemId));
        break;
    }
    setSnackbar({
      open: true,
      message: `${itemType} deleted successfully`,
      severity: 'success'
    });
  };

  const getPermissionName = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission ? permission.name : 'Unknown';
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown';
  };

  const renderPermissionsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Permissions</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Permission
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {permission.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{permission.description}</TableCell>
                  <TableCell>
                    <Chip label={permission.resource} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Chip label={permission.action} size="small" color="secondary" />
                  </TableCell>
                  <TableCell>
                    <Chip label={permission.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={permission.isActive ? 'Active' : 'Inactive'}
                      color={permission.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Permission">
                        <IconButton size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Permission">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteItem(permission.id, 'permission')}
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
    </Box>
  );

  const renderRolesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Roles</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Role
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {role.isSystem ? <AdminIcon color="primary" /> : <GroupIcon />}
                      <Typography variant="subtitle2" fontWeight="bold">
                        {role.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {role.permissions.slice(0, 2).map(permId => (
                        <Chip
                          key={permId}
                          label={getPermissionName(permId)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {role.permissions.length > 2 && (
                        <Chip
                          label={`+${role.permissions.length - 2} more`}
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {role.userCount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={role.priority} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={role.isActive ? 'Active' : 'Inactive'}
                      color={role.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Role">
                        <IconButton size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Role">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteItem(role.id, 'role')}
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
    </Box>
  );

  const renderUsersTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Users</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add User
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {user.roles.map(roleId => (
                        <Chip
                          key={roleId}
                          label={getRoleName(roleId)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.permissions.length} permissions
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                      {user.isLocked && (
                        <Chip
                          label="Locked"
                          color="error"
                          size="small"
                          icon={<LockIcon />}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit User">
                        <IconButton size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteItem(user.id, 'user')}
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
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Enhanced Access Control
        </Typography>
        <Box>
          <Button variant="outlined" startIcon={<ArchiveIcon />} sx={{ mr: 1 }}>
            Export Logs
          </Button>
          <Button variant="outlined" startIcon={<SettingsIcon />} sx={{ mr: 1 }}>
            Settings
          </Button>
          <Button variant="contained" startIcon={<SecurityIcon />}>
            Security Audit
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Permissions
            </Typography>
            <Typography variant="h4" component="div" color="primary.main">
              {permissions.filter(p => p.isActive).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              System permissions
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Roles
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {roles.filter(r => r.isActive).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              User roles
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Users
            </Typography>
            <Typography variant="h4" component="div" color="info.main">
              {users.filter(u => u.isActive).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              System users
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Access Logs
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {accessLogs.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total entries
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
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
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="permission">Permission</MenuItem>
              <MenuItem value="role">Role</MenuItem>
              <MenuItem value="user">User</MenuItem>
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
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="User Management">User Management</MenuItem>
              <MenuItem value="Role Management">Role Management</MenuItem>
              <MenuItem value="System Settings">System Settings</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="access control tabs">
          <Tab label="Permissions" icon={<KeyIcon />} iconPosition="start" />
          <Tab label="Roles" icon={<GroupIcon />} iconPosition="start" />
          <Tab label="Users" icon={<PersonIcon />} iconPosition="start" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderPermissionsTab()}
          {activeTab === 1 && renderRolesTab()}
          {activeTab === 2 && renderUsersTab()}
        </Box>
      </Paper>

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

export default EnhancedAccessControl;
