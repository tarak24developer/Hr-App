import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Avatar,
  CircularProgress,
  Fade,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Badge as BadgeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CameraAlt as CameraIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import { useUser } from '../stores/authStore';

interface ProfileData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
  department: string;
  position: string;
  employeeId: string;
  startDate: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  updatedAt: Date;
  createdAt: Date;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  lastPasswordChange?: Date;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  systemUpdates: boolean;
}

interface Preferences {
  language: string;
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
}

const Profile: React.FC = () => {
  const currentUser = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    securityAlerts: true,
    systemUpdates: true
  });
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: PersonIcon },
    { id: 'security', label: 'Security', icon: SecurityIcon },
    { id: 'notifications', label: 'Notifications', icon: NotificationsIcon },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon }
  ];

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load user profile data
      const profileResult = await firebaseService.getCollection('userProfiles');
      if (profileResult?.success && profileResult.data && profileResult.data.length > 0) {
        const userProfile = profileResult.data[0] as any;
        const transformedProfile: ProfileData = {
          id: userProfile['id'] || '',
          userId: userProfile['userId'] || currentUser?.id || '1',
          firstName: userProfile['firstName'] || currentUser?.firstName || '',
          lastName: userProfile['lastName'] || currentUser?.lastName || '',
          email: userProfile['email'] || currentUser?.email || '',
          phone: userProfile['phone'] || '',
          address: userProfile['address'] || '',
          city: userProfile['city'] || '',
          state: userProfile['state'] || '',
          zipCode: userProfile['zipCode'] || '',
          dateOfBirth: userProfile['dateOfBirth'] || '',
          department: userProfile['department'] || '',
          position: userProfile['position'] || '',
          employeeId: userProfile['employeeId'] || '',
          startDate: userProfile['startDate'] || '',
          avatar: userProfile['avatar'] || undefined,
          bio: userProfile['bio'] || '',
          skills: userProfile['skills'] || [],
          emergencyContact: userProfile['emergencyContact'] || undefined,
          updatedAt: userProfile['updatedAt'] ? new Date(userProfile['updatedAt']) : new Date(),
          createdAt: userProfile['createdAt'] ? new Date(userProfile['createdAt']) : new Date()
        };
        setProfileData(transformedProfile);
      } else {
        // Create default profile if none exist
        const defaultProfile: ProfileData = {
          id: '',
          userId: currentUser?.id || '1',
          firstName: currentUser?.firstName || '',
          lastName: currentUser?.lastName || '',
          email: currentUser?.email || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          dateOfBirth: '',
          department: '',
          position: '',
          employeeId: '',
          startDate: '',
          bio: '',
          skills: [],
          updatedAt: new Date(),
          createdAt: new Date()
        } as ProfileData;
        setProfileData(defaultProfile);
      }

      // Load security settings
      const securityResult = await firebaseService.getCollection('userSecuritySettings');
      if (securityResult?.success && securityResult.data && securityResult.data.length > 0) {
        const security = securityResult.data[0] as any;
        setSecuritySettings({
          twoFactorEnabled: security['twoFactorEnabled'] ?? false,
          loginAlerts: security['loginAlerts'] ?? true,
          sessionTimeout: security['sessionTimeout'] || 30,
          ...(security['lastPasswordChange'] && { lastPasswordChange: new Date(security['lastPasswordChange']) })
        } as SecuritySettings);
      }

      // Load notification settings
      const notificationResult = await firebaseService.getCollection('userNotificationSettings');
      if (notificationResult?.success && notificationResult.data && notificationResult.data.length > 0) {
        const notifications = notificationResult.data[0] as any;
        setNotificationSettings({
          emailNotifications: notifications['emailNotifications'] ?? true,
          pushNotifications: notifications['pushNotifications'] ?? true,
          smsNotifications: notifications['smsNotifications'] ?? false,
          marketingEmails: notifications['marketingEmails'] ?? false,
          securityAlerts: notifications['securityAlerts'] ?? true,
          systemUpdates: notifications['systemUpdates'] ?? true
        });
      }

      // Load preferences
      const preferencesResult = await firebaseService.getCollection('userPreferences');
      if (preferencesResult?.success && preferencesResult.data && preferencesResult.data.length > 0) {
        const prefs = preferencesResult.data[0] as any;
        setPreferences({
          language: prefs['language'] || 'en',
          timezone: prefs['timezone'] || 'UTC',
          dateFormat: prefs['dateFormat'] || 'MM/DD/YYYY',
          theme: prefs['theme'] || 'light'
        });
      }
    } catch (err: any) {
      console.error('Error loading profile data:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const saveProfileData = async () => {
    if (!profileData) return;
    
    try {
      setSaving(true);
      
      const profileDataToSave = {
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      let result: any;
      if (profileData.id) {
        result = await firebaseService.updateDocument('userProfiles', profileData.id, profileDataToSave);
      } else {
        result = await firebaseService.addDocument('userProfiles', profileDataToSave);
        if (result?.success) {
          setProfileData(prev => prev ? { ...prev, id: (result as any).id || '' } : null);
        }
      }
      
      if (result?.success) {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success'
        });
    setIsEditing(false);
      } else {
        throw new Error(result?.error || 'Failed to save profile');
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save profile',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSecurityChange = (field: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: keyof Preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long',
        severity: 'error'
      });
      return;
    }

    // Check for password strength
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumbers = /\d/.test(passwordData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setSnackbar({
        open: true,
        message: 'Password must contain uppercase, lowercase, numbers, and special characters',
        severity: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      
      // Simulate password change (in real app, this would call Firebase Auth)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSnackbar({
        open: true,
        message: 'Password changed successfully',
        severity: 'success'
      });
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Update last password change date
      setSecuritySettings(prev => ({ ...prev, lastPasswordChange: new Date() }));
    } catch (err: any) {
      console.error('Error changing password:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to change password',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload to Firebase Storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleProfileChange('avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        bgcolor: 'grey.50'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Loading Profile...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Fade in timeout={300}>
        <Box>
      {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Profile
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Manage your personal information and preferences
              </Typography>
            </Box>
        {!isEditing && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Edit Profile
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Profile Container */}
          <Card sx={{ 
            bgcolor: 'white', 
            boxShadow: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}>
      {/* Tab Navigation */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'grey.200' }}>
              <Stack direction="row" spacing={0}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
                    <Button
                key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      startIcon={<Icon />}
                      sx={{
                        borderRadius: 0,
                        px: 3,
                        py: 2,
                        textTransform: 'none',
                        fontWeight: '600',
                        borderBottom: activeTab === tab.id ? '3px solid' : '3px solid transparent',
                        borderColor: activeTab === tab.id ? 'primary.main' : 'transparent',
                        color: activeTab === tab.id ? 'primary.main' : 'text.secondary',
                        bgcolor: activeTab === tab.id ? 'primary.50' : 'transparent',
                        '&:hover': {
                          bgcolor: activeTab === tab.id ? 'primary.100' : 'grey.50',
                          color: activeTab === tab.id ? 'primary.dark' : 'text.primary'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {tab.label}
                    </Button>
            );
          })}
              </Stack>
            </Box>

            {/* Tab Content */}
            <CardContent sx={{ p: 3 }}>
      {/* Profile Tab */}
              {activeTab === 'profile' && profileData && (
                <Box sx={{ display: 'grid', gap: 3 }}>
          {/* Avatar Section */}
                  <Card sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={profileData.avatar || ''}
                          sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                        >
                          <PersonIcon sx={{ fontSize: 40 }} />
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
                              '&:hover': { bgcolor: 'primary.dark' }
                            }}
                          >
                            <CameraIcon />
                    <input
                      type="file"
                      accept="image/*"
                              onChange={handleAvatarUpload}
                              hidden
                            />
                          </IconButton>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {profileData.firstName} {profileData.lastName}
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                          {profileData.position || 'Position not set'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {profileData.department || 'Department not set'}
                        </Typography>
                        {profileData.employeeId && (
                          <Chip
                            label={`ID: ${profileData.employeeId}`}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Card>

          {/* Personal Information */}
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Personal Information
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                      <TextField
                        label="First Name"
                        value={profileData.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label="Last Name"
                        value={profileData.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label="Email"
                   type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label="Phone"
                   type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        InputProps={{
                          startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label="Date of Birth"
                   type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        InputProps={{
                          startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                  </Card>

           {/* Address Information */}
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Address Information
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                      <TextField
                        label="Street Address"
                        value={profileData.address}
                        onChange={(e) => handleProfileChange('address', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        sx={{ 
                          gridColumn: { xs: '1', md: '1 / -1' },
                          '& .MuiOutlinedInput-root': { borderRadius: 2 }
                        }}
                        InputProps={{
                          startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                      <TextField
                        label="City"
                        value={profileData.city}
                        onChange={(e) => handleProfileChange('city', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label="State"
                        value={profileData.state}
                        onChange={(e) => handleProfileChange('state', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label="ZIP Code"
                        value={profileData.zipCode}
                        onChange={(e) => handleProfileChange('zipCode', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                  </Card>

           {/* Employment Information */}
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Employment Information
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                      <TextField
                        label="Employee ID"
                        value={profileData.employeeId}
                        onChange={(e) => handleProfileChange('employeeId', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        InputProps={{
                          startAdornment: <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label="Start Date"
                   type="date"
                        value={profileData.startDate}
                        onChange={(e) => handleProfileChange('startDate', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        InputProps={{
                          startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label="Department"
                        value={profileData.department}
                        onChange={(e) => handleProfileChange('department', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        InputProps={{
                          startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label="Position"
                        value={profileData.position}
                        onChange={(e) => handleProfileChange('position', e.target.value)}
                   disabled={!isEditing}
                        fullWidth
                        InputProps={{
                          startAdornment: <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                  </Card>

          {/* Action Buttons */}
          {isEditing && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => setIsEditing(false)}
                        sx={{ 
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: '600',
                          borderColor: 'grey.400',
                          color: 'text.secondary',
                          '&:hover': {
                            borderColor: 'grey.600',
                            bgcolor: 'grey.50',
                            transform: 'translateY(-1px)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={saveProfileData}
                        disabled={saving}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                          },
                          transition: 'all 0.3s ease',
                          '&:disabled': {
                            bgcolor: 'grey.400',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        {saving ? <CircularProgress size={20} /> : 'Save Changes'}
                      </Button>
                    </Box>
                  )}
                </Box>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Security Settings
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                            Change Password
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Update your password regularly for security
                          </Typography>
                          {securitySettings.lastPasswordChange && (
                            <Typography variant="caption" color="textSecondary">
                              Last changed: {securitySettings.lastPasswordChange.toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                        <Button
                          variant="contained"
                          startIcon={<LockIcon />}
                          onClick={() => setShowPasswordDialog(true)}
                          sx={{ 
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: '600'
                          }}
                        >
                Change
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                            Two-Factor Authentication
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Add an extra layer of security to your account
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={securitySettings.twoFactorEnabled}
                              onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)}
                            />
                          }
                          label=""
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                            Login Alerts
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Get notified when someone logs into your account
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={securitySettings.loginAlerts}
                              onChange={(e) => handleSecurityChange('loginAlerts', e.target.checked)}
                            />
                          }
                          label=""
                        />
                      </Box>
                    </Box>
                  </Card>
                </Box>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Notification Preferences
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                            Email Notifications
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Receive notifications via email
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={notificationSettings.emailNotifications}
                              onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                            />
                          }
                          label=""
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                            Push Notifications
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Receive push notifications in the app
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={notificationSettings.pushNotifications}
                              onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                            />
                          }
                          label=""
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                            SMS Notifications
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Receive notifications via SMS
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={notificationSettings.smsNotifications}
                              onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                            />
                          }
                          label=""
                        />
                      </Box>
                    </Box>
                  </Card>
                </Box>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Account Preferences
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Language</InputLabel>
                        <Select
                          value={preferences.language}
                          label="Language"
                          onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="es">Español</MenuItem>
                          <MenuItem value="fr">Français</MenuItem>
                          <MenuItem value="de">Deutsch</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Time Zone</InputLabel>
                        <Select
                          value={preferences.timezone}
                          label="Time Zone"
                          onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="UTC">UTC</MenuItem>
                          <MenuItem value="EST">Eastern Time</MenuItem>
                          <MenuItem value="CST">Central Time</MenuItem>
                          <MenuItem value="MST">Mountain Time</MenuItem>
                          <MenuItem value="PST">Pacific Time</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl fullWidth>
                        <InputLabel>Date Format</InputLabel>
                        <Select
                          value={preferences.dateFormat}
                          label="Date Format"
                          onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                          <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                          <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Card>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Password Change Dialog */}
          <Dialog 
            open={showPasswordDialog} 
            onClose={() => setShowPasswordDialog(false)} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: 'grey.200'
              }
            }}
          >
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              Change Password
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'grid', gap: 3 }}>
                <TextField
                  label="Current Password"
                  type={showPassword.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                        edge="end"
                      >
                        {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                
                <TextField
                  label="New Password"
                  type={showPassword.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        edge="end"
                      >
                        {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                
                <TextField
                  label="Confirm New Password"
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        edge="end"
                      >
                        {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={() => setShowPasswordDialog(false)}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: 'grey.400',
                  color: 'text.secondary',
                  fontWeight: '600',
                  '&:hover': {
                    borderColor: 'grey.600',
                    bgcolor: 'grey.50',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handlePasswordChange}
                disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: '600',
                  bgcolor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease',
                  '&:disabled': {
                    bgcolor: 'grey.400',
                    boxShadow: 'none'
                  }
                }}
              >
                {saving ? <CircularProgress size={20} /> : 'Change Password'}
              </Button>
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
      </Fade>
    </Box>
  );
};

export default Profile;
