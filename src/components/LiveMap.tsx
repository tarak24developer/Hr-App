import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography, Chip, Avatar } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

interface UserLocation {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment: string;
  deviceInfo: {
    deviceType: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
  };
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    address?: string;
  };
  lastSeen: Date;
  isOnline: boolean;
  status: 'online' | 'offline' | 'idle' | 'away';
}

interface LiveMapProps {
  users: UserLocation[];
  mapView: 'all-users' | 'my-location' | 'selected-users';
  selectedUsers?: string[];
  onUserSelect?: (userId: string) => void;
}

// Custom marker icons based on user status
const createCustomIcon = (status: string, isOnline: boolean) => {
  const colors = {
    online: '#4caf50',
    offline: '#9e9e9e',
    idle: '#ff9800',
    away: '#f44336'
  };

  const color = colors[status as keyof typeof colors] || '#9e9e9e';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">
        ${isOnline ? '●' : '○'}
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

// Component to handle map updates
const MapUpdater: React.FC<{ users: UserLocation[]; mapView: string }> = ({ users, mapView }) => {
  const map = useMap();

  useEffect(() => {
    if (users.length === 0) return;

    if (mapView === 'all-users') {
      // Fit map to show all users
      const bounds = L.latLngBounds(
        users.map(user => [user.currentLocation.latitude, user.currentLocation.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    } else if (mapView === 'my-location') {
      // Center on current user's location (first online user)
      const currentUser = users.find(user => user.isOnline);
      if (currentUser) {
        map.setView([currentUser.currentLocation.latitude, currentUser.currentLocation.longitude], 15);
      }
    }
  }, [users, mapView, map]);

  return null;
};

const LiveMap: React.FC<LiveMapProps> = ({ 
  users, 
  mapView, 
  selectedUsers = [], 
  onUserSelect 
}) => {
  // Filter users based on selection if in selected-users mode
  const displayUsers = mapView === 'selected-users' 
    ? users.filter(user => selectedUsers.includes(user.userId))
    : users;
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default to San Francisco

  // Update map center based on users
  useEffect(() => {
    if (displayUsers.length > 0) {
      const onlineUsers = displayUsers.filter(user => user.isOnline);
      if (onlineUsers.length > 0) {
        const avgLat = onlineUsers.reduce((sum, user) => sum + user.currentLocation.latitude, 0) / onlineUsers.length;
        const avgLng = onlineUsers.reduce((sum, user) => sum + user.currentLocation.longitude, 0) / onlineUsers.length;
        setMapCenter([avgLat, avgLng]);
      }
    }
  }, [displayUsers]);

  const getDeviceIcon = (deviceType: string) => {
    const icons = {
      desktop: '🖥️',
      laptop: '💻',
      tablet: '📱',
      mobile: '📱',
      smartwatch: '⌚'
    };
    return icons[deviceType as keyof typeof icons] || '💻';
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Show message if no users to display
  if (displayUsers.length === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'grey.100',
        borderRadius: 1
      }}>
        <Typography variant="h6" color="textSecondary">
          {mapView === 'selected-users' ? 'No users selected' : 'No users to display'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        key={`map-${displayUsers.length}`} // Force re-render when users change
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater users={displayUsers} mapView={mapView} />
        
        {displayUsers.map((user) => {
          if (!user.currentLocation.latitude || !user.currentLocation.longitude) return null;
          
          return (
            <Marker
              key={user.id || user.userId}
              position={[user.currentLocation.latitude, user.currentLocation.longitude]}
              icon={createCustomIcon(user.status, user.isOnline)}
              eventHandlers={{
                click: () => {
                  if (onUserSelect) {
                    onUserSelect(user.userId);
                  }
                }
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 250, p: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {user.userName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.userEmail}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={user.userRole}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={user.status}
                      size="small"
                      sx={{
                        bgcolor: user.isOnline ? '#4caf50' : '#9e9e9e',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Device:</strong> {getDeviceIcon(user.deviceInfo.deviceType)} {user.deviceInfo.browser} {user.deviceInfo.browserVersion}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>OS:</strong> {user.deviceInfo.os} {user.deviceInfo.osVersion}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Location:</strong> {user.currentLocation.latitude.toFixed(4)}, {user.currentLocation.longitude.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Accuracy:</strong> {user.currentLocation.accuracy}m
                    </Typography>
      </Box>
                  
                  <Typography variant="body2" color="textSecondary">
                    <strong>Last seen:</strong> {formatLastSeen(user.lastSeen)}
                  </Typography>
      </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Map Legend */}
        <Box
          sx={{
            position: 'absolute',
          top: 10,
          right: 10,
          bgcolor: 'white',
          p: 2,
          borderRadius: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Status Legend
          </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
            <Typography variant="caption">Online</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: '50%' }} />
            <Typography variant="caption">Idle</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: '50%' }} />
            <Typography variant="caption">Away</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: '#9e9e9e', borderRadius: '50%' }} />
            <Typography variant="caption">Offline</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LiveMap; 