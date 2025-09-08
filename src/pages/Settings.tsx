import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Container,
  Stack,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Shield,
  Save,
  CheckCircle as CheckCircleIcon,
  Error as AlertCircleIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RotateCcwIcon,
  Palette,
  Notifications as BellIcon,
  Person as UserIcon,
  Language as GlobeIcon,
  TextFields as TypeIcon,
  WbSunny as SunIcon,
  Nightlight as MoonIcon,
  Computer as MonitorIcon
} from '@mui/icons-material';
import { useThemeActions } from '@/stores/themeStore';
import { useFontSizeStore, type FontSize } from '@/stores/fontSizeStore';
import { settingsService } from '../services/settingsService';
import { UserSettings, NotificationSettings, PrivacySettings, Theme, NotificationType } from '../types';
import { useAuthStore } from '../stores/authStore';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { setTheme } = useThemeActions();
  const { fontSize, setFontSize, resetFontSize } = useFontSizeStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('appearance');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    sms: false,
    types: ['info', 'success', 'warning', 'error', 'system']
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'team-only',
    locationSharing: false,
    activityTracking: true
  });
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  
  // Security state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [loginHistoryOpen, setLoginHistoryOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  const fontSizes: { value: FontSize; label: string; preview: string }[] = [
    { value: 'xs', label: 'Extra Small', preview: 'Aa' },
    { value: 'sm', label: 'Small', preview: 'Aa' },
    { value: 'base', label: 'Base', preview: 'Aa' },
    { value: 'lg', label: 'Large', preview: 'Aa' },
    { value: 'xl', label: 'Extra Large', preview: 'Aa' },
    { value: '2xl', label: '2X Large', preview: 'Aa' },
  ];

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'language', label: 'Language', icon: GlobeIcon },
  ];

  const getFontSizeClass = (size: FontSize) => {
    const sizeMap = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    };
    return sizeMap[size];
  };

  // Load user settings on component mount
  useEffect(() => {
    if (user?.id) {
      loadUserSettings();
    }
  }, [user?.id]);

  const loadUserSettings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const settings = await settingsService.getUserSettings(user.id);
      if (settings) {
        setUserSettings(settings);
        setNotificationSettings(settings.notifications);
        setPrivacySettings(settings.privacy);
        setLanguage(settings.language);
        setTimezone(settings.timezone);
      } else {
        // Use default settings if none exist
        const defaultSettings = settingsService.getDefaultSettings();
        setUserSettings(defaultSettings);
        setNotificationSettings(defaultSettings.notifications);
        setPrivacySettings(defaultSettings.privacy);
        setLanguage(defaultSettings.language);
        setTimezone(defaultSettings.timezone);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setSnackbar({ open: true, message: text, severity: type });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSaveSettings = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const success = await settingsService.saveUserSettings(user.id, {
        theme: userSettings?.theme || settingsService.getDefaultSettings().theme,
        language,
        timezone,
        notifications: notificationSettings,
        privacy: privacySettings
      });
      
      if (success) {
        showMessage('success', 'Settings saved successfully');
      } else {
        showMessage('error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (themeMode: 'light' | 'dark' | 'auto') => {
    if (!user?.id) return;
    
    const newTheme: Theme = {
      ...(userSettings?.theme || settingsService.getDefaultSettings().theme),
      mode: themeMode
    };
    
    setUserSettings(prev => prev ? { ...prev, theme: newTheme } : null);
    setTheme(themeMode);
    
    try {
      await settingsService.updateTheme(user.id, newTheme);
      showMessage('success', 'Theme updated successfully');
    } catch (error) {
      console.error('Error updating theme:', error);
      showMessage('error', 'Failed to update theme');
    }
  };

  const handleNotificationToggle = async (key: keyof NotificationSettings, value: boolean | NotificationType[]) => {
    if (!user?.id) return;
    
    const currentSettings = notificationSettings || {
      email: true,
      push: true,
      sms: false,
      types: ['info', 'success', 'warning', 'error', 'system']
    };
    
    const newNotificationSettings = {
      ...currentSettings,
      [key]: value
    };
    
    setNotificationSettings(newNotificationSettings);
    
    try {
      await settingsService.updateNotificationSettings(user.id, newNotificationSettings);
      showMessage('success', 'Notification settings updated');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showMessage('error', 'Failed to update notification settings');
    }
  };

  const handlePrivacyToggle = async (key: keyof PrivacySettings, value: boolean | string) => {
    if (!user?.id) return;
    
    const currentSettings = privacySettings || {
      profileVisibility: 'team-only',
      locationSharing: false,
      activityTracking: true
    };
    
    const newPrivacySettings = {
      ...currentSettings,
      [key]: value
    };
    
    setPrivacySettings(newPrivacySettings);
    
    try {
      await settingsService.updatePrivacySettings(user.id, newPrivacySettings);
      showMessage('success', 'Privacy settings updated');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      showMessage('error', 'Failed to update privacy settings');
    }
  };

  const handleLanguageTimezoneChange = async () => {
    if (!user?.id) return;
    
    try {
      const success = await settingsService.updateLanguageAndTimezone(user.id, language, timezone);
      if (success) {
        showMessage('success', 'Language and timezone updated');
      } else {
        showMessage('error', 'Failed to update language and timezone');
      }
    } catch (error) {
      console.error('Error updating language and timezone:', error);
      showMessage('error', 'Failed to update language and timezone');
    }
  };

  const handleResetToDefault = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const success = await settingsService.resetToDefault(user.id);
      if (success) {
        const defaultSettings = settingsService.getDefaultSettings();
        setUserSettings(defaultSettings);
        setNotificationSettings(defaultSettings.notifications);
        setPrivacySettings(defaultSettings.privacy);
        setLanguage(defaultSettings.language);
        setTimezone(defaultSettings.timezone);
        setTheme(defaultSettings.theme.mode);
        showMessage('success', 'Settings reset to default');
      } else {
        showMessage('error', 'Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      showMessage('error', 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  // Security handlers
  const handleChangePassword = async () => {
    if (!user?.id) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long');
      return;
    }
    
    setSaving(true);
    try {
      // In a real app, you would call an API to change the password
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setChangePasswordOpen(false);
      showMessage('success', 'Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // In a real app, you would call an API to enable/disable 2FA
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTwoFactorEnabled(!twoFactorEnabled);
      setTwoFactorOpen(false);
      showMessage('success', `Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      showMessage('error', 'Failed to update two-factor authentication');
    } finally {
      setSaving(false);
    }
  };

  const handleViewLoginHistory = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // In a real app, you would fetch login history from an API
      // For now, we'll simulate with mock data
      const mockHistory = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.1',
          location: 'New York, NY',
          device: 'Chrome on Windows',
          status: 'success'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          ipAddress: '192.168.1.2',
          location: 'New York, NY',
          device: 'Safari on iPhone',
          status: 'success'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          ipAddress: '10.0.0.1',
          location: 'San Francisco, CA',
          device: 'Firefox on Mac',
          status: 'success'
        }
      ];
      
      setLoginHistory(mockHistory);
      setLoginHistoryOpen(true);
    } catch (error) {
      console.error('Error fetching login history:', error);
      showMessage('error', 'Failed to fetch login history');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !userSettings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <SettingsIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Settings
            </Typography>
            <Typography color="textSecondary">
              Configure system settings and preferences
            </Typography>
          </Box>
        </Box>
        
        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            onClick={handleResetToDefault}
            disabled={saving}
            startIcon={<RotateCcwIcon />}
            variant="outlined"
          >
            Reset to Default
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            startIcon={<Save />}
            variant="contained"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </Stack>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Settings Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
              {/* Font Size Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <TypeIcon className="w-5 h-5 mr-2 text-primary-600" />
                  Font Size
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {fontSizes.map((fontSizeOption) => (
                    <button
                      key={fontSizeOption.value}
                      onClick={() => setFontSize(fontSizeOption.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        fontSize === fontSizeOption.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className={`${getFontSizeClass(fontSizeOption.value)} font-bold text-center mb-2`}>
                        {fontSizeOption.preview}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        {fontSizeOption.label}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center space-x-4">
                  <button
                    onClick={resetFontSize}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    <RotateCcwIcon className="w-4 h-4" />
                    <span>Reset to Default</span>
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    Current: {fontSizes.find(f => f.value === fontSize)?.label}
                  </span>
                </div>
              </div>

              {/* Theme Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-primary-600" />
                  Theme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      userSettings?.theme?.mode === 'light'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <SunIcon className="w-6 h-6 text-yellow-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">Light</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Clean, bright interface</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      userSettings?.theme?.mode === 'dark'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <MoonIcon className="w-6 h-6 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">Dark</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Easy on the eyes</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('auto')}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                      userSettings?.theme?.mode === 'auto'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <MonitorIcon className="w-6 h-6 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">Auto</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Follows system</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <BellIcon className="w-5 h-5 mr-2 text-primary-600" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Email Notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings?.email || false}
                      onChange={(e) => handleNotificationToggle('email', e.target.checked)}
                      aria-label="Enable email notifications" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings?.push || false}
                      onChange={(e) => handleNotificationToggle('push', e.target.checked)}
                      aria-label="Enable push notifications" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">SMS Notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via SMS</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings?.sms || false}
                      onChange={(e) => handleNotificationToggle('sms', e.target.checked)}
                      aria-label="Enable SMS notifications" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Box>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1} mb={3}>
                <Shield color="primary" />
                Security Settings
              </Typography>
              
              <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={3}>
                {/* Change Password Card */}
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Change Password
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          Update your account password
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <LockIcon />
                      </Avatar>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => setChangePasswordOpen(true)}
                      sx={{ mt: 2 }}
                      fullWidth
                    >
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

                {/* Two-Factor Authentication Card */}
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Two-Factor Authentication
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          {twoFactorEnabled ? 'Enabled' : 'Disabled'} - Extra security for your account
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: twoFactorEnabled ? 'success.main' : 'grey.400' }}>
                        <SecurityIcon />
                      </Avatar>
                    </Box>
                    <Button
                      variant={twoFactorEnabled ? 'outlined' : 'contained'}
                      color={twoFactorEnabled ? 'error' : 'primary'}
                      onClick={() => setTwoFactorOpen(true)}
                      sx={{ mt: 2 }}
                      fullWidth
                    >
                      {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Login History Card */}
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Login History
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          View recent login activity
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'info.main' }}>
                        <HistoryIcon />
                      </Avatar>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={handleViewLoginHistory}
                      sx={{ mt: 2 }}
                      fullWidth
                    >
                      View Login History
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-primary-600" />
                Account Settings
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    console.log('Edit Profile button clicked');
                    console.log('Navigating to /profile');
                    try {
                      navigate('/profile');
                      console.log('Navigation successful');
                    } catch (error) {
                      console.error('Navigation failed:', error);
                    }
                  }}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">Edit Profile</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Update your personal information</div>
                </button>
                
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Privacy Settings</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Profile Visibility</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Control who can see your profile</div>
                    </div>
                    <select
                      value={privacySettings?.profileVisibility || 'team-only'}
                      onChange={(e) => handlePrivacyToggle('profileVisibility', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      aria-label="Select profile visibility"
                    >
                      <option value="public">Public</option>
                      <option value="team-only">Team Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Location Sharing</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Allow location tracking</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={privacySettings?.locationSharing || false}
                        onChange={(e) => handlePrivacyToggle('locationSharing', e.target.checked)}
                        aria-label="Enable location sharing" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Activity Tracking</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Track user activity for analytics</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={privacySettings?.activityTracking || false}
                        onChange={(e) => handlePrivacyToggle('activityTracking', e.target.checked)}
                        aria-label="Enable activity tracking" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                
                <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-gray-900 dark:text-white">Export Data</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Download your account data</div>
                </button>
              </div>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <GlobeIcon className="w-5 h-5 mr-2 text-primary-600" />
                Language & Region
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select 
                    value={language || 'en'}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                    aria-label="Select language"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Zone
                  </label>
                  <select 
                    value={timezone || 'UTC'}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                    aria-label="Select time zone"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleLanguageTimezoneChange}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Save Language & Timezone
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <TextField
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    edge="end"
                  >
                    {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    edge="end"
                  >
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    edge="end"
                  >
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            disabled={saving}
            variant="contained"
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={twoFactorOpen} onClose={() => setTwoFactorOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {twoFactorEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
        </DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="body2" color="textSecondary" paragraph>
              {twoFactorEnabled 
                ? 'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
                : 'Two-factor authentication adds an extra layer of security to your account by requiring a second form of verification when signing in.'
              }
            </Typography>
            {!twoFactorEnabled && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  How it works:
                </Typography>
                <Typography variant="body2" component="div">
                  <Box component="ul" sx={{ margin: 0, paddingLeft: '1.2rem' }}>
                    <Box component="li">Download an authenticator app (Google Authenticator, Authy, etc.)</Box>
                    <Box component="li">Scan the QR code or enter the setup key</Box>
                    <Box component="li">Enter the 6-digit code from your app when signing in</Box>
                  </Box>
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoFactorOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleToggleTwoFactor}
            disabled={saving}
            variant={twoFactorEnabled ? 'outlined' : 'contained'}
            color={twoFactorEnabled ? 'error' : 'primary'}
          >
            {saving ? 'Processing...' : (twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog open={loginHistoryOpen} onClose={() => setLoginHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Login History</Typography>
            <IconButton onClick={() => setLoginHistoryOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loginHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        color={entry.status === 'success' ? 'success' : 'error'}
                        size="small"
                        icon={entry.status === 'success' ? <CheckCircleIcon /> : <AlertCircleIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {entry.device}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {entry.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {entry.ipAddress}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginHistoryOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
