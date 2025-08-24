import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  DeviceHub as DeviceIcon,
} from '@mui/icons-material';

interface LocationConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConsent: (consent: boolean) => void;
}

interface DeviceInfo {
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

const LocationConsentModal: React.FC<LocationConsentModalProps> = ({ open, onClose, onConsent }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [checkingConsent, setCheckingConsent] = useState(false);

  useEffect(() => {
    if (open) {
      checkExistingConsent();
    }
  }, [open]);

  const checkExistingConsent = async () => {
    try {
      setCheckingConsent(true);
      console.log('Checking existing consent...');
      
      // Mock implementation - check localStorage instead of Firebase
      const existingConsent = localStorage.getItem('locationConsent');
      if (existingConsent === 'true') {
        onConsent(true);
        onClose();
        return;
      }
      
      // No existing consent, show device info
      getDeviceInfo();
    } catch (error) {
      console.error('Error checking existing consent:', error);
      // If error, show device info anyway
      getDeviceInfo();
    } finally {
      setCheckingConsent(false);
    }
  };

  const getDeviceInfo = () => {
    const info: DeviceInfo = {
      userAgent: navigator.userAgent,
      browser: getBrowserInfo(),
      browserVersion: getBrowserVersion(),
      os: getOSInfo(),
      osVersion: getOSVersion(),
      deviceType: getDeviceType(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
    setDeviceInfo(info);
  };

  const getBrowserInfo = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const getBrowserVersion = (): string => {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(chrome|firefox|safari|edge)\/(\d+)/i);
    return match ? match[2] : 'Unknown';
  };

  const getOSInfo = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  };

  const getOSVersion = (): string => {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Unknown';
  };

  const getDeviceType = (): string => {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  };

  const handleConsent = async (consent: boolean) => {
    try {
      setLoading(true);
      setError('');

      console.log('Saving consent to localStorage...');
      // Mock implementation - save to localStorage instead of Firebase
      localStorage.setItem('locationConsent', consent.toString());

      onConsent(consent);
      onClose();
    } catch (error) {
      console.error('Error updating consent:', error);
      setError('Failed to update consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationRequest = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location access granted');
          handleConsent(true);
        },
        (error) => {
          console.log('Location access denied:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
            TIMEOUT: error.TIMEOUT
          });
          setError('Location access is required for tracking. Please allow location access in your browser settings.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText'
      }}>
        <LocationIcon />
        Location Tracking Consent
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {checkingConsent ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Checking existing consent...
            </Typography>
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                This application would like to access your location to provide location-based services.
                Your location data will be used for:
              </Typography>
            </Alert>

            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Real-time location tracking"
                  secondary="Track your location during office hours"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Distance calculation"
                  secondary="Calculate total distance traveled during work hours"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Device information"
                  secondary="Collect basic device and browser information"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DeviceIcon color="primary" />
              Device Information
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              <Chip label={`Browser: ${deviceInfo?.browser} ${deviceInfo?.browserVersion}`} size="small" />
              <Chip label={`OS: ${deviceInfo?.os}`} size="small" />
              <Chip label={`Device: ${deviceInfo?.deviceType}`} size="small" />
              <Chip label={`Screen: ${deviceInfo?.screenResolution}`} size="small" />
              <Chip label={`Timezone: ${deviceInfo?.timezone}`} size="small" />
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Privacy Notice:</strong> Your location data will be stored securely and only accessible to authorized administrators. 
                You can revoke consent at any time through your account settings.
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      {!checkingConsent && (
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => handleConsent(false)}
            disabled={loading}
            startIcon={<CancelIcon />}
            variant="outlined"
            color="error"
          >
            Decline
          </Button>
          
          <Button
            onClick={handleLocationRequest}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            variant="contained"
            color="primary"
          >
            {loading ? 'Processing...' : 'Allow Location Access'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default LocationConsentModal;