import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useUser, useAuthActions } from '@/stores/authStore';
import { useThemeActions, useTheme } from '@/stores/themeStore';
import MobileNavigation from '@/components/MobileNavigation';
import {
  Bell,
  Search,
  Menu,
  UserCircle,
  LogOut,
  Settings,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

const Header: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const user = useUser();
  const { logout } = useAuthActions();
  const { setTheme } = useThemeActions();
  const theme = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const notifications = [
    {
      id: 1,
      title: 'New leave request',
      message: 'John Doe has requested annual leave',
      time: '2 minutes ago',
      type: 'info'
    },
    {
      id: 2,
      title: 'Payroll processed',
      message: 'Monthly payroll has been processed successfully',
      time: '1 hour ago',
      type: 'success'
    },
    {
      id: 3,
      title: 'Training reminder',
      message: 'You have a training session tomorrow',
      time: '3 hours ago',
      type: 'warning'
    }
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search */}
          <div className="relative">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'w-32 sm:w-48 lg:w-64 transition-all duration-200 text-sm',
                    isSearchOpen ? 'w-48 sm:w-64' : 'w-32 sm:w-48'
                  )}
                  onFocus={() => setIsSearchOpen(true)}
                  onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                />
              </div>
            </form>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle - Hidden on small screens */}
          <div className="hidden sm:flex items-center space-x-1">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                theme === 'light' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              )}
              title="Light theme"
            >
                              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                theme === 'dark' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              )}
              title="Dark theme"
            >
                              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('auto')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                theme === 'auto' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'hover:bg-gray-100 text-gray-600'
              )}
              title="System theme"
            >
                              <Monitor className="w-4 h-4" />
            </button>
          </div>

                    {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
            )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="flex-shrink-0">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'error' ? 'bg-red-500' :
                            'bg-blue-500'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 sm:p-4 border-t border-gray-200">
                  <button 
                    className="w-full text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
                    aria-label="View all notifications"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileOpen(false);
                    }}
                    className="flex items-center w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <UserCircle className="w-4 h-4 mr-2 sm:mr-3" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setIsProfileOpen(false);
                    }}
                    className="flex items-center w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2 sm:mr-3" />
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2 sm:mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isNotificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false);
            setIsNotificationsOpen(false);
          }}
        />
      )}

      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </header>
  );
};

export default Header;
