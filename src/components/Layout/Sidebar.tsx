import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/utils/cn';
import { useUser } from '@/stores/authStore';
import { useThemeActions } from '@/stores/themeStore';
import {
  Home,
  Users,
  Clock,
  Calendar,
  CreditCard,
  Package,
  GraduationCap,
  BarChart3,
  Settings,
  UserCircle,
  Sun,
  Moon,
  Monitor,
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  MapPin,
  Bell,
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  LogOut,
  Database,
  TrendingUp
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any; // Using any for lucide-react icons
  badge?: string;
}

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = useUser();
  const { setTheme } = useThemeActions();

  // Update body class when sidebar state changes
  React.useEffect(() => {
    const body = document.body;
    if (isCollapsed) {
      body.classList.add('sidebar-collapsed');
    } else {
      body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'Employee Directory',
      href: '/employee-directory',
      icon: Users
    },
    {
      name: 'Employee Profile',
      href: '/employee-page',
      icon: UserCircle
    },
    {
      name: 'Exit Process',
      href: '/exit-process',
      icon: LogOut
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: Clock
    },
    {
      name: 'Leave Management',
      href: '/leaves',
      icon: Calendar
    },
    {
      name: 'Holidays',
      href: '/holidays',
      icon: Calendar
    },
    {
      name: 'Training',
      href: '/training',
      icon: GraduationCap
    },
    {
      name: 'Feedback Surveys',
      href: '/feedback-surveys',
      icon: MessageSquare
    },
    {
      name: 'Request Portal',
      href: '/request-portal',
      icon: ClipboardList
    },
    {
      name: 'Payroll',
      href: '/payroll',
      icon: CreditCard
    },

    {
      name: 'Expense Management',
      href: '/expense-management',
      icon: CreditCard
    },
    {
      name: 'Asset Management',
      href: '/asset-management',
      icon: Package
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Database
    },
    {
      name: 'Assets',
      href: '/assets',
      icon: Package
    },
    {
      name: 'Advanced Analytics',
      href: '/advanced-analytics',
      icon: TrendingUp
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3
    },
    {
      name: 'User Tracking',
      href: '/user-tracking',
      icon: MapPin
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users
    },
    {
      name: 'Document Management',
      href: '/document-management',
      icon: FileText
    },
    {
      name: 'Security',
      href: '/security',
      icon: Shield
    },
    {
      name: 'Enhanced Access Control',
      href: '/enhanced-access-control',
      icon: Shield
    },
    {
      name: 'Incident Management',
      href: '/incident-management',
      icon: AlertTriangle
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell
    },
    {
      name: 'Announcements',
      href: '/announcements',
      icon: MessageSquare
    },
    {
      name: 'Live Tracking Map',
      href: '/live-tracking-map',
      icon: MapPin
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserCircle
    }
  ];



  return (
    <div
      className={cn(
        'sidebar-container flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
        'lg:block', // Always show on large screens
        'hidden', // Hidden by default on mobile
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="font-semibold text-gray-900">HRMS</span>
          </div>
        )}
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* User Profile */}
      {!isCollapsed && user && (
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
      <nav className="sidebar-nav flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scroll-smooth dark:scrollbar-thin-dark">
        <ul className="space-y-1 px-3">
          {/* Dashboard */}
          {navigation.slice(0, 1).map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {/* Employee Management Section */}
          {!isCollapsed && (
            <li className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Employee Management
              </div>
            </li>
          )}
          {navigation.slice(1, 4).map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {/* HR Operations Section */}
          {!isCollapsed && (
            <li className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                HR Operations
              </div>
            </li>
          )}
          {navigation.slice(4, 10).map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {/* Financial Management Section */}
          {!isCollapsed && (
            <li className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Financial Management
              </div>
            </li>
          )}
          {navigation.slice(10, 13).map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {/* Asset & Inventory Section */}
          {!isCollapsed && (
            <li className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Asset & Inventory
              </div>
            </li>
          )}
          {navigation.slice(13, 16).map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {/* Analytics & Reports Section */}
          {!isCollapsed && (
            <li className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Analytics & Reports
              </div>
            </li>
          )}
          {navigation.slice(16, 19).map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {/* System Management Section */}
          {!isCollapsed && (
            <li className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                System Management
              </div>
            </li>
          )}
          {navigation.slice(19, 27).map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {/* Profile Section */}
          {navigation.slice(27).map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    'hover:bg-gray-100 hover:text-gray-900',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {/* Theme Toggle */}
        {!isCollapsed && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Theme</p>
            <div className="flex space-x-1">
              <button
                onClick={() => setTheme('light')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Light theme"
              >
                <Sun className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Dark theme"
              >
                <Moon className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setTheme('auto')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="System theme"
              >
                <Monitor className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* Profile Link */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              'hover:bg-gray-100 hover:text-gray-900',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600'
            )
          }
        >
                          <UserCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {!isCollapsed && <span>Profile</span>}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
