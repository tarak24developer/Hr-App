import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Shield,
  Save,
  Lock,
  Key,
  History,
  X,
  Eye,
  EyeOff,
  RotateCcw,
  Palette,
  Bell,
  User as UserIcon,
  Globe,
  Type,
  Sun,
  Moon,
  Monitor,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { showNotification } from '../utils/notification';
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
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'language', label: 'Language', icon: Globe },
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
    showNotification(text, type === 'warning' ? 'error' : type);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure system settings and preferences</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleResetToDefault}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {/* Settings Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
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
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Type className="w-5 h-5 mr-2 text-blue-600" />
                  Font Size
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {fontSizes.map((fontSizeOption) => (
                    <button
                      key={fontSizeOption.value}
                      onClick={() => setFontSize(fontSizeOption.value)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        fontSize === fontSizeOption.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className={`${getFontSizeClass(fontSizeOption.value)} font-bold text-center mb-2`}>
                        {fontSizeOption.preview}
                      </div>
                      <div className="text-sm text-gray-600 text-center">
                        {fontSizeOption.label}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center space-x-4">
                  <button
                    onClick={resetFontSize}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset to Default</span>
                  </button>
                  <span className="text-sm text-gray-500">
                    Current: {fontSizes.find(f => f.value === fontSize)?.label}
                  </span>
                </div>
              </div>

              {/* Theme Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-blue-600" />
                  Theme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors",
                      userSettings?.theme?.mode === 'light'
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Sun className="w-6 h-6 text-yellow-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Light</div>
                      <div className="text-sm text-gray-500">Clean, bright interface</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors",
                      userSettings?.theme?.mode === 'dark'
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Moon className="w-6 h-6 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Dark</div>
                      <div className="text-sm text-gray-500">Easy on the eyes</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('auto')}
                    className={cn(
                      "flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors",
                      userSettings?.theme?.mode === 'auto'
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Monitor className="w-6 h-6 text-gray-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Auto</div>
                      <div className="text-sm text-gray-500">Follows system</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-600" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-500">Receive notifications via email</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings?.email || false}
                      onChange={(e) => handleNotificationToggle('email', e.target.checked)}
                      aria-label="Enable email notifications" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Push Notifications</div>
                    <div className="text-sm text-gray-500">Receive push notifications</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings?.push || false}
                      onChange={(e) => handleNotificationToggle('push', e.target.checked)}
                      aria-label="Enable push notifications" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">SMS Notifications</div>
                    <div className="text-sm text-gray-500">Receive notifications via SMS</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationSettings?.sms || false}
                      onChange={(e) => handleNotificationToggle('sms', e.target.checked)}
                      aria-label="Enable SMS notifications" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Security Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Change Password Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Change Password</h4>
                      <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <button
                      onClick={() => setChangePasswordOpen(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Change Password
                  </button>
                </div>

                {/* Two-Factor Authentication Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-500">
                          {twoFactorEnabled ? 'Enabled' : 'Disabled'} - Extra security for your account
                      </p>
                    </div>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      twoFactorEnabled ? "bg-green-100" : "bg-gray-100"
                    )}>
                      <Key className={cn(
                        "w-5 h-5",
                        twoFactorEnabled ? "text-green-600" : "text-gray-600"
                      )} />
                    </div>
                  </div>
                  <button
                      onClick={() => setTwoFactorOpen(true)}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg transition-colors",
                      twoFactorEnabled
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                    >
                      {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>

                {/* Login History Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Login History</h4>
                      <p className="text-sm text-gray-500">View recent login activity</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <History className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <button
                      onClick={handleViewLoginHistory}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Login History
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
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
                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">Edit Profile</div>
                  <div className="text-sm text-gray-500">Update your personal information</div>
                </button>
                
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Privacy Settings</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Profile Visibility</div>
                      <div className="text-sm text-gray-500">Control who can see your profile</div>
                    </div>
                    <select
                      value={privacySettings?.profileVisibility || 'team-only'}
                      onChange={(e) => handlePrivacyToggle('profileVisibility', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Select profile visibility"
                    >
                      <option value="public">Public</option>
                      <option value="team-only">Team Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Location Sharing</div>
                      <div className="text-sm text-gray-500">Allow location tracking</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={privacySettings?.locationSharing || false}
                        onChange={(e) => handlePrivacyToggle('locationSharing', e.target.checked)}
                        aria-label="Enable location sharing" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Activity Tracking</div>
                      <div className="text-sm text-gray-500">Track user activity for analytics</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={privacySettings?.activityTracking || false}
                        onChange={(e) => handlePrivacyToggle('activityTracking', e.target.checked)}
                        aria-label="Enable activity tracking" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="font-medium text-gray-900">Export Data</div>
                  <div className="text-sm text-gray-500">Download your account data</div>
                </button>
              </div>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-600" />
                Language & Region
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select 
                    value={language || 'en'}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
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
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Zone
                  </label>
                  <select 
                    value={timezone || 'UTC'}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setChangePasswordOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <button
                onClick={() => setChangePasswordOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setChangePasswordOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
            Cancel
              </button>
              <button
            onClick={handleChangePassword}
            disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : null}
                <span>{saving ? 'Changing...' : 'Change Password'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Dialog */}
      {twoFactorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTwoFactorOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
          {twoFactorEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
              </h3>
              <button
                onClick={() => setTwoFactorOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
              {twoFactorEnabled 
                ? 'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
                : 'Two-factor authentication adds an extra layer of security to your account by requiring a second form of verification when signing in.'
              }
              </p>
              
            {!twoFactorEnabled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>• Scan the QR code or enter the setup key</li>
                    <li>• Enter the 6-digit code from your app when signing in</li>
                  </ul>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setTwoFactorOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
            Cancel
              </button>
              <button
            onClick={handleToggleTwoFactor}
            disabled={saving}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2",
                  twoFactorEnabled
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : null}
                <span>{saving ? 'Processing...' : (twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login History Dialog */}
      {loginHistoryOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200] p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Login History</h3>
                  <p className="text-sm text-gray-500">Recent login activity and security events</p>
                </div>
              </div>
              <button
                onClick={() => setLoginHistoryOpen(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                {/* Login History Table */}
                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <History className="w-5 h-5 text-gray-600 mr-2" />
                    Login Activity
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Date & Time</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Device</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map((entry) => (
                          <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <div className={cn(
                                  "w-6 h-6 rounded-lg flex items-center justify-center",
                                  entry.status === 'success' ? "bg-green-100" : "bg-red-100"
                                )}>
                                  {entry.status === 'success' ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  entry.status === 'success'
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                )}>
                                  {entry.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {new Date(entry.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {entry.device}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {entry.location}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                              {entry.ipAddress}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setLoginHistoryOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
