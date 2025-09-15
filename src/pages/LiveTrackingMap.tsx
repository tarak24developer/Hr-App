import React, { useState, useEffect } from 'react';
import {
  Map,
  User as UserIcon,
  MapPin,
  Navigation,
  Clock,
  UserCheck,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  BarChart3,
  History,
  RefreshCw,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
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
  desktop: <Monitor className="w-4 h-4" />,
  laptop: <Monitor className="w-4 h-4" />,
  tablet: <Tablet className="w-4 h-4" />,
  mobile: <Smartphone className="w-4 h-4" />,
  smartwatch: <Watch className="w-4 h-4" />
};

const getDeviceIcon = (deviceType: string) => {
  return deviceTypeIcons[deviceType as keyof typeof deviceTypeIcons] || <Monitor className="w-4 h-4" />;
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
        return <Navigation className="w-4 h-4 text-green-600" />;
      case 'idle':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'away':
        return <UserCheck className="w-4 h-4 text-red-600" />;
      case 'offline':
        return <Navigation className="w-4 h-4 text-gray-400" />;
      default:
        return <Navigation className="w-4 h-4 text-gray-600" />;
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
          <button onClick={() => window.location.reload()} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Tracking Map</h1>
          <p className="text-gray-600">Real-time location tracking and monitoring</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
          <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
          <button
            onClick={handleRequestLocationConsent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Map className="w-4 h-4" />
            <span>Enable Location Tracking</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Online Users</p>
              <p className="text-2xl font-bold text-gray-900">{getOnlineUsersCount()}</p>
              <p className="text-xs text-gray-500">of {trackingData.length} total users</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Navigation className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{getActiveUsersCount()}</p>
              <p className="text-xs text-gray-500">Currently active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Monitor className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Devices</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalDevicesCount()}</p>
              <p className="text-xs text-gray-500">Being tracked</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Locations</p>
              <p className="text-2xl font-bold text-gray-900">{getLocationDistribution()}</p>
              <p className="text-xs text-gray-500">Different cities</p>
            </div>
          </div>
        </div>
      </div>

             {/* Map View Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Tracking Map</h3>
          <div className="flex flex-wrap gap-2">
            <button
               onClick={() => setMapView('all-users')}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                mapView === 'all-users'
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
             >
               All Users ({trackingData.length})
            </button>
            <button
               onClick={() => setMapView('my-location')}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                mapView === 'my-location'
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
             >
               My Location
            </button>
            <button
               onClick={() => setMapView('selected-users')}
               disabled={selectedUsers.length === 0}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                mapView === 'selected-users'
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                selectedUsers.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              )}
             >
               Selected ({selectedUsers.length})
            </button>
             {selectedUsers.length > 0 && (
              <button
                 onClick={() => setSelectedUsers([])}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
               >
                 Clear Selection
              </button>
             )}
            <button
               onClick={handleForceLocationUpdate}
              className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Update My Location</span>
            </button>
          </div>
        </div>
        
        {/* Live Map */}
        <div className="h-96 rounded-lg overflow-hidden border border-gray-300 relative">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
              <MapPin className="w-16 h-16 mb-4 opacity-50" />
              <h4 className="text-lg font-semibold mb-2">No Location Data Available</h4>
              <p className="text-sm text-center max-w-md">
                {trackingData.length === 0 
                  ? "No users are currently being tracked. Grant location permission to start tracking your location."
                  : "No users match the current filter. Try selecting 'All Users' or adjust your selection."
                }
              </p>
              {trackingData.length === 0 && (
                <button
                  onClick={handleRequestLocationConsent}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Start Location Tracking</span>
                </button>
              )}
            </div>
          ) : (
            <LiveMap
              users={filteredData}
              mapView={mapView}
              selectedUsers={selectedUsers}
              onUserSelect={handleUserSelect}
            />
          )}
        </div>
      </div>

      {/* User Tracking Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">User Tracking Data</h3>
        </div>
        <div className="p-6">
          {paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="w-16 h-16 text-gray-400 mb-4" />
              <h4 className="text-lg font-semibold text-gray-500 mb-2">No Tracking Data</h4>
              <p className="text-sm text-gray-500 max-w-md">
                {trackingData.length === 0 
                  ? "No users are currently being tracked. Start location tracking to see data here."
                  : "No users match the current filter or page."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedData.map((user) => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                        <p className="text-xs text-gray-500">{user.userEmail}</p>
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded-full mt-1">
                          {user.userRole}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                    {getDeviceIcon(user.deviceInfo.deviceType)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                        {user.deviceInfo.browser} {user.deviceInfo.browserVersion}
                        </p>
                        <p className="text-xs text-gray-500">
                        {user.deviceInfo.os} {user.deviceInfo.osVersion}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-900">
                        {user.currentLocation.latitude.toFixed(4)}, {user.currentLocation.longitude.toFixed(4)}
                        </p>
                        <p className="text-xs text-gray-500">
                        Accuracy: {user.currentLocation.accuracy}m
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                    {getStatusIcon(user.status)}
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: statusColors[user.status] }}
                      >
                        {user.status}
                      </span>
                    {user.isOnline && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-t border-b border-gray-300",
                  page === currentPage
                    ? "bg-blue-50 text-blue-600 border-blue-300"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                )}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Location Consent Modal */}
      <LocationConsentModal
        open={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </div>
  );
};

export default LiveTrackingMap;


