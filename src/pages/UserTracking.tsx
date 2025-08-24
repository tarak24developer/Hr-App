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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Smartphone as MobileIcon,
  Tablet as TabletIcon,
  ExpandMore as ExpandMoreIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';

interface UserTrackingData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment: string;
  isOnline: boolean;
  lastSeen: Date;
  currentLocation: Location;
  deviceInfo: DeviceInfo;
  activity: Activity[];
  trackingEnabled: boolean;
  consentGiven: boolean;
  lastUpdated: Date;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  address?: string;
  city?: string;
  country?: string;
}

interface DeviceInfo {
  deviceId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  osVersion: string;
  screenResolution: string;
  timezone: string;
}

interface Activity {
  id: string;
  type: 'login' | 'logout' | 'page_view' | 'action' | 'idle';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
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
  const mockTrackingData: UserTrackingData[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      userEmail: 'john.doe@company.com',
      userRole: 'Software Engineer',
      userDepartment: 'Engineering',
      isOnline: true,
      lastSeen: new Date(),
      currentLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: new Date(),
        address: '123 Main St',
        city: 'New York',
        country: 'USA'
      },
      deviceInfo: {
        deviceId: 'dev1',
        deviceType: 'desktop',
        browser: 'Chrome',
        browserVersion: '120.0.0.0',
        operatingSystem: 'Windows',
        osVersion: '11',
        screenResolution: '1920x1080',
        timezone: 'America/New_York'
      },
      activity: [
        {
          id: 'act1',
          type: 'login',
          description: 'User logged in',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          metadata: { ip: '192.168.1.100' }
        },
        {
          id: 'act2',
          type: 'page_view',
          description: 'Viewed Dashboard',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          metadata: { page: '/dashboard' }
        }
      ],
      trackingEnabled: true,
      consentGiven: true,
      lastUpdated: new Date()
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith',
      userEmail: 'jane.smith@company.com',
      userRole: 'Product Manager',
      userDepartment: 'Product',
      isOnline: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      currentLocation: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 15,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        address: '456 Market St',
        city: 'San Francisco',
        country: 'USA'
      },
      deviceInfo: {
        deviceId: 'dev2',
        deviceType: 'mobile',
        browser: 'Safari',
        browserVersion: '17.0',
        operatingSystem: 'iOS',
        osVersion: '17.0',
        screenResolution: '390x844',
        timezone: 'America/Los_Angeles'
      },
      activity: [
        {
          id: 'act3',
          type: 'logout',
          description: 'User logged out',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          metadata: { reason: 'session_timeout' }
        }
      ],
      trackingEnabled: true,
      consentGiven: true,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Mike Johnson',
      userEmail: 'mike.johnson@company.com',
      userRole: 'Designer',
      userDepartment: 'Design',
      isOnline: true,
      lastSeen: new Date(),
      currentLocation: {
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 20,
        timestamp: new Date(),
        address: '789 Oxford St',
        city: 'London',
        country: 'UK'
      },
      deviceInfo: {
        deviceId: 'dev3',
        deviceType: 'tablet',
        browser: 'Firefox',
        browserVersion: '121.0',
        operatingSystem: 'Android',
        osVersion: '13',
        screenResolution: '1024x768',
        timezone: 'Europe/London'
      },
      activity: [
        {
          id: 'act4',
          type: 'action',
          description: 'Created new design mockup',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          metadata: { tool: 'Figma', project: 'New App Design' }
        }
      ],
      trackingEnabled: true,
      consentGiven: true,
      lastUpdated: new Date()
    }
  ];

  useEffect(() => {
    // Load mock data
    setTrackingData(mockTrackingData);
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
      }
    }

    if (filters.deviceType) {
      filtered = filtered.filter(user => user.deviceInfo.deviceType === filters.deviceType);
    }

    if (filters.location) {
      filtered = filtered.filter(user => 
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
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleToggleTracking = (userId: string) => {
    setTrackingData(prev => prev.map(user =>
      user.id === userId
        ? { ...user, trackingEnabled: !user.trackingEnabled }
        : user
    ));
    setSnackbar({
      open: true,
      message: 'Tracking status updated successfully',
      severity: 'success'
    });
  };

  const handleRefreshLocation = (userId: string) => {
    // Simulate location refresh
    setTrackingData(prev => prev.map(user =>
      user.id === userId
        ? { 
            ...user, 
            lastUpdated: new Date(),
            currentLocation: {
              ...user.currentLocation,
              timestamp: new Date()
            }
          }
        : user
    ));
    setSnackbar({
      open: true,
      message: 'Location refreshed successfully',
      severity: 'success'
    });
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

  const getDeviceTypeDistribution = () => {
    const distribution: Record<string, number> = {};
    trackingData.forEach(user => {
      const deviceType = user.deviceInfo.deviceType;
      distribution[deviceType] = (distribution[deviceType] || 0) + 1;
    });
    return distribution;
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
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
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tracking Enabled
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
                {trackingData.filter(user => user.trackingEnabled).length}
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
              label="Search Users"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                )
              }}
            />
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
                {getActiveDepartments().map(dept => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
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
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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
          </Grid>
        </Grid>
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
              {paginatedData.map((user) => (
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
                          {user.deviceInfo.operatingSystem} {user.deviceInfo.osVersion}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {user.currentLocation.city}, {user.currentLocation.country}
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
                            checked={user.trackingEnabled}
                            onChange={() => handleToggleTracking(user.id)}
                            color="primary"
                          />
                        }
                        label=""
                      />
                      <Chip
                        label={user.trackingEnabled ? 'Enabled' : 'Disabled'}
                        size="small"
                        color={user.trackingEnabled ? 'success' : 'default'}
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
                          onClick={() => handleRefreshLocation(user.id)}
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
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                </Grid>
                <Grid item xs={12} md={6}>
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
                        secondary={`${selectedUser.deviceInfo.operatingSystem} ${selectedUser.deviceInfo.osVersion}`}
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
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Current Location</Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Coordinates:</strong> {selectedUser.currentLocation.latitude.toFixed(4)}, {selectedUser.currentLocation.longitude.toFixed(4)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Accuracy:</strong> {selectedUser.currentLocation.accuracy}m
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Address:</strong> {selectedUser.currentLocation.address}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>City/Country:</strong> {selectedUser.currentLocation.city}, {selectedUser.currentLocation.country}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>Last Updated:</strong> {selectedUser.currentLocation.timestamp.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                  <List>
                    {selectedUser.activity.map((activity) => (
                      <ListItem key={activity.id} divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <TimelineIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.description}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Type: {activity.type.replace('_', ' ')}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Time: {activity.timestamp.toLocaleString()}
                              </Typography>
                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <Typography variant="caption" display="block">
                                  Details: {JSON.stringify(activity.metadata)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
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
