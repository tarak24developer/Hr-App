import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { X, Menu, Home, Users, Clock, Calendar, CreditCard, Package, GraduationCap, BarChart3, Settings, UserCircle, FileText, Shield, MapPin, Bell, MessageSquare, ClipboardList, AlertTriangle, Database, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUser } from '@/stores/authStore';
import { useThemeActions } from '@/stores/themeStore';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const user = useUser();
  const { setTheme } = useThemeActions();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Employee Directory', href: '/employee-directory', icon: Users },
    { name: 'Employee Profile', href: '/employee-page', icon: UserCircle },
    { name: 'Exit Process', href: '/exit-process', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'Leave Management', href: '/leaves', icon: Calendar },
    { name: 'Holidays', href: '/holidays', icon: Calendar },
    { name: 'Training', href: '/training', icon: GraduationCap },
    { name: 'Feedback Surveys', href: '/feedback-surveys', icon: MessageSquare },
    { name: 'Request Portal', href: '/request-portal', icon: ClipboardList },
    { name: 'Payroll', href: '/payroll', icon: CreditCard },
    { name: 'Expense Management', href: '/expense-management', icon: CreditCard },
    { name: 'Assets', href: '/assets', icon: Package },
    { name: 'Inventory', href: '/inventory', icon: Database },
    { name: 'Advanced Analytics', href: '/advanced-analytics', icon: TrendingUp },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'User Tracking', href: '/user-tracking', icon: MapPin },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Document Management', href: '/document-management', icon: FileText },
    { name: 'Security', href: '/security', icon: Shield },
    { name: 'Enhanced Access Control', href: '/enhanced-access-control', icon: Shield },
    { name: 'Incident Management', href: '/incident-management', icon: AlertTriangle },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Announcements', href: '/announcements', icon: MessageSquare },
    { name: 'Live Tracking Map', href: '/live-tracking-map', icon: MapPin },
    { name: 'Profile', href: '/profile', icon: UserCircle }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Navigation */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="font-semibold text-gray-900">HRMS</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* User Profile */}
          {user && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors',
                        'hover:bg-gray-100 hover:text-gray-900',
                        isActive
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                          : 'text-gray-600'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {/* Theme Toggle */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Theme</p>
                             <div className="flex space-x-1">
                 <button
                   onClick={() => setTheme('light')}
                   className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                   title="Light theme"
                   aria-label="Light theme"
                 >
                   <Home className="w-4 h-4 text-gray-600" />
                 </button>
                 <button
                   onClick={() => setTheme('dark')}
                   className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                   title="Dark theme"
                   aria-label="Dark theme"
                 >
                   <Settings className="w-4 h-4 text-gray-600" />
                 </button>
                 <button
                   onClick={() => setTheme('auto')}
                   className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                   title="System theme"
                   aria-label="System theme"
                 >
                   <UserCircle className="w-4 h-4 text-gray-600" />
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation; 