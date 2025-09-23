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
  Monitor,
  Building,
  Plus,
  X
} from 'lucide-react';
import firebaseService from '@/services/firebaseService';
import { db } from '@/services/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

const Header: React.FC = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [newDept, setNewDept] = useState<{ name: string; description: string }>({ name: '', description: '' });
  
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

  // Realtime departments listener
  React.useEffect(() => {
    if (!db) return undefined;
    try {
      const col = collection(db, 'departments');
      const q = query(col, orderBy('name', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        const list: Array<{ id: string; name: string; description?: string }> = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setDepartments(list);
        // If no explicit departments exist, derive from users as a fallback
        if (list.length === 0) {
          (async () => {
            try {
              const usersRes = await firebaseService.getCollection<any>('users');
              if (usersRes.success && usersRes.data) {
                const uniq = Array.from(new Set(usersRes.data
                  .map((u: any) => (u && typeof u.department === 'string' ? u.department.trim() : ''))
                  .filter((n: string) => n && n !== 'Unassigned')
                ));
                setDepartments(uniq.map((name, idx) => ({ id: `derived-${idx}`, name })));
              }
            } catch {}
          })();
        }
      });
      return () => unsub();
    } catch {
      return undefined;
    }
  }, []);

  const addDepartment = async () => {
    if (!newDept.name.trim()) return;
    await firebaseService.addDocument('departments', {
      name: newDept.name.trim(),
      description: newDept.description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setNewDept({ name: '', description: '' });
  };

  // Allow other pages to open the departments modal
  React.useEffect(() => {
    const handler = () => setIsDeptModalOpen(true);
    window.addEventListener('open-departments-modal', handler as any);
    return () => window.removeEventListener('open-departments-modal', handler as any);
  }, []);

  return (
    <>
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Quick Departments Manager */}
          <div>
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              title="Manage Departments"
              aria-label="Manage Departments"
            >
              <Building className="w-4 h-4" />
              <span>Departments</span>
            </button>
          </div>
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
    {isDeptModalOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3">
        <div className="absolute inset-0 bg-black/30" onClick={() => setIsDeptModalOpen(false)} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg z-[210]">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Manage Departments</h3>
            </div>
            <button onClick={() => setIsDeptModalOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., HR"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={addDepartment} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm inline-flex items-center" aria-label="Add department" title="Add department">
                <Plus className="w-4 h-4 mr-1" />
                Add Department
              </button>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Existing Departments</h4>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded">
                {departments.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No departments yet</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {departments.map((d) => (
                      <li key={d.id} className="p-3 text-sm flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{d.name}</div>
                          {d.description ? <div className="text-gray-500">{d.description}</div> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;
