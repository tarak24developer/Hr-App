import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Type, 
  Sun, 
  Moon, 
  Monitor,
  Bell,
  Shield,
  Palette,
  User,
  Globe,
  Save,
  RotateCcw
} from 'lucide-react';
import { useThemeActions } from '@/stores/themeStore';
import { useFontSizeStore, type FontSize } from '@/stores/fontSizeStore';

const Settings: React.FC = () => {
  const { setTheme } = useThemeActions();
  const { fontSize, setFontSize, resetFontSize } = useFontSizeStore();
  const [activeTab, setActiveTab] = useState('appearance');

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
    { id: 'account', label: 'Account', icon: User },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <SettingsIcon className="w-8 h-8 text-primary-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure system settings and preferences</p>
        </div>
      </div>

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
                  <Type className="w-5 h-5 mr-2 text-primary-600" />
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
                    <RotateCcw className="w-4 h-4" />
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
                    onClick={() => setTheme('light')}
                    className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                  >
                    <Sun className="w-6 h-6 text-yellow-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">Light</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Clean, bright interface</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setTheme('dark')}
                    className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                  >
                    <Moon className="w-6 h-6 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">Dark</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Easy on the eyes</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setTheme('auto')}
                    className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                  >
                    <Monitor className="w-6 h-6 text-gray-500" />
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
                <Bell className="w-5 h-5 mr-2 text-primary-600" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Email Notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked aria-label="Enable email notifications" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Push Notifications</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" aria-label="Enable push notifications" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary-600" />
                Security Settings
              </h3>
              <div className="space-y-4">
                <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-gray-900 dark:text-white">Change Password</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Update your account password</div>
                </button>
                
                <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Enable 2FA for extra security</div>
                </button>
                
                <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-gray-900 dark:text-white">Login History</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">View recent login activity</div>
                </button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-primary-600" />
                Account Settings
              </h3>
              <div className="space-y-4">
                <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-gray-900 dark:text-white">Edit Profile</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Update your personal information</div>
                </button>
                
                <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-gray-900 dark:text-white">Privacy Settings</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Control your privacy preferences</div>
                </button>
                
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
                <Globe className="w-5 h-5 mr-2 text-primary-600" />
                Language & Region
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" aria-label="Select language">
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
                  <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" aria-label="Select time zone">
                    <option value="utc">UTC</option>
                    <option value="est">Eastern Time</option>
                    <option value="cst">Central Time</option>
                    <option value="mst">Mountain Time</option>
                    <option value="pst">Pacific Time</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
