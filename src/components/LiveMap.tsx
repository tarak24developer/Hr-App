import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';

interface LiveMapProps {
  userLocation: any;
  otherUsers?: any[];
  height?: number;
  showUserInfo?: boolean;
  onLocationClick?: ((location: any) => void) | null;
  loading?: boolean;
  error?: string | null;
}

const LiveMap: React.FC<LiveMapProps> = ({ 
  userLocation, 
  otherUsers = [], 
  height = 500, 
  showUserInfo = true,
  onLocationClick = null,
  loading = false,
  error = null
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<Record<string, any>>({});
  const [mapReady, setMapReady] = useState(false);
  const initializedRef = useRef(false); // Track if map has been initialized
  const mapInstanceRef = useRef<any>(null); // Store the actual map instance

  useEffect(() => {
    // Initialize map when component mounts
    if (!mapRef.current) {
      console.log('Map ref not available');
      return;
    }

    // Check if already initialized
    if (initializedRef.current || mapInstanceRef.current) {
      console.log('Map already initialized, skipping');
      return;
    }

    // Check if container already has a map
    if (mapInstanceRef.current && (mapInstanceRef.current as any)._leaflet_id) {
      console.log('Container already has a map, skipping initialization');
      return;
    }

    // Additional check for any existing map instance
    if (mapRef.current.querySelector('.leaflet-container')) {
      console.log('Container has existing leaflet elements, skipping initialization');
      return;
    }

    // Check if container has proper dimensions
    const container = mapRef.current;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.log('Container has no dimensions, waiting...');
              setTimeout(() => {
          // Retry initialization after a short delay
          if (mapRef.current) {
            const newRect = mapRef.current.getBoundingClientRect();
            if (newRect.width > 0 && newRect.height > 0) {
              console.log('Container now has dimensions, retrying initialization');
              // Force re-render to trigger useEffect again
              setMap((prev: any) => prev);
            }
          }
        }, 200);
      return;
    }

    console.log('Map container ready for initialization');

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      try {
        console.log('Starting map initialization...');
        
        // Small delay to ensure container is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const L = await import('leaflet');
        
        // Fix for default markers
        (L.Icon.Default.prototype as any)._getIconUrl = () => {};
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Final check before creating map
        if (mapInstanceRef.current && (mapInstanceRef.current as any)._leaflet_id) {
          console.log('Map already exists, aborting initialization');
          return;
        }

        // Set initial view to a default location (you can change this)
        const mapInstance = L.map(mapRef.current).setView([17.4771, 78.5724], 13);
        
        // Add OpenStreetMap tiles with fallback
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
          minZoom: 1
        }).addTo(mapInstance);

        // Fallback to CartoDB if OpenStreetMap fails
        tileLayer.on('tileerror', () => {
          console.log('OpenStreetMap failed, trying CartoDB...');
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© CartoDB',
            maxZoom: 18,
            minZoom: 1
          }).addTo(mapInstance);
        });

        // Force a map refresh to ensure tiles load
        setTimeout(() => {
          try {
            if (mapInstance && mapInstance.invalidateSize) {
              mapInstance.invalidateSize();
            }
                  } catch (error: any) {
          console.error('Error invalidating map size:', error);
        }
        }, 100);

        mapInstanceRef.current = mapInstance;
        setMap(mapInstance);
        initializedRef.current = true;
        setMapReady(true);
        console.log('Map initialized successfully');
        
        // Debug: Check if tiles are loading
        mapInstance.on('load', () => {
          console.log('Map tiles loaded successfully');
          (mapInstance as any)._loaded = true;
        });
        
        mapInstance.on('tileloadstart', () => {
          console.log('Tile loading started');
        });
        
        mapInstance.on('tileerror', (error) => {
          console.error('Tile loading error:', error);
        });

        // Set map as loaded after a short delay
        setTimeout(() => {
          (mapInstance as any)._loaded = true;
          console.log('Map marked as loaded');
        }, 1000);
      } catch (error) {
        console.error('Error initializing map:', error);
        initializedRef.current = false;
      }
    };

    initMap();

    return () => {
      console.log('Cleaning up map...');
      try {
        if (mapInstanceRef.current) {
          // Check if map is still valid before removing
          if ((mapInstanceRef.current as any)._loaded && mapInstanceRef.current.remove) {
            mapInstanceRef.current.remove();
          }
          mapInstanceRef.current = null;
        }
        if (map) {
          // Check if map is still valid before removing
          if ((map as any)._loaded && map.remove) {
            map.remove();
          }
          setMap(null);
        }
        initializedRef.current = false;
        setMapReady(false);
      } catch (error) {
        console.error('Error cleaning up map:', error);
      }
    };
  }, []); // Remove mapKey dependency to prevent re-initialization

  // Update user location marker
  useEffect(() => {
    if (!map || !userLocation || !mapReady) return;

    const updateUserMarker = async () => {
      try {
        const L = await import('leaflet');
        
        // Check if map is ready
        if (!map._loaded || !mapReady) {
          console.log('Map not ready for user marker, waiting...');
          setTimeout(() => updateUserMarker(), 500);
          return;
        }
        
        // Remove existing user marker
        if (markers['user'] && map.hasLayer) {
          try {
            map.removeLayer(markers['user']);
          } catch (error) {
            console.log('Error removing user marker:', error);
          }
        }

        // Create new user marker with location icon
        const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
          icon: L.divIcon({
            className: 'custom-user-marker',
            html: '<div style="background-color: #1976d2; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        });

        // Check if map is still valid before adding marker
        if (map && map.addLayer) {
          userMarker.addTo(map);

          // Add popup with user info
          if (showUserInfo && userLocation.userInfo) {
            userMarker.bindPopup(`
              <div style="min-width: 220px; padding: 8px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="width: 12px; height: 12px; background-color: #1976d2; border-radius: 50%; margin-right: 8px;"></div>
                  <h4 style="margin: 0; color: #1976d2; font-size: 16px;">Your Location</h4>
                </div>
                <div style="font-size: 13px; line-height: 1.4;">
                  <p style="margin: 4px 0;"><strong>Accuracy:</strong> ${userLocation.accuracy ? `${Math.round(userLocation.accuracy)}m` : 'Unknown'}</p>
                  <p style="margin: 4px 0;"><strong>Last Updated:</strong> ${new Date(userLocation.timestamp).toLocaleTimeString()}</p>
                  <p style="margin: 4px 0;"><strong>Device:</strong> ${userLocation.userInfo.deviceType || 'Unknown'}</p>
                </div>
              </div>
            `);
          }

          // Center map on user location
          map.setView([userLocation.latitude, userLocation.longitude], 15);

          setMarkers(prev => ({ ...prev, user: userMarker }));

          // Handle marker click
          if (onLocationClick) {
            userMarker.on('click', () => onLocationClick(userLocation));
          }
        }
      } catch (error) {
        console.error('Error updating user marker:', error);
      }
    };

    updateUserMarker();
  }, [map, userLocation, showUserInfo, onLocationClick, mapReady]);

  // Update other users markers
  useEffect(() => {
    if (!map || !otherUsers.length || !mapReady) return;

    const updateOtherUsersMarkers = async () => {
      try {
        const L = await import('leaflet');
        
        // Check if map is ready
        if (!map._loaded || !mapReady) {
          console.log('Map not ready, waiting...');
          setTimeout(() => updateOtherUsersMarkers(), 500);
          return;
        }
        
        // Remove existing other user markers
        Object.values(markers).forEach(marker => {
          if (marker !== markers.user && marker && map.hasLayer) {
            try {
              map.removeLayer(marker);
            } catch (error) {
              console.log('Error removing marker:', error);
            }
          }
        });

        const newMarkers = { user: markers.user };

        // Add markers for other users
        otherUsers.forEach((user, index) => {
          if (user.lastLocation && user.lastLocation.latitude && user.lastLocation.longitude) {
            try {
              const userMarker = L.marker([user.lastLocation.latitude, user.lastLocation.longitude], {
                icon: L.divIcon({
                  className: 'custom-other-user-marker',
                  html: `<div style="background-color: #f57c00; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 28]
                })
              });

              // Check if map is still valid before adding marker
              if (map && map.addLayer) {
                userMarker.addTo(map);

                // Add popup with user info
                userMarker.bindPopup(`
                  <div style="min-width: 220px; padding: 8px;">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                      <div style="width: 12px; height: 12px; background-color: #f57c00; border-radius: 50%; margin-right: 8px;"></div>
                      <h4 style="margin: 0; color: #f57c00; font-size: 16px;">${(user as any)['userId']?.firstName || 'Unknown'} ${(user as any)['userId']?.lastName || 'User'}</h4>
                    </div>
                    <div style="font-size: 13px; line-height: 1.4;">
                      <p style="margin: 4px 0;"><strong>Status:</strong> ${(user as any).currentStatus || 'Unknown'}</p>
                      <p style="margin: 4px 0;"><strong>Device:</strong> ${(user as any).deviceInfo?.deviceType || 'Unknown'}</p>
                      <p style="margin: 4px 0;"><strong>Last Activity:</strong> ${(user as any).lastActivity ? new Date((user as any).lastActivity).toLocaleTimeString() : 'Unknown'}</p>
                      <p style="margin: 4px 0;"><strong>Distance:</strong> ${(user as any).totalDistance ? `${((user as any).totalDistance / 1000).toFixed(2)}km` : '0km'}</p>
                    </div>
                  </div>
                `);

                (newMarkers as any)[`user_${index}`] = userMarker;
              }
            } catch (error) {
              console.error('Error creating marker for user:', user, error);
            }
          }
        });

        setMarkers(newMarkers);
      } catch (error) {
        console.error('Error updating other users markers:', error);
      }
    };

    updateOtherUsersMarkers();
  }, [map, otherUsers, mapReady]);

  if (loading) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Paper sx={{ height, position: 'relative', overflow: 'hidden' }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          zIndex: 1,
          minHeight: '400px', // Ensure minimum height
          position: 'relative',
          display: 'block'
        }} 
      />
      {!userLocation && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 2,
            bgcolor: 'rgba(255,255,255,0.9)',
            p: 2,
            borderRadius: 1
          }}
        >
          <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            Waiting for location data...
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default LiveMap; 