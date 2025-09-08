import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Users, Key, Lock, RefreshCw, Edit, Eye, EyeOff, Save, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, orderBy, query, updateDoc, doc, limit as fsLimit } from 'firebase/firestore';
import type { User, UserRole } from '@/types';
import authService from '@/services/authService';
import firebaseService from '@/services/firebaseService';
import { db } from '@/services/firebase';


const Security: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingUserId, setWorkingUserId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Firebase is not configured. Please set environment variables.');
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const next: User[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as User));
      setUsers(next);
      setLoading(false);
    }, (err) => {
      setError(err.message || 'Failed to load users');
      setLoading(false);
    });
    // Subscribe to recent login activity (authLogs)
    let unsubLogs: (() => void) | null = null;
    try {
      const lq = query(collection(db, 'authLogs'), orderBy('createdAt', 'desc'), fsLimit(50));
      unsubLogs = onSnapshot(lq, (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setLogs(items);
      });
    } catch (e) {
      // ignore if collection or rules not set
    }
    return () => {
      unsub();
      if (unsubLogs) unsubLogs();
    };
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => (u.status ?? 'active') === 'active').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const managers = users.filter(u => u.role === 'manager').length;
    return { total, active, admins, managers };
  }, [users]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setWorkingUserId(userId);
      await authService.changeUserRole(userId, newRole);
    } catch (e: any) {
      alert(e.message || 'Failed to change user role');
    } finally {
      setWorkingUserId(null);
    }
  };



  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify_center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading Security...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Security</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage roles, access and password resets</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Total Users</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items_center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Admins</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.admins}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-amber-600" />
              <div>
                <p className="text-xs text-gray-500">Managers</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.managers}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Recent Login Activity */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Login Activity</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{l.email || l.userEmail || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{l.type || 'login'}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{l.success ? 'Success' : 'Failed'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{l.ip || l.ipAddress || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[300px] truncate" title={l.message || ''}>{l.message || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{l.createdAt ? new Date(l.createdAt.seconds ? l.createdAt.seconds * 1000 : l.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No activity yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
                </div>
              </div>
              
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Access Control</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2FA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pwd Changed</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {u.firstName || u.lastName ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{u.email || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        disabled={workingUserId === u.id}
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
                        title={`Change role for ${u.firstName || u.lastName ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : 'user'}`}
                        aria-label={`Change role for ${u.firstName || u.lastName ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : 'user'}`}
                      >
                        {(['admin','hr','manager','employee'] as UserRole[]).map(r => (
                          <option value={r} key={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        (u.status ?? 'active') === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {(u.status ?? 'active')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.permissions?.length ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.permissions?.length ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {/** lastPasswordChangeAt might be a string or Firestore Timestamp; handle string */}
                      {(u as any).lastPasswordChangeAt ? new Date((u as any).lastPasswordChangeAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                <button
                        onClick={() => handleEditUser(u)}
                        disabled={workingUserId === u.id}
                        className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] min-h-[28px] border border-blue-700"
                        title="Edit user settings"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
              </div>
            </div>
          </div>

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <UserManagementModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUpdate={async (updates) => {
            try {
              setWorkingUserId(selectedUser.id);
              if (db) {
                await updateDoc(doc(db, 'users', selectedUser.id), updates);
              } else {
                await firebaseService.updateDocument<User>('users', selectedUser.id, updates as any);
              }
              handleCloseModal();
            } catch (e: any) {
              alert(e.message || 'Failed to update user');
            } finally {
              setWorkingUserId(null);
            }
          }}
        />
      )}
              </div>
  );
};

// User Management Modal Component
interface UserManagementModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<User>) => Promise<void>;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ user, onClose, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(user.role);
  const [userStatus, setUserStatus] = useState<'active' | 'inactive'>(user.status as 'active' | 'inactive' || 'active');
  const [has2FA, setHas2FA] = useState(!!user.permissions?.length);

  const currentUser = authService.getCurrentUser();
  const isCurrentUser = currentUser?.id === user.id;
  const isAdmin = currentUser?.role === 'admin';

  const handlePasswordChange = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await authService.changePassword(newPassword);
      setNewPassword('');
      alert('Password changed successfully');
    } catch (e: any) {
      alert(e.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user.email) {
      alert('User has no email address');
      return;
    }

    try {
      setIsLoading(true);
      await authService.resetPassword({ email: user.email });
      alert('Password reset email sent');
    } catch (e: any) {
      alert(e.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      const updates: Partial<User> = {
        role: userRole,
        status: userStatus,
        permissions: has2FA ? ['2fa_enabled' as any] : []
      };
      await onUpdate(updates);
    } catch (e: any) {
      alert(e.message || 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-40 backdrop-blur-modal"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-600">
                {user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'User'} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Password Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Password Management</span>
            </h3>
            
            {(isCurrentUser || isAdmin) ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isAdmin ? 'Admin: Change User Password' : 'Change Your Password'}
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="newPassword"
                      aria-label="Enter new password (minimum 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    disabled={isLoading || !newPassword.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Change</span>
                  </button>
                </div>
                {isAdmin && !isCurrentUser && (
                  <p className="text-xs text-amber-600 flex items-center mt-2">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Admin override: You can change any user's password
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleResetPassword}
                  disabled={isLoading || !user.email}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Key className="h-4 w-4" />
                  <span>Send Reset Email</span>
                </button>
                <p className="text-sm text-gray-500 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Only admins or the user themselves can change passwords directly
                </p>
              </div>
            )}
          </div>

          {/* Account Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Account Settings</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Select user role"
                  aria-label="Select user role"
                >
                  <option value="admin">Admin</option>
                  <option value="hr">HR</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Select user status"
                  aria-label="Select user status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-3" htmlFor="has2FA">
                <input
                  type="checkbox"
                  id="has2FA"
                  checked={has2FA}
                  onChange={(e) => setHas2FA(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-label="Enable two-factor authentication"
                />
                <span className="text-sm font-medium text-gray-700">
                  Enable Two-Factor Authentication
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, user will be required to set up 2FA on next login
              </p>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>User Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-600">{user.email || '—'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Login:</span>
                <span className="ml-2 text-gray-600">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Password Changed:</span>
                <span className="ml-2 text-gray-600">
                  {(user as any).lastPasswordChangeAt ? new Date((user as any).lastPasswordChangeAt).toLocaleString() : '—'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-gray-600">
                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
        </div>
      </div>
    </>
  );
};

export default Security; 