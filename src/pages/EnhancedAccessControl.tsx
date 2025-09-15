import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Key, 
  Plus,
  Search,
  Download,
  CheckCircle,
  Edit,
  AlertCircle,
  Activity,
  User,
  Eye,
  Trash2,
  Upload,
  X,
  Mail,
  Building
} from 'lucide-react';
import { collection, onSnapshot, orderBy, query, limit as fsLimit } from 'firebase/firestore';
import { cn } from '../utils/cn';
import type { User as UserType, UserRole } from '../types';
import { db } from '../services/firebase';
import DashboardCard from '../components/DashboardCard';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: string;
  isActive: boolean;
  createdAt: any;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  priority: number;
  userCount: number;
  createdAt: any;
}

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  timestamp: any;
  ipAddress: string;
  success: boolean;
  details?: string;
}

const EnhancedAccessControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<'user' | 'role' | 'permission' | null>(null);

  // Firebase data loading
  useEffect(() => {
    if (!db) {
      setError('Firebase is not configured. Please set environment variables.');
      setLoading(false);
      return;
    }

    // Load users
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const usersData: UserType[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as UserType));
      setUsers(usersData);
    }, (err) => {
      setError(err.message || 'Failed to load users');
    });

    // Load permissions
    const permissionsQuery = query(collection(db, 'permissions'), orderBy('createdAt', 'desc'));
    const unsubPermissions = onSnapshot(permissionsQuery, (snap) => {
      const permissionsData: Permission[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Permission));
      setPermissions(permissionsData);
    }, (err) => {
      setError(err.message || 'Failed to load permissions');
    });

    // Load roles
    const rolesQuery = query(collection(db, 'roles'), orderBy('createdAt', 'desc'));
    const unsubRoles = onSnapshot(rolesQuery, (snap) => {
      const rolesData: Role[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Role));
      setRoles(rolesData);
    }, (err) => {
      setError(err.message || 'Failed to load roles');
    });

    // Load access logs
    const logsQuery = query(collection(db, 'accessLogs'), orderBy('timestamp', 'desc'), fsLimit(100));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const logsData: AccessLog[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as AccessLog));
      setAccessLogs(logsData);
    }, (err) => {
      setError(err.message || 'Failed to load access logs');
    });

    setLoading(false);

    return () => {
      unsubUsers();
      unsubPermissions();
      unsubRoles();
      unsubLogs();
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => (u.status ?? 'active') === 'active').length;
    const totalRoles = roles.length;
    const totalPermissions = permissions.length;
    const recentLogs = accessLogs.filter(log => {
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      const now = new Date();
      const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      return diffHours <= 24;
    }).length;

    return { totalUsers, activeUsers, totalRoles, totalPermissions, recentLogs };
  }, [users, roles, permissions, accessLogs]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return { users, roles, permissions, accessLogs };

    const query = searchQuery.toLowerCase();
    
    return {
      users: users.filter(user => 
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
      ),
      roles: roles.filter(role => 
        role.name?.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
      ),
      permissions: permissions.filter(permission => 
        permission.name?.toLowerCase().includes(query) ||
        permission.description?.toLowerCase().includes(query) ||
        permission.resource?.toLowerCase().includes(query) ||
        permission.action?.toLowerCase().includes(query)
      ),
      accessLogs: accessLogs.filter(log => 
        log.userName?.toLowerCase().includes(query) ||
        log.userEmail?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query) ||
        log.resource?.toLowerCase().includes(query)
      )
    };
  }, [users, roles, permissions, accessLogs, searchQuery]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'manager':
        return <Users className="w-4 h-4" />;
      case 'employee':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleView = (item: any, type: 'user' | 'role' | 'permission') => {
    setSelectedItem(item);
    setEditingType(type);
    setShowViewModal(true);
  };

  const handleEdit = (item: any, type: 'user' | 'role' | 'permission') => {
    setSelectedItem(item);
    setEditingType(type);
    setShowEditModal(true);
  };

  const handleDelete = (item: any, type: 'user' | 'role' | 'permission') => {
    setSelectedItem(item);
    setEditingType(type);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem || !editingType) return;

    try {
      let collectionName = '';
      switch (editingType) {
        case 'user':
          collectionName = 'users';
          break;
        case 'role':
          collectionName = 'roles';
          break;
        case 'permission':
          collectionName = 'permissions';
          break;
      }

      if (collectionName) {
        // Import firebaseService
        const { default: firebaseService } = await import('../services/firebaseService');
        await firebaseService.deleteDocument(collectionName, selectedItem.id);
        
        setSuccessMessage(`${editingType.charAt(0).toUpperCase() + editingType.slice(1)} deleted successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setError(`Failed to delete ${editingType}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setShowDeleteModal(false);
      setSelectedItem(null);
      setEditingType(null);
    }
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedItem(null);
    setEditingType(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading access control data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Access Control</h1>
          <p className="text-gray-600">Manage user permissions, roles, and access control settings</p>
          </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
            onClick={() => {/* Import functionality */}}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button 
            onClick={() => {/* Export functionality */}}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New</span>
            </button>
          </div>
        </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard
          name="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
        />

        <DashboardCard
          name="Active Users"
          value={stats.activeUsers}
          icon={CheckCircle}
          color="green"
        />

        <DashboardCard
          name="Roles"
          value={stats.totalRoles}
          icon={Shield}
          color="purple"
        />

        <DashboardCard
          name="Permissions"
          value={stats.totalPermissions}
          icon={Key}
          color="yellow"
        />

        <DashboardCard
          name="Recent Activity"
          value={stats.recentLogs}
          icon={Activity}
          color="indigo"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, roles, permissions..."
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
          <div className="flex items-center gap-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value={0}>All Users</option>
              <option value={1}>All Roles</option>
              <option value={2}>All Permissions</option>
              <option value={3}>Access Logs</option>
            </select>
            </div>
          </div>
        </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
              { id: 0, name: 'Users', icon: Users, count: filteredData.users.length },
              { id: 1, name: 'Roles', icon: Shield, count: filteredData.roles.length },
              { id: 2, name: 'Permissions', icon: Key, count: filteredData.permissions.length },
              { id: 3, name: 'Access Logs', icon: Activity, count: filteredData.accessLogs.length }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                      activeTab === tab.id
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Users Tab */}
            {activeTab === 0 && (
              <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                </div>
                
              {filteredData.users.length > 0 ? (
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.users.map((user, index) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span className="text-primary-600 font-semibold text-xs">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </span>
                              </div>
                            </div>
                              <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                              </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                              getRoleColor(user.role)
                            )}>
                              <span className="flex items-center space-x-1">
                                {getRoleIcon(user.role)}
                                <span>{user.role}</span>
                              </span>
                            </span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              (user.status ?? 'active') === 'active' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            )}>
                              {user.status ?? 'active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(user.lastLoginAt)}
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleView(user, 'user')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(user, 'user')}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user, 'user')}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600 mb-4">
                    {users.length === 0 
                      ? 'No users have been created yet. Click "Add New" to get started.'
                      : 'No users match the current filters. Try adjusting your search criteria.'
                    }
                  </p>
                  {users.length === 0 && (
                    <button
                      onClick={handleCreate}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add User</span>
                    </button>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Roles Tab */}
            {activeTab === 1 && (
              <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
                </div>
                
              {filteredData.roles.length > 0 ? (
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.roles.map((role, index) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                              <Shield className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{role.name}</div>
                                {role.isSystem && (
                                  <span className="text-xs text-blue-600">System Role</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{role.description}</div>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{role.permissions.length}</span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{role.userCount || 0}</span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              role.isActive ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          )}>
                              {role.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleView(role, 'role')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(role, 'role')}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(role, 'role')}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
                  <p className="text-gray-600 mb-4">
                    {roles.length === 0 
                      ? 'No roles have been created yet. Click "Add New" to get started.'
                      : 'No roles match the current filters. Try adjusting your search criteria.'
                    }
                  </p>
                  {roles.length === 0 && (
                    <button
                      onClick={handleCreate}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Role</span>
                    </button>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 2 && (
              <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                </div>
                
              {filteredData.permissions.length > 0 ? (
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.permissions.map((permission, index) => (
                      <tr key={permission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                              <Key className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                                <div className="text-sm text-gray-500">{permission.description}</div>
                              </div>
                            </div>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{permission.resource}</span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{permission.action}</span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{permission.category}</span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              permission.isActive ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          )}>
                              {permission.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleView(permission, 'permission')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(permission, 'permission')}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(permission, 'permission')}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No permissions found</h3>
                  <p className="text-gray-600 mb-4">
                    {permissions.length === 0 
                      ? 'No permissions have been created yet. Click "Add New" to get started.'
                      : 'No permissions match the current filters. Try adjusting your search criteria.'
                    }
                  </p>
                  {permissions.length === 0 && (
                    <button
                      onClick={handleCreate}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Permission</span>
                    </button>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Access Logs Tab */}
            {activeTab === 3 && (
              <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Access Logs</h3>
                <div className="text-sm text-gray-500">
                  Showing last 100 entries
                </div>
                </div>
                
              {filteredData.accessLogs.length > 0 ? (
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {filteredData.accessLogs.map((log, index) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span className="text-primary-600 font-semibold text-xs">
                                    {log.userName?.[0]}{log.userEmail?.[0]}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                                <div className="text-sm text-gray-500">{log.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{log.action}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{log.resource}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{log.ipAddress}</span>
                          </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              log.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            )}>
                              {log.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(log.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No access logs found</h3>
                  <p className="text-gray-600 mb-4">
                    {accessLogs.length === 0 
                      ? 'No access logs have been recorded yet.'
                      : 'No access logs match the current filters. Try adjusting your search criteria.'
                    }
                  </p>
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModals}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-3xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4" /> 
                Add New {editingType ? editingType.charAt(0).toUpperCase() + editingType.slice(1) : 'Item'}
              </h3>
              <button onClick={closeModals} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
              {editingType === 'user' && (
                <>
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">First Name *</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.firstName || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, firstName: e.target.value })} 
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Last Name *</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.lastName || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, lastName: e.target.value })} 
                          placeholder="Enter last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Email *</label>
                        <input 
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.email || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, email: e.target.value })} 
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Phone</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.phone || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, phone: e.target.value })} 
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role & Status */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Role & Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Role *</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.role || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, role: e.target.value })}
                        >
                          <option value="">Select Role</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                          <option value="hr">HR</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.status || 'active'} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, status: e.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Department</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.department || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, department: e.target.value })} 
                          placeholder="Enter department"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Position</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.position || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, position: e.target.value })} 
                          placeholder="Enter position"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {editingType === 'role' && (
                <>
                  {/* Role Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Role Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Role Name *</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.name || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })} 
                          placeholder="Enter role name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Priority</label>
                        <input 
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.priority || 0} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, priority: Number(e.target.value) })} 
                          placeholder="Enter priority (0-100)"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Description</label>
                        <textarea 
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.description || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} 
                          placeholder="Enter role description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.isActive ? 'active' : 'inactive'} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, isActive: e.target.value === 'active' })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">System Role</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.isSystem ? 'yes' : 'no'} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, isSystem: e.target.value === 'yes' })}
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Permissions</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Select permissions for this role:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {permissions.map((permission) => (
                          <label key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedItem?.permissions?.includes(permission.name) || false}
                              onChange={(e) => {
                                const currentPermissions = selectedItem?.permissions || [];
                                if (e.target.checked) {
                                  setSelectedItem({
                                    ...selectedItem,
                                    permissions: [...currentPermissions, permission.name]
                                  });
                                } else {
                                  setSelectedItem({
                                    ...selectedItem,
                                    permissions: currentPermissions.filter((p: string) => p !== permission.name)
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{permission.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {editingType === 'permission' && (
                <>
                  {/* Permission Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Permission Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Permission Name *</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.name || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })} 
                          placeholder="Enter permission name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Category *</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.category || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                        >
                          <option value="">Select Category</option>
                          <option value="user_management">User Management</option>
                          <option value="role_management">Role Management</option>
                          <option value="permission_management">Permission Management</option>
                          <option value="system_settings">System Settings</option>
                          <option value="reports">Reports</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Resource *</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.resource || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, resource: e.target.value })} 
                          placeholder="e.g., users, roles, reports"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Action *</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.action || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, action: e.target.value })}
                        >
                          <option value="">Select Action</option>
                          <option value="create">Create</option>
                          <option value="read">Read</option>
                          <option value="update">Update</option>
                          <option value="delete">Delete</option>
                          <option value="manage">Manage</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Description</label>
                        <textarea 
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.description || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} 
                          placeholder="Enter permission description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem?.isActive ? 'active' : 'inactive'} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, isActive: e.target.value === 'active' })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-3 border-t sticky bottom-0 bg-white z-10">
              <button onClick={closeModals} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={closeModals} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Create {editingType ? editingType.charAt(0).toUpperCase() + editingType.slice(1) : 'Item'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto z-[210]">
            <div className="p-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <Eye className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {editingType ? editingType.charAt(0).toUpperCase() + editingType.slice(1) : 'Item'} Details
                  </h3>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content based on type */}
              {editingType === 'user' && (
                <div className="space-y-6">
                  {/* User Header */}
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-xl">
                        {selectedItem.firstName?.[0]}{selectedItem.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">
                        {selectedItem.firstName} {selectedItem.lastName}
                      </h4>
                      <p className="text-gray-600">{selectedItem.email}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          (selectedItem.status ?? 'active') === 'active' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        )}>
                          {selectedItem.status ?? 'active'}
                        </span>
                        <span className="text-sm text-gray-500">{selectedItem.role}</span>
                        <span className="text-sm text-gray-500">{selectedItem.department || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Information</h5>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Full Name</p>
                            <p className="text-sm text-gray-600">{selectedItem.firstName} {selectedItem.lastName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Mail className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Email</p>
                            <p className="text-sm text-gray-600">{selectedItem.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Shield className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Role</p>
                            <p className="text-sm text-gray-600">{selectedItem.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Building className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Department</p>
                            <p className="text-sm text-gray-600">{selectedItem.department || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Information */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Account Information</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">User ID</span>
                          <span className="text-sm text-gray-900">{selectedItem.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Status</span>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            (selectedItem.status ?? 'active') === 'active' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          )}>
                            {selectedItem.status ?? 'active'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Created At</span>
                          <span className="text-sm text-gray-900">{formatDate(selectedItem.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Last Login</span>
                          <span className="text-sm text-gray-900">{formatDate(selectedItem.lastLoginAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Email Verified</span>
                          <span className="text-sm text-gray-900">{selectedItem.emailVerified ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingType === 'role' && (
                <div className="space-y-6">
                  {/* Role Header */}
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <Shield className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h4>
                      <p className="text-gray-600">{selectedItem.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          selectedItem.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {selectedItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-500">{selectedItem.userCount} users</span>
                        <span className="text-sm text-gray-500">Priority: {selectedItem.priority}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Role Information</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Role Name</span>
                          <span className="text-sm text-gray-900">{selectedItem.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Description</span>
                          <span className="text-sm text-gray-900">{selectedItem.description}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">System Role</span>
                          <span className="text-sm text-gray-900">{selectedItem.isSystem ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Priority</span>
                          <span className="text-sm text-gray-900">{selectedItem.priority}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">User Count</span>
                          <span className="text-sm text-gray-900">{selectedItem.userCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Permissions</h5>
                      <div className="space-y-2">
                        {selectedItem.permissions && selectedItem.permissions.length > 0 ? (
                          selectedItem.permissions.map((permission: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">{permission}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No permissions assigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingType === 'permission' && (
                <div className="space-y-6">
                  {/* Permission Header */}
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <Key className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h4>
                      <p className="text-gray-600">{selectedItem.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          selectedItem.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {selectedItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-500">{selectedItem.category}</span>
                        <span className="text-sm text-gray-500">{selectedItem.resource}</span>
                      </div>
                    </div>
                  </div>

                  {/* Permission Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Permission Information</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Permission Name</span>
                          <span className="text-sm text-gray-900">{selectedItem.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Description</span>
                          <span className="text-sm text-gray-900">{selectedItem.description}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Resource</span>
                          <span className="text-sm text-gray-900">{selectedItem.resource}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Action</span>
                          <span className="text-sm text-gray-900">{selectedItem.action}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Category</span>
                          <span className="text-sm text-gray-900">{selectedItem.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Status & Metadata</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Status</span>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            selectedItem.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          )}>
                            {selectedItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Created At</span>
                          <span className="text-sm text-gray-900">{formatDate(selectedItem.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Permission ID</span>
                          <span className="text-sm text-gray-900 font-mono">{selectedItem.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModals}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Edit className="w-4 h-4" /> 
                Edit {editingType ? editingType.charAt(0).toUpperCase() + editingType.slice(1) : 'Item'}
              </h3>
              <button onClick={closeModals} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
              {editingType === 'user' && (
                <>
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">First Name</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.firstName || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, firstName: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.lastName || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, lastName: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input 
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.email || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, email: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Phone</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.phone || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, phone: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role & Status */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Role & Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Role</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.role || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, role: e.target.value })}
                        >
                          <option value="">Select Role</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                          <option value="hr">HR</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.status || 'active'} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, status: e.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Department</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.department || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, department: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Position</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.position || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, position: e.target.value })} 
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {editingType === 'role' && (
                <>
                  {/* Role Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Role Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Role Name</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.name || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Priority</label>
                        <input 
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.priority || 0} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, priority: Number(e.target.value) })} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Description</label>
                        <textarea 
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.description || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.isActive ? 'active' : 'inactive'} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, isActive: e.target.value === 'active' })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">System Role</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.isSystem ? 'yes' : 'no'} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, isSystem: e.target.value === 'yes' })}
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Permissions</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Select permissions for this role:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {permissions.map((permission) => (
                          <label key={permission.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedItem.permissions?.includes(permission.name) || false}
                              onChange={(e) => {
                                const currentPermissions = selectedItem.permissions || [];
                                if (e.target.checked) {
                                  setSelectedItem({
                                    ...selectedItem,
                                    permissions: [...currentPermissions, permission.name]
                                  });
                                } else {
                                  setSelectedItem({
                                    ...selectedItem,
                                    permissions: currentPermissions.filter((p: string) => p !== permission.name)
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{permission.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {editingType === 'permission' && (
                <>
                  {/* Permission Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Permission Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Permission Name</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.name || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Category</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.category || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                        >
                          <option value="">Select Category</option>
                          <option value="user_management">User Management</option>
                          <option value="role_management">Role Management</option>
                          <option value="permission_management">Permission Management</option>
                          <option value="system_settings">System Settings</option>
                          <option value="reports">Reports</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Resource</label>
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.resource || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, resource: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Action</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.action || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, action: e.target.value })}
                        >
                          <option value="">Select Action</option>
                          <option value="create">Create</option>
                          <option value="read">Read</option>
                          <option value="update">Update</option>
                          <option value="delete">Delete</option>
                          <option value="manage">Manage</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Description</label>
                        <textarea 
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.description || ''} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                          value={selectedItem.isActive ? 'active' : 'inactive'} 
                          onChange={(e) => setSelectedItem({ ...selectedItem, isActive: e.target.value === 'active' })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={closeModals} className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={closeModals} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModals}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> 
                Delete {editingType ? editingType.charAt(0).toUpperCase() + editingType.slice(1) : 'Item'}
              </h4>
              <button onClick={closeModals} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            
            {/* Item Details */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              {editingType === 'user' && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {selectedItem.firstName?.[0]}{selectedItem.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedItem.firstName} {selectedItem.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedItem.email}</p>
                    <p className="text-xs text-gray-500">{selectedItem.role}</p>
                  </div>
                </div>
              )}
              
              {editingType === 'role' && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedItem.name}</p>
                    <p className="text-sm text-gray-600">{selectedItem.description}</p>
                    <p className="text-xs text-gray-500">{selectedItem.userCount} users assigned</p>
                  </div>
                </div>
              )}
              
              {editingType === 'permission' && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedItem.name}</p>
                    <p className="text-sm text-gray-600">{selectedItem.description}</p>
                    <p className="text-xs text-gray-500">{selectedItem.category} • {selectedItem.resource}</p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this {editingType}? This action cannot be undone and may affect system functionality.
            </p>
            
            {/* Warning for roles with users */}
            {editingType === 'role' && selectedItem.userCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Warning</p>
                    <p className="text-sm text-yellow-700">
                      This role is assigned to {selectedItem.userCount} user(s). Deleting it will remove the role from all users.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={closeModals} 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {editingType ? editingType.charAt(0).toUpperCase() + editingType.slice(1) : 'Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAccessControl;