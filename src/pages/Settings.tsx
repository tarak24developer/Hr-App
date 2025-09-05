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
  DialogActions
} from '@mui/material';
import { 
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import { useThemeStore } from '../stores/themeStore';
import { useFontSizeStore } from '../stores/fontSizeStore';

interface UserSettings {
  id: string;
  userId: string;
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    language: string;
    timezone: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    securityAlerts: boolean;
    systemUpdates: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    dataSharing: boolean;
    analytics: boolean;
  };
  updatedAt: Date;
  createdAt: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  location?: string;
}

const initialSettings: UserSettings = {
  id: '',
  userId: '',
  appearance: {
    theme: 'light',
    fontSize: 'medium',
    language: 'en',
    timezone: 'UTC'
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    securityAlerts: true,
    systemUpdates: true
  },
  security: {
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30,
    passwordExpiry: 90
  },
  privacy: {
    profileVisibility: 'private',
    dataSharing: false,
    analytics: true
  },
  updatedAt: new Date(),
  createdAt: new Date()
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  // Zustand stores for theme and font size
  const { theme: currentTheme, setTheme } = useThemeStore();
  const { fontSize: currentFontSize, setFontSize } = useFontSizeStore();

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
    { id: 'notifications', label: 'Notifications', icon: NotificationsIcon },
    { id: 'security', label: 'Security', icon: SecurityIcon },
    { id: 'account', label: 'Account', icon: PersonIcon },
    { id: 'privacy', label: 'Privacy', icon: SecurityIcon }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load user settings
      const settingsResult = await firebaseService.getCollection('userSettings');
      if (settingsResult?.success && settingsResult.data && settingsResult.data.length > 0) {
        const userSettings = settingsResult.data[0] as any;
        const transformedSettings: UserSettings = {
          id: userSettings['id'] || '',
          userId: userSettings['userId'] || '1',
          appearance: {
            theme: userSettings['appearance']?.theme || currentTheme,
            fontSize: (userSettings['appearance']?.fontSize || (currentFontSize === 'xs' ? 'small' : currentFontSize === 'sm' ? 'small' : currentFontSize === 'base' ? 'medium' : currentFontSize === 'lg' ? 'large' : currentFontSize === 'xl' ? 'large' : 'medium')) as 'small' | 'medium' | 'large',
            language: userSettings['appearance']?.language || 'en',
            timezone: userSettings['appearance']?.timezone || 'UTC'
          },
          notifications: {
            emailNotifications: userSettings['notifications']?.emailNotifications ?? true,
            pushNotifications: userSettings['notifications']?.pushNotifications ?? true,
            smsNotifications: userSettings['notifications']?.smsNotifications ?? false,
            marketingEmails: userSettings['notifications']?.marketingEmails ?? false,
            securityAlerts: userSettings['notifications']?.securityAlerts ?? true,
            systemUpdates: userSettings['notifications']?.systemUpdates ?? true
          },
          security: {
            twoFactorEnabled: userSettings['security']?.twoFactorEnabled ?? false,
            loginAlerts: userSettings['security']?.loginAlerts ?? true,
            sessionTimeout: userSettings['security']?.sessionTimeout || 30,
            passwordExpiry: userSettings['security']?.passwordExpiry || 90
          },
          privacy: {
            profileVisibility: userSettings['privacy']?.profileVisibility || 'private',
            dataSharing: userSettings['privacy']?.dataSharing ?? false,
            analytics: userSettings['privacy']?.analytics ?? true
          },
          updatedAt: userSettings['updatedAt'] ? new Date(userSettings['updatedAt']) : new Date(),
          createdAt: userSettings['createdAt'] ? new Date(userSettings['createdAt']) : new Date()
        };
        setSettings(transformedSettings);
        
        // Sync with Zustand stores
        setTheme(transformedSettings.appearance.theme);
        const fontSizeMap = {
          'small': 'sm' as const,
          'medium': 'base' as const,
          'large': 'lg' as const
        };
        setFontSize(fontSizeMap[transformedSettings.appearance.fontSize]);
      } else {
        // Create default settings if none exist
        const defaultSettings: UserSettings = {
          ...initialSettings,
          userId: '1', // TODO: Get from auth context
          appearance: {
            ...initialSettings.appearance,
            theme: currentTheme,
            fontSize: (currentFontSize === 'xs' ? 'small' : currentFontSize === 'sm' ? 'small' : currentFontSize === 'base' ? 'medium' : currentFontSize === 'lg' ? 'large' : currentFontSize === 'xl' ? 'large' : 'medium') as 'small' | 'medium' | 'large'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const result = await firebaseService.addDocument('userSettings', {
          ...defaultSettings,
          createdAt: defaultSettings.createdAt.toISOString(),
          updatedAt: defaultSettings.updatedAt.toISOString()
        });
        if (result?.success) {
          setSettings({ ...defaultSettings, id: (result as any).id || '' } as UserSettings);
        }
      }

      // Load user data
      const usersResult = await firebaseService.getCollection('users');
      if (usersResult?.success && usersResult.data && usersResult.data.length > 0) {
        const userData = usersResult.data[0] as any;
        const transformedUser: User = {
          id: userData['id'] || '',
          name: userData['firstName'] && userData['lastName'] ? `${userData['firstName']} ${userData['lastName']}` : userData['name'] || 'Unknown User',
          email: userData['email'] || '',
          role: userData['role'] || 'Employee',
          avatar: userData['avatar'] || undefined,
          phone: userData['phone'] || undefined,
          location: userData['location'] || undefined
        };
        setUser(transformedUser);
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const settingsData = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      let result: any;
      if (settings.id) {
        result = await firebaseService.updateDocument('userSettings', settings.id, settingsData);
      } else {
        result = await firebaseService.addDocument('userSettings', settingsData);
        if (result?.success) {
          setSettings(prev => ({ ...prev, id: (result as any).id || '' }));
        }
      }
      
      if (result?.success) {
        setSnackbar({
          open: true,
          message: 'Settings saved successfully',
          severity: 'success'
        });
      } else {
        throw new Error(result?.error || 'Failed to save settings');
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (section: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));

    // Apply changes immediately to Zustand stores for real-time updates
    if (section === 'appearance') {
      if (field === 'theme') {
        setTheme(value);
      } else if (field === 'fontSize') {
        const fontSizeMap = {
          'small': 'sm' as const,
          'medium': 'base' as const,
          'large': 'lg' as const
        };
        setFontSize(fontSizeMap[value as 'small' | 'medium' | 'large']);
      } else if (field === 'language') {
        // Apply language change
        document.documentElement.lang = value;
        localStorage.setItem('app-language', value);
      } else if (field === 'timezone') {
        // Store timezone preference
        localStorage.setItem('app-timezone', value);
      }
    } else if (section === 'notifications') {
      // Handle notification settings
      if (field === 'pushNotifications' && value === true) {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              setSnackbar({
                open: true,
                message: 'Push notifications enabled successfully',
                severity: 'success'
              });
            } else {
              setSnackbar({
                open: true,
                message: 'Push notifications permission denied',
                severity: 'warning'
              });
              // Revert the setting
              setSettings(prev => ({
                ...prev,
                notifications: {
                  ...prev.notifications,
                  pushNotifications: false
                }
              }));
            }
          });
        } else if (Notification.permission === 'denied') {
          setSnackbar({
            open: true,
            message: 'Push notifications are blocked. Please enable them in your browser settings.',
            severity: 'error'
          });
          // Revert the setting
          setSettings(prev => ({
            ...prev,
            notifications: {
              ...prev.notifications,
              pushNotifications: false
            }
          }));
        }
      }
      
      // Store notification preferences
      localStorage.setItem('notification-preferences', JSON.stringify({
        emailNotifications: section === 'notifications' && field === 'emailNotifications' ? value : settings.notifications.emailNotifications,
        pushNotifications: section === 'notifications' && field === 'pushNotifications' ? value : settings.notifications.pushNotifications,
        smsNotifications: section === 'notifications' && field === 'smsNotifications' ? value : settings.notifications.smsNotifications,
        marketingEmails: section === 'notifications' && field === 'marketingEmails' ? value : settings.notifications.marketingEmails,
        securityAlerts: section === 'notifications' && field === 'securityAlerts' ? value : settings.notifications.securityAlerts,
        systemUpdates: section === 'notifications' && field === 'systemUpdates' ? value : settings.notifications.systemUpdates
      }));
    } else if (section === 'security') {
      // Store security preferences
      localStorage.setItem('security-preferences', JSON.stringify({
        twoFactorEnabled: section === 'security' && field === 'twoFactorEnabled' ? value : settings.security.twoFactorEnabled,
        loginAlerts: section === 'security' && field === 'loginAlerts' ? value : settings.security.loginAlerts,
        sessionTimeout: section === 'security' && field === 'sessionTimeout' ? value : settings.security.sessionTimeout,
        passwordExpiry: section === 'security' && field === 'passwordExpiry' ? value : settings.security.passwordExpiry
      }));
    } else if (section === 'privacy') {
      // Store privacy preferences
      localStorage.setItem('privacy-preferences', JSON.stringify({
        profileVisibility: section === 'privacy' && field === 'profileVisibility' ? value : settings.privacy.profileVisibility,
        dataSharing: section === 'privacy' && field === 'dataSharing' ? value : settings.privacy.dataSharing,
        analytics: section === 'privacy' && field === 'analytics' ? value : settings.privacy.analytics
      }));
    }
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

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from your HR App settings',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
      setSnackbar({
        open: true,
        message: 'Test notification sent!',
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Notifications are not enabled or permission is denied',
        severity: 'warning'
      });
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
            Loading Settings...
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
                Settings
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Manage your account settings and preferences
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadSettings}
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
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveSettings}
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
                {saving ? <CircularProgress size={20} /> : 'Save Settings'}
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

      {/* Settings Container */}
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
                  onClick={() => setActiveTab(tab.id)}
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
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Theme
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={settings.appearance.theme}
                        label="Theme"
                        onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto (System)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Font Size
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Font Size</InputLabel>
                      <Select
                        value={settings.appearance.fontSize}
                        label="Font Size"
                        onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="small">Small</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="large">Large</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Language
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={settings.appearance.language}
                        label="Language"
                        onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Español</MenuItem>
                        <MenuItem value="fr">Français</MenuItem>
                        <MenuItem value="de">Deutsch</MenuItem>
                        <MenuItem value="it">Italiano</MenuItem>
                        <MenuItem value="pt">Português</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Time Zone
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Time Zone</InputLabel>
                      <Select
                        value={settings.appearance.timezone}
                        label="Time Zone"
                        onChange={(e) => handleSettingChange('appearance', 'timezone', e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="UTC">UTC</MenuItem>
                        <MenuItem value="EST">Eastern Time</MenuItem>
                        <MenuItem value="CST">Central Time</MenuItem>
                        <MenuItem value="MST">Mountain Time</MenuItem>
                        <MenuItem value="PST">Pacific Time</MenuItem>
                        <MenuItem value="IST">India Standard Time</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Email Notifications
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.emailNotifications}
                          onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                        />
                      }
                      label="Email Notifications"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Receive important updates via email
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Push Notifications
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.pushNotifications}
                          onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                        />
                      }
                      label="Push Notifications"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Receive notifications in your browser
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      SMS Notifications
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.smsNotifications}
                          onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                        />
                      }
                      label="SMS Notifications"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Receive urgent alerts via SMS
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Marketing Emails
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.marketingEmails}
                          onChange={(e) => handleSettingChange('notifications', 'marketingEmails', e.target.checked)}
                        />
                      }
                      label="Marketing Emails"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Receive promotional content and updates
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Security Alerts
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.securityAlerts}
                          onChange={(e) => handleSettingChange('notifications', 'securityAlerts', e.target.checked)}
                        />
                      }
                      label="Security Alerts"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Get notified about security-related events
                    </Typography>
                  </Box>

                                    <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      System Updates
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.systemUpdates}
                          onChange={(e) => handleSettingChange('notifications', 'systemUpdates', e.target.checked)}
                        />
                      }
                      label="System Updates"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Receive notifications about system updates
                    </Typography>
                  </Box>

                  <Box sx={{ gridColumn: '1 / -1', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={testNotification}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: '600',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          bgcolor: 'primary.50',
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Test Push Notification
                    </Button>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Click to test if push notifications are working
                    </Typography>
                  </Box>
                </Box>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Two-Factor Authentication
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.security.twoFactorEnabled}
                          onChange={(e) => handleSettingChange('security', 'twoFactorEnabled', e.target.checked)}
                        />
                      }
                      label="Enable 2FA"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Add an extra layer of security to your account
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Login Alerts
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.security.loginAlerts}
                          onChange={(e) => handleSettingChange('security', 'loginAlerts', e.target.checked)}
                        />
                      }
                      label="Login Alerts"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Get notified when someone logs into your account
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Session Timeout
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Session Timeout (minutes)</InputLabel>
                      <Select
                        value={settings.security.sessionTimeout}
                        label="Session Timeout (minutes)"
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value={15}>15 minutes</MenuItem>
                        <MenuItem value={30}>30 minutes</MenuItem>
                        <MenuItem value={60}>1 hour</MenuItem>
                        <MenuItem value={120}>2 hours</MenuItem>
                        <MenuItem value={480}>8 hours</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Password Expiry
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Password Expiry (days)</InputLabel>
                      <Select
                        value={settings.security.passwordExpiry}
                        label="Password Expiry (days)"
                        onChange={(e) => handleSettingChange('security', 'passwordExpiry', e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value={30}>30 days</MenuItem>
                        <MenuItem value={60}>60 days</MenuItem>
                        <MenuItem value={90}>90 days</MenuItem>
                        <MenuItem value={180}>180 days</MenuItem>
                        <MenuItem value={365}>1 year</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Button
                      variant="outlined"
                      startIcon={<LockIcon />}
                      onClick={() => setShowPasswordDialog(true)}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: '600',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          bgcolor: 'primary.50',
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Box>
          )}

          {/* Account Tab */}
              {activeTab === 'account' && user && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  <Box sx={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <PersonIcon sx={{ fontSize: 32 }} />
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {user.role}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Email
                    </Typography>
                    <TextField
                      fullWidth
                      value={user.email}
                      disabled
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Phone
                    </Typography>
                    <TextField
                      fullWidth
                      value={user.phone || 'Not provided'}
                      disabled
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Location
                    </Typography>
                    <TextField
                      fullWidth
                      value={user.location || 'Not provided'}
                      disabled
                      InputProps={{
                        startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Member Since
                    </Typography>
                    <TextField
                      fullWidth
                      value={settings.createdAt.toLocaleDateString()}
                      disabled
                      InputProps={{
                        startAdornment: <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>
                </Box>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Profile Visibility
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Profile Visibility</InputLabel>
                      <Select
                        value={settings.privacy.profileVisibility}
                        label="Profile Visibility"
                        onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                        <MenuItem value="friends">Friends Only</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Data Sharing
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.privacy.dataSharing}
                          onChange={(e) => handleSettingChange('privacy', 'dataSharing', e.target.checked)}
                        />
                      }
                      label="Allow Data Sharing"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Allow sharing of anonymized data for research
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                      Analytics
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.privacy.analytics}
                          onChange={(e) => handleSettingChange('privacy', 'analytics', e.target.checked)}
                        />
                      }
                      label="Usage Analytics"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Help improve the app by sharing usage analytics
                    </Typography>
                  </Box>
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
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  fullWidth
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                
                <TextField
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  fullWidth
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                
                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  fullWidth
                  required
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

export default Settings;
