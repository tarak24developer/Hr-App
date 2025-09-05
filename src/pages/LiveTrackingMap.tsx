import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Alert,
  Pagination,
  Avatar,
  Badge,
  Chip,
  CircularProgress
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
import realtimeTrackingService from '../services/realtimeTracking';
import locationTrackingService from '../services/locationTracking';
import authService from '../services/authService';
import LocationConsentModal from '../components/LocationConsentModal';
import LiveMap from '../components/LiveMap';
import trackingDataService from '../services/trackingDataService';

interface UserTrackingData {
  id?: string;
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
  createdAt?: any;
  updatedAt?: any;
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
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
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

const getDeviceIcon = (deviceType: string) => {
  return deviceTypeIcons[deviceType as keyof typeof deviceTypeIcons] || <ComputerIcon />;
};

const LiveTrackingMap: React.FC = () => {
  const [trackingData, setTrackingData] = useState<UserTrackingData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [mapView, setMapView] = useState<'all-users' | 'my-location' | 'selected-users'>('all-users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setCurrentUser] = useState<any>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Initialize tracking data from Firebase
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const user = await authService.getCurrentUser();
        setCurrentUser(user);

        // Initialize tracking data service
        await trackingDataService.initializeTrackingCollections();

        // Set current user in location tracking service
        if (user) {
          locationTrackingService.setCurrentUser(user);
        }

        // Load initial tracking data
        const data = await realtimeTrackingService.getAllUserTrackingData();
        setTrackingData(data);

        // Set up real-time listener
        const unsubscribe = realtimeTrackingService.onAllTrackingUpdates((data: UserTrackingData[]) => {
          setTrackingData(data);
        });

        setLoading(false);

        // Store unsubscribe function for cleanup
        return unsubscribe;
      } catch (err: any) {
        console.error('Error initializing tracking:', err);
        setError(err.message || 'Failed to load tracking data');
        setLoading(false);
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

  // Filter data based on map view
  const filteredData = React.useMemo(() => {
    if (mapView === 'selected-users') {
      return trackingData.filter(user => selectedUsers.includes(user.userId));
    }
    return trackingData;
  }, [trackingData, mapView, selectedUsers]);

  const getOnlineUsersCount = () => {
    return filteredData.filter(user => user.isOnline).length;
  };

  const getActiveUsersCount = () => {
    return filteredData.filter(user => user.status === 'online').length;
  };

  const getTotalDevicesCount = () => {
    return filteredData.length;
  };

  const getLocationDistribution = () => {
    // Since we don't have city data in the new structure, we'll use a different approach
    const uniqueLocations = new Set();
    filteredData.forEach(user => {
      const key = `${user.currentLocation.latitude.toFixed(2)},${user.currentLocation.longitude.toFixed(2)}`;
      uniqueLocations.add(key);
    });
    return uniqueLocations.size;
  };

  // Handle location consent request
  const handleRequestLocationConsent = () => {
    setShowConsentModal(true);
  };

  // Handle consent acceptance
  const handleConsentAccept = async () => {
    try {
      const result = await locationTrackingService.requestConsent();
      if (result.success) {
        console.log('Location consent granted');
        setError(null);
      }
    } catch (error) {
      console.error('Error requesting location consent:', error);
      setError('Failed to get location permission');
    }
  };

  // Handle consent decline
  const handleConsentDecline = () => {
    console.log('Location consent declined');
    setError(null);
  };

  // Handle user selection on map
  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleForceLocationUpdate = async () => {
    try {
      console.log('🔄 Forcing location update...');
      const location = await locationTrackingService.forceLocationUpdate();
      if (location) {
        console.log('✅ Location updated successfully:', location);
        // Refresh the data
        const data = await realtimeTrackingService.getAllUserTrackingData();
        setTrackingData(data);
      } else {
        console.error('❌ Failed to update location');
      }
    } catch (error) {
      console.error('Error forcing location update:', error);
    }
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading tracking data...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

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
            onClick={handleRequestLocationConsent}
          >
            Enable Location Tracking
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
           <Typography variant="h6">Live Tracking Map</Typography>
           <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant={mapView === 'all-users' ? 'contained' : 'outlined'}
              onClick={() => setMapView('all-users')}
               size="small"
            >
               All Users ({trackingData.length})
            </Button>
            <Button
              variant={mapView === 'my-location' ? 'contained' : 'outlined'}
              onClick={() => setMapView('my-location')}
               size="small"
            >
              My Location
            </Button>
            <Button
              variant={mapView === 'selected-users' ? 'contained' : 'outlined'}
              onClick={() => setMapView('selected-users')}
               size="small"
               disabled={selectedUsers.length === 0}
             >
               Selected ({selectedUsers.length})
             </Button>
             {selectedUsers.length > 0 && (
               <Button
                 variant="outlined"
                 onClick={() => setSelectedUsers([])}
                 size="small"
                 color="secondary"
               >
                 Clear Selection
               </Button>
             )}
             <Button
               variant="outlined"
               onClick={handleForceLocationUpdate}
               size="small"
               startIcon={<MyLocationIcon />}
               color="primary"
             >
               Update My Location
            </Button>
          </Box>
        </Box>
        
        {/* Live Map */}
        <Box
          sx={{
            height: 400,
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'grey.300',
            position: 'relative'
          }}
        >
          {filteredData.length === 0 ? (
            <Box
              sx={{
            display: 'flex',
                flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
                height: '100%',
                backgroundColor: 'grey.50',
                color: 'text.secondary'
              }}
            >
              <MyLocationIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                No Location Data Available
            </Typography>
              <Typography variant="body2" textAlign="center" sx={{ maxWidth: 400 }}>
                {trackingData.length === 0 
                  ? "No users are currently being tracked. Grant location permission to start tracking your location."
                  : "No users match the current filter. Try selecting 'All Users' or adjust your selection."
                }
            </Typography>
              {trackingData.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<MyLocationIcon />}
                  onClick={handleRequestLocationConsent}
                  sx={{ mt: 2 }}
                >
                  Start Location Tracking
                </Button>
              )}
          </Box>
          ) : (
            <LiveMap
              users={filteredData}
              mapView={mapView}
              selectedUsers={selectedUsers}
              onUserSelect={handleUserSelect}
            />
          )}
        </Box>
      </Paper>

      {/* User Tracking Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">User Tracking Data</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          {paginatedData.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 6,
              textAlign: 'center'
            }}>
              <LocationIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Tracking Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                {trackingData.length === 0 
                  ? "No users are currently being tracked. Start location tracking to see data here."
                  : "No users match the current filter or page."
                }
              </Typography>
            </Box>
          ) : (
            paginatedData.map((user) => (
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
                    {getDeviceIcon(user.deviceInfo.deviceType)}
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.deviceInfo.browser} {user.deviceInfo.browserVersion}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.deviceInfo.os} {user.deviceInfo.osVersion}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2">
                        {user.currentLocation.latitude.toFixed(4)}, {user.currentLocation.longitude.toFixed(4)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Accuracy: {user.currentLocation.accuracy}m
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
            ))
          )}
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

      {/* Location Consent Modal */}
      <LocationConsentModal
        open={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </Box>
  );
};

export default LiveTrackingMap;


