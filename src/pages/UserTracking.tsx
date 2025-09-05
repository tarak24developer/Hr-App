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
  FormControlLabel,
  Switch,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Smartphone as MobileIcon,
  Tablet as TabletIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import realtimeTrackingService from '../services/realtimeTracking';
import locationTrackingService from '../services/locationTracking';
import trackingDataService from '../services/trackingDataService';
import authService from '../services/authService';

interface UserTrackingData {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment: string;
  isOnline: boolean;
  lastSeen: Date;
  currentLocation: Location;
  deviceInfo: DeviceInfo;
  status: 'online' | 'offline' | 'idle' | 'away';
  totalDistance?: number;
  lastActivity?: Date;
  loginTime?: Date;
  sessionId: string;
  trackingEnabled?: boolean;
  consentGiven?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  screenResolution: string;
  deviceId: string;
}

interface UserTrackingFilters {
  search: string;
  department: string;
  status: string;
  deviceType: string;
  location: string;
}

const initialFilters: UserTrackingFilters = {
  search: '',
  department: '',
  status: '',
  deviceType: '',
  location: ''
};

const statusColors = {
  online: '#4caf50',
  offline: '#f44336',
  idle: '#ff9800'
};

const deviceTypeColors = {
  desktop: '#2196f3',
  mobile: '#ff9800',
  tablet: '#9c27b0',
  unknown: '#9e9e9e'
};

