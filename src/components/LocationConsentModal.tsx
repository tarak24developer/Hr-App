import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Shield as ShieldIcon,
  PrivacyTip as PrivacyIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

interface LocationConsentModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

const LocationConsentModal: React.FC<LocationConsentModalProps> = ({
  open,
  onClose,
  onAccept,
  onDecline
}) => {
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [locationAccepted, setLocationAccepted] = useState(false);

  const handleAccept = () => {
    if (privacyAccepted && locationAccepted) {
      onAccept();
        onClose();
    }
  };

  const handleDecline = () => {
    onDecline();
      onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'primary.50',
        display: 'flex', 
        alignItems: 'center', 
              justifyContent: 'center'
            }}
          >
            <LocationIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">
        Location Tracking Consent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enable location tracking for enhanced features
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
            Location tracking helps us provide better services and ensure workplace safety. 
            Your location data is encrypted and stored securely.
              </Typography>
            </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldIcon color="primary" />
            What we track
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                Your current location (latitude and longitude)
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Device information (browser, operating system)
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Online/offline status
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Last activity timestamp
              </Typography>
            </li>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PrivacyIcon color="primary" />
            Privacy & Security
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                Location data is encrypted and stored securely
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Only authorized personnel can access your location
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                You can disable tracking at any time
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Location data is not shared with third parties
              </Typography>
            </li>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={locationAccepted}
                onChange={(e) => setLocationAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I consent to location tracking for workplace safety and service improvement
              </Typography>
            }
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                I understand and agree to the privacy policy and data handling practices
            </Typography>
            }
          />
            </Box>

        {privacyAccepted && locationAccepted && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon />
              <Typography variant="body2">
                Ready to enable location tracking
              </Typography>
            </Box>
              </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
          onClick={handleDecline}
            variant="outlined"
          color="inherit"
          sx={{ minWidth: 120 }}
          >
            Decline
          </Button>
          <Button
          onClick={handleAccept}
            variant="contained"
          disabled={!privacyAccepted || !locationAccepted}
          sx={{ minWidth: 120 }}
          >
          Accept & Enable
          </Button>
        </DialogActions>
    </Dialog>
  );
};

export default LocationConsentModal;