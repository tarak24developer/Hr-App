import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Snackbar,
  Container,
  Stack,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch
} from '@mui/material';
import { 
  Edit, 
  Save, 
  X, 
  Camera,
  Shield,
  Bell,
  UserCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { useUser } from '@/stores/authStore';
import userService from '@/services/userService';
import { User as UserType } from '@/types';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  position: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const Profile: React.FC = () => {
  const currentUser = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    department: '',
    position: '',
    hireDate: '',
    status: 'active',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  // Load user data from Firebase
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.id) return;
      
      try {
        setLoading(true);
        const result = await userService.getUser(currentUser.id);
        if (result.success && result.data) {
          const userData = result.data as UserType;
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            department: userData.department || '',
            position: userData.position || '',
            hireDate: userData.hireDate || '',
            status: userData.status || 'active',
            emergencyContact: userData.emergencyContact || {
              name: '',
              phone: '',
              relationship: ''
            }
          });
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser?.id]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmergencyContactChange = (field: keyof ProfileFormData['emergencyContact'], value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    
    try {
      setSaving(true);
      setError('');
      
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        department: formData.department,
        position: formData.position,
        emergencyContact: formData.emergencyContact,
        updatedAt: new Date().toISOString()
      };

      const result = await userService.updateUser(currentUser.id, updateData);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success'
        });
    setIsEditing(false);
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save profile',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (currentUser) {
    setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        department: currentUser.department || '',
        position: currentUser.position || '',
        hireDate: currentUser.hireDate || '',
        status: currentUser.status || 'active',
        emergencyContact: currentUser.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        }
      });
    }
    setIsEditing(false);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircle },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'preferences', name: 'Preferences', icon: SettingsIcon }
  ] as const;

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your personal information and preferences
            </Typography>
          </Box>
        {!isEditing && (
            <Button
              variant="contained"
              startIcon={<Edit size={20} />}
            onClick={() => setIsEditing(true)}
              sx={{ minWidth: 140 }}
          >
              Edit Profile
            </Button>
        )}
        </Box>

      {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
                <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                  startIcon={<Icon size={18} />}
                  variant={activeTab === tab.id ? 'contained' : 'text'}
                  sx={{
                    borderRadius: 0,
                    borderBottom: activeTab === tab.id ? 2 : 0,
                    borderColor: 'primary.main',
                    minWidth: 120,
                    justifyContent: 'flex-start'
                  }}
                >
                  {tab.name}
                </Button>
            );
          })}
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Stack spacing={3}>
          {/* Avatar Section */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Box position="relative">
                <Avatar
                  src={avatarFile ? URL.createObjectURL(avatarFile) : ''}
                  sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                >
                  <UserCircle size={40} />
                </Avatar>
                {isEditing && (
                  <IconButton
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: -5,
                      right: -5,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 32,
                      height: 32
                    }}
                  >
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      hidden
                    />
                  </IconButton>
                )}
              </Box>
              <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {formData.firstName} {formData.lastName}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {formData.position}
                </Typography>
                <Chip 
                  label={formData.department} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            </Box>
          </Paper>

          {/* Personal Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3 }}>
              Personal Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  sx={{ flex: 1, minWidth: 200 }}
                  required
                />
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  sx={{ flex: 1, minWidth: 200 }}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  disabled
                  sx={{ flex: 1, minWidth: 200 }}
                  helperText="Email cannot be changed"
                />
                <TextField
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Box>
              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
                fullWidth
                multiline
                rows={2}
              />
            </Box>
          </Paper>


          {/* Employment Information */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3 }}>
              Employment Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  disabled={!isEditing}
                  sx={{ flex: 1, minWidth: 200 }}
                  required
                />
                <TextField
                  label="Position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  disabled={!isEditing}
                  sx={{ flex: 1, minWidth: 200 }}
                  required
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Hire Date"
                  type="date"
                  value={formData.hireDate}
                  disabled
                  sx={{ flex: 1, minWidth: 200 }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Hire date cannot be changed"
                />
                <FormControl sx={{ flex: 1, minWidth: 200 }} disabled>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="terminated">Terminated</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>

          {/* Emergency Contact */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3 }}>
              Emergency Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Contact Name"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                  disabled={!isEditing}
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <TextField
                  label="Phone Number"
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                  disabled={!isEditing}
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Box>
              <TextField
                label="Relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                disabled={!isEditing}
                fullWidth
              />
            </Box>
          </Paper>

          {/* Action Buttons */}
          {isEditing && (
            <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<X size={18} />}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={18} /> : <Save size={18} />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Stack>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3 }}>
              Security Settings
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Change Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update your password regularly for security
                  </Typography>
                </Box>
                <Button variant="contained" size="small">
                  Change
                </Button>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Two-Factor Authentication
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add an extra layer of security to your account
                  </Typography>
                </Box>
                <Button variant="outlined" size="small">
                  Enable
                </Button>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Login Sessions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your active login sessions
                  </Typography>
                </Box>
                <Button variant="outlined" size="small">
                  View
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3 }}>
              Notification Preferences
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Email Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive notifications via email
                  </Typography>
                </Box>
                <Switch defaultChecked />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Push Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive push notifications on your device
                  </Typography>
                </Box>
                <Switch />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    SMS Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive notifications via SMS
                  </Typography>
                </Box>
                <Switch />
              </Box>
            </Stack>
          </Paper>
        </Stack>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 3 }}>
              Account Preferences
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Language
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose your preferred language
                  </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select defaultValue="english">
                    <MenuItem value="english">English</MenuItem>
                    <MenuItem value="spanish">Spanish</MenuItem>
                    <MenuItem value="french">French</MenuItem>
                    <MenuItem value="german">German</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Time Zone
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Set your local time zone
                  </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select defaultValue="utc-5">
                    <MenuItem value="utc-5">UTC-5 (Eastern Time)</MenuItem>
                    <MenuItem value="utc-6">UTC-6 (Central Time)</MenuItem>
                    <MenuItem value="utc-7">UTC-7 (Mountain Time)</MenuItem>
                    <MenuItem value="utc-8">UTC-8 (Pacific Time)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Date Format
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose your preferred date format
                  </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select defaultValue="mm-dd-yyyy">
                    <MenuItem value="mm-dd-yyyy">MM/DD/YYYY</MenuItem>
                    <MenuItem value="dd-mm-yyyy">DD/MM/YYYY</MenuItem>
                    <MenuItem value="yyyy-mm-dd">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