const UserTracking: React.FC = () => {
  const [trackingData, setTrackingData] = useState<UserTrackingData[]>([]);
  const [filteredData, setFilteredData] = useState<UserTrackingData[]>([]);
  const [filters, setFilters] = useState<UserTrackingFilters>(initialFilters);
  const [selectedUser, setSelectedUser] = useState<UserTrackingData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // Firebase integration - no mock data

  // Initialize tracking data from Firebase
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        // Load initial tracking data
        const data = await realtimeTrackingService.getAllUserTrackingData();
        setTrackingData(data);

        // Set up real-time listener
        const unsubscribe = realtimeTrackingService.onAllTrackingUpdates((data: UserTrackingData[]) => {
          setTrackingData(data);
        });

        // Store unsubscribe function for cleanup
        return unsubscribe;
      } catch (error) {
        console.error('Error loading tracking data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load tracking data',
          severity: 'error'
        });
        return null;
      }
    };

    let unsubscribe: (() => void) | null = null;
    
    initializeTracking().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trackingData, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...trackingData];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user =>
        user.userName.toLowerCase().includes(searchLower) ||
        user.userEmail.toLowerCase().includes(searchLower) ||
        user.userRole.toLowerCase().includes(searchLower) ||
        user.userDepartment.toLowerCase().includes(searchLower)
      );
    }

    if (filters.department) {
      filtered = filtered.filter(user => user.userDepartment === filters.department);
    }

    if (filters.status) {
      if (filters.status === 'online') {
        filtered = filtered.filter(user => user.isOnline);
      } else if (filters.status === 'offline') {
        filtered = filtered.filter(user => !user.isOnline);
      } else if (filters.status === 'idle') {
        filtered = filtered.filter(user => user.status === 'idle');
      } else if (filters.status === 'away') {
        filtered = filtered.filter(user => user.status === 'away');
      }
    }

    if (filters.deviceType) {
      filtered = filtered.filter(user => user.deviceInfo.deviceType === filters.deviceType);
    }

    if (filters.location) {
      filtered = filtered.filter(user => 
        user.currentLocation.address?.toLowerCase().includes(filters.location.toLowerCase()) ||
        user.currentLocation.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        user.currentLocation.country?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [trackingData, filters]);

  const handleFilterChange = (field: keyof UserTrackingFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewUser = (user: UserTrackingData) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleToggleTracking = async (userId: string) => {
    try {
      // Find the user to toggle
      const user = trackingData.find(u => u.userId === userId);
      if (!user) return;

      // Update tracking status in Firebase
      const updatedUser = {
        ...user,
        trackingEnabled: !user.trackingEnabled,
        updatedAt: new Date()
      };

      // Save to Firebase
      await trackingDataService.saveUserTrackingRecord(updatedUser);
      
    setSnackbar({
      open: true,
      message: 'Tracking status updated successfully',
      severity: 'success'
    });
    } catch (error) {
      console.error('Error updating tracking status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update tracking status',
        severity: 'error'
      });
    }
  };

  const handleRefreshLocation = async (userId: string) => {
    try {
      // Find the user to refresh
      const user = trackingData.find(u => u.userId === userId);
      if (!user) return;

      // Force location update for this user
      if (user.userId === (await authService.getCurrentUser())?.id) {
        // If it's the current user, force a location update
        await locationTrackingService.forceLocationUpdate();
      } else {
        // For other users, we can't force their location update
        setSnackbar({
          open: true,
          message: 'Cannot refresh location for other users',
          severity: 'warning'
        });
        return;
      }
      
    setSnackbar({
      open: true,
      message: 'Location refreshed successfully',
      severity: 'success'
    });
    } catch (error) {
      console.error('Error refreshing location:', error);
      setSnackbar({
        open: true,
        message: 'Failed to refresh location',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? statusColors.online : statusColors.offline;
  };

  const getDeviceTypeColor = (deviceType: string) => {
    return deviceTypeColors[deviceType as keyof typeof deviceTypeColors] || deviceTypeColors.unknown;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <ComputerIcon />;
      case 'mobile':
        return <MobileIcon />;
      case 'tablet':
        return <TabletIcon />;
      default:
        return <ComputerIcon />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getOnlineUsersCount = () => {
    return trackingData.filter(user => user.isOnline).length;
  };

  const getTotalUsersCount = () => {
    return trackingData.length;
  };

  const getActiveDepartments = () => {
    return [...new Set(trackingData.map(user => user.userDepartment))];
  };



  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Tracking & Monitoring
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh All
          </Button>
          <Button
            variant="contained"
            startIcon={<MapIcon />}
            sx={{ bgcolor: 'primary.main' }}
          >
            View Map
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
                Total Users
              </Typography>
              <Typography variant="h4" component="div">
                {getTotalUsersCount()}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Online Users
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {getOnlineUsersCount()}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Departments
              </Typography>
              <Typography variant="h4" component="div" color="primary.main">
                {getActiveDepartments().length}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tracking Enabled
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
              {trackingData.filter(user => user.trackingEnabled !== false).length}
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
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                )
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label="Department"
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                {getActiveDepartments().map(dept => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
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
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              <MenuItem value="idle">Idle</MenuItem>
              <MenuItem value="away">Away</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Device Type</InputLabel>
              <Select
                value={filters.deviceType}
                label="Device Type"
                onChange={(e) => handleFilterChange('deviceType', e.target.value)}
              >
                <MenuItem value="">All Devices</MenuItem>
                <MenuItem value="desktop">Desktop</MenuItem>
                <MenuItem value="mobile">Mobile</MenuItem>
                <MenuItem value="tablet">Tablet</MenuItem>
              </Select>
            </FormControl>
        </Box>
      </Paper>

      {/* User Tracking Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Device</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell>Tracking</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Tracking Data
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                        {trackingData.length === 0 
                          ? "No users are currently being tracked. Start location tracking to see data here."
                          : "No users match the current filter criteria."
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                        {user.userName.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {user.userName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {user.userRole} • {user.userDepartment}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.isOnline ? (
                        <WifiIcon color="success" />
                      ) : (
                        <WifiOffIcon color="error" />
                      )}
                      <Chip
                        label={user.isOnline ? 'Online' : 'Offline'}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(user.isOnline),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: getDeviceTypeColor(user.deviceInfo.deviceType) }}>
                        {getDeviceIcon(user.deviceInfo.deviceType)}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.deviceInfo.deviceType.charAt(0).toUpperCase() + user.deviceInfo.deviceType.slice(1)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {user.deviceInfo.os} {user.deviceInfo.osVersion}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {user.currentLocation.address || `${user.currentLocation.latitude.toFixed(4)}, ${user.currentLocation.longitude.toFixed(4)}`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {user.currentLocation.accuracy}m accuracy
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatTimeAgo(user.lastSeen)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.trackingEnabled !== false}
                            onChange={() => handleToggleTracking(user.userId)}
                            color="primary"
                          />
                        }
                        label=""
                      />
                      <Chip
                        label={user.trackingEnabled !== false ? 'Enabled' : 'Disabled'}
                        size="small"
                        color={user.trackingEnabled !== false ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewUser(user)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Refresh Location">
                        <IconButton
                          size="small"
                          onClick={() => handleRefreshLocation(user.userId)}
                          color="info"
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Settings">
                        <IconButton
                          size="small"
                          color="default"
                        >
                          <SettingsIcon />
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

      {/* User Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            <Typography variant="h6">
              User Tracking Details: {selectedUser?.userName}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                gap: 3, 
                mb: 3 
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom>User Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Full Name"
                        secondary={selectedUser.userName}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Email"
                        secondary={selectedUser.userEmail}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Role"
                        secondary={selectedUser.userRole}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Department"
                        secondary={selectedUser.userDepartment}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Device Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getDeviceIcon(selectedUser.deviceInfo.deviceType)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Device Type"
                        secondary={selectedUser.deviceInfo.deviceType.charAt(0).toUpperCase() + selectedUser.deviceInfo.deviceType.slice(1)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <ComputerIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Operating System"
                        secondary={`${selectedUser.deviceInfo.os} ${selectedUser.deviceInfo.osVersion}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <ComputerIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Browser"
                        secondary={`${selectedUser.deviceInfo.browser} ${selectedUser.deviceInfo.browserVersion}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <ComputerIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Screen Resolution"
                        secondary={selectedUser.deviceInfo.screenResolution}
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
              <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Current Location</Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                    gap: 2 
                  }}>
                        <Typography variant="body2">
                          <strong>Coordinates:</strong> {selectedUser.currentLocation.latitude.toFixed(4)}, {selectedUser.currentLocation.longitude.toFixed(4)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Accuracy:</strong> {selectedUser.currentLocation.accuracy}m
                        </Typography>
                        <Typography variant="body2">
                      <strong>Address:</strong> {selectedUser.currentLocation.address || 'Not available'}
                        </Typography>
                        <Typography variant="body2">
                      <strong>City/Country:</strong> {selectedUser.currentLocation.city || 'Unknown'}, {selectedUser.currentLocation.country || 'Unknown'}
                        </Typography>
                    <Typography variant="body2" sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                      <strong>Last Updated:</strong> {new Date(selectedUser.currentLocation.timestamp).toLocaleString()}
                        </Typography>
                  </Box>
                </Box>
              </Box>
                            <Box>
                <Typography variant="h6" gutterBottom>Session Information</Typography>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                    gap: 2 
                  }}>
                    <Typography variant="body2">
                      <strong>Session ID:</strong> {selectedUser.sessionId}
                              </Typography>
                    <Typography variant="body2">
                      <strong>Login Time:</strong> {selectedUser.loginTime ? selectedUser.loginTime.toLocaleString() : 'Not available'}
                              </Typography>
                    <Typography variant="body2">
                      <strong>Last Activity:</strong> {selectedUser.lastActivity ? selectedUser.lastActivity.toLocaleString() : 'Not available'}
                                </Typography>
                    <Typography variant="body2">
                      <strong>Total Distance:</strong> {selectedUser.totalDistance ? `${selectedUser.totalDistance.toFixed(2)} km` : 'Not tracked'}
                    </Typography>
                            </Box>
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

export default UserTracking;
