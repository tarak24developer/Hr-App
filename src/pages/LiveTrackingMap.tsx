import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Pagination,
  Tooltip,
  Avatar,
  Badge,
  Chip
} from '@mui/material';
import {
  Map as MapIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Timeline as TimelineIcon,
  DirectionsWalk as WalkIcon,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  Tablet as TabletIcon,
  Watch as WatchIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon
} from '@mui/icons-material';

interface UserTrackingData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment: string;
  deviceInfo: DeviceInfo;
  currentLocation: Location;
  lastSeen: Date;
  isOnline: boolean;
  status: 'online' | 'offline' | 'idle' | 'away';
  totalDistance?: number;
  lastActivity?: Date;
  loginTime?: Date;
}

interface DeviceInfo {
  id: string;
  type: 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'smartwatch';
  name: string;
  model: string;
  os: string;
  browser?: string;
  ipAddress: string;
  lastSync: Date;
  isTrusted: boolean;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timestamp: Date;
  source: 'gps' | 'network' | 'manual' | 'estimated';
}

const statusColors = {
  online: '#4caf50',
  offline: '#9e9e9e',
  idle: '#ff9800',
  away: '#f44336'
};

const deviceTypeIcons = {
  desktop: <ComputerIcon />,
  laptop: <ComputerIcon />,
  tablet: <TabletIcon />,
  mobile: <PhoneIcon />,
  smartwatch: <WatchIcon />
};

const LiveTrackingMap: React.FC = () => {
  const [trackingData, setTrackingData] = useState<UserTrackingData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [mapView, setMapView] = useState<'all-users' | 'my-location' | 'selected-users'>('all-users');

  // Mock data for development
  const mockTrackingData: UserTrackingData[] = [
    {
      id: '1',
      userId: '1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      userRole: 'Manager',
      userDepartment: 'IT',
      deviceInfo: {
        id: 'dev1',
        type: 'laptop',
        name: 'John\'s MacBook',
        model: 'MacBook Pro 16"',
        os: 'macOS 14.0',
        browser: 'Chrome 120.0',
        ipAddress: '192.168.1.100',
        lastSync: new Date(),
        isTrusted: true
      },
      currentLocation: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94102',
        timestamp: new Date(),
        source: 'gps'
      },
      lastSeen: new Date(),
      isOnline: true,
      status: 'online',
      totalDistance: 15.5,
      lastActivity: new Date(),
      loginTime: new Date(Date.now() - 1000 * 60 * 60 * 8)
    },
    {
      id: '2',
      userId: '2',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      userRole: 'Employee',
      userDepartment: 'Marketing',
      deviceInfo: {
        id: 'dev2',
        type: 'mobile',
        name: 'Jane\'s iPhone',
        model: 'iPhone 15 Pro',
        os: 'iOS 17.0',
        ipAddress: '192.168.1.101',
        lastSync: new Date(),
        isTrusted: true
      },
      currentLocation: {
        latitude: 37.7849,
        longitude: -122.4094,
        accuracy: 15,
        address: '456 Oak Ave',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94103',
        timestamp: new Date(),
        source: 'gps'
      },
      lastSeen: new Date(Date.now() - 1000 * 60 * 15),
      isOnline: false,
      status: 'idle',
      totalDistance: 8.2,
      lastActivity: new Date(Date.now() - 1000 * 60 * 20),
      loginTime: new Date(Date.now() - 1000 * 60 * 60 * 6)
    }
  ];

  useEffect(() => {
    setTrackingData(mockTrackingData);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <MyLocationIcon color="success" />;
      case 'idle':
        return <TimelineIcon color="warning" />;
      case 'away':
        return <WalkIcon color="error" />;
      case 'offline':
        return <MyLocationIcon color="disabled" />;
      default:
        return <MyLocationIcon />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    return deviceTypeIcons[deviceType as keyof typeof deviceTypeIcons] || <ComputerIcon />;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getOnlineUsersCount = () => {
    return trackingData.filter(user => user.isOnline).length;
  };

  const getActiveUsersCount = () => {
    return trackingData.filter(user => user.status === 'online').length;
  };

  const getTotalDevicesCount = () => {
    return trackingData.length;
  };

  const getLocationDistribution = () => {
    const locations = trackingData.map(user => user.currentLocation.city);
    const uniqueLocations = [...new Set(locations)];
    return uniqueLocations.length;
  };

  const paginatedData = trackingData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(trackingData.length / itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Live Tracking Map
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AnalyticsIcon />}
            sx={{ mr: 1 }}
          >
            Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            sx={{ mr: 1 }}
          >
            History
          </Button>
          <Button
            variant="contained"
            startIcon={<MapIcon />}
          >
            Full Screen Map
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Online Users
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {getOnlineUsersCount()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                of {trackingData.length} total users
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4" component="div" color="primary.main">
                {getActiveUsersCount()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Currently active
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Devices
              </Typography>
              <Typography variant="h4" component="div">
                {getTotalDevicesCount()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Being tracked
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Locations
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
                {getLocationDistribution()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Different cities
              </Typography>
            </CardContent>
          </Card>
        </Box>

      {/* Map View Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Map View Controls</Typography>
          <Box>
            <Button
              variant={mapView === 'all-users' ? 'contained' : 'outlined'}
              onClick={() => setMapView('all-users')}
              sx={{ mr: 1 }}
            >
              All Users
            </Button>
            <Button
              variant={mapView === 'my-location' ? 'contained' : 'outlined'}
              onClick={() => setMapView('my-location')}
              sx={{ mr: 1 }}
            >
              My Location
            </Button>
            <Button
              variant={mapView === 'selected-users' ? 'contained' : 'outlined'}
              onClick={() => setMapView('selected-users')}
            >
              Selected Users (0)
            </Button>
          </Box>
        </Box>
        
        {/* Map Placeholder */}
        <Box
          sx={{
            height: 400,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            border: '2px dashed',
            borderColor: 'grey.300'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <MapIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="grey.600">
              Interactive Map View
            </Typography>
            <Typography variant="body2" color="grey.500">
              {mapView === 'all-users' && `${trackingData.length} users displayed`}
              {mapView === 'my-location' && 'Centered on your current location'}
              {mapView === 'selected-users' && '0 selected users displayed'}
            </Typography>
            <Typography variant="caption" color="grey.400">
              Map integration would be implemented here
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* User Tracking Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">User Tracking Data</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          {paginatedData.map((user) => (
            <Card key={user.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {user.userName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {user.userEmail}
                      </Typography>
                      <Chip
                        label={user.userRole}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getDeviceIcon(user.deviceInfo.type)}
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.deviceInfo.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.deviceInfo.os}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2">
                        {user.currentLocation.city}, {user.currentLocation.state}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.currentLocation.address}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(user.status)}
                    <Chip
                      label={user.status}
                      size="small"
                      sx={{
                        bgcolor: statusColors[user.status],
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    {user.isOnline && (
                      <Badge
                        variant="dot"
                        color="success"
                        sx={{ '& .MuiBadge-dot': { width: 8, height: 8 } }}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
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
    </Box>
  );
};

export default LiveTrackingMap;
