import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  MapPin,
  Clock,
  User,
  Monitor,
  Smartphone,
  Tablet,
  Map,
  RefreshCw,
  Wifi,
  WifiOff,
  Users,
  UserCheck,
  Activity,
  AlertCircle,
  Download,
  Search,
  Filter,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { showNotification } from '../utils/notification';
import DashboardCard from '../components/DashboardCard';
import firebaseService from '../services/firebaseService';

interface UserTrackingData {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment: string;
  isOnline: boolean;
  lastSeen: Date;
  currentLocation: Location;
  deviceInfo: DeviceInfo;
  status: 'online' | 'offline' | 'idle' | 'away';
  totalDistance?: number;
  lastActivity?: Date;
  loginTime?: Date;
  sessionId: string;
  trackingEnabled?: boolean;
  consentGiven?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  browser: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  screenResolution: string;
  operatingSystem: string;
}

const UserTracking: React.FC = () => {
  const [trackingData, setTrackingData] = useState<UserTrackingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<UserTrackingData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    department: '',
    deviceType: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Load tracking data
  const loadTrackingData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch real tracking data from Firebase
      const result = await firebaseService.getCollection('user_tracking');
      
      if (result.success && result.data) {
        const trackingData = result.data.map((item: any) => ({
          ...item,
          lastSeen: item.lastSeen ? new Date(item.lastSeen) : new Date(),
          lastActivity: item.lastActivity ? new Date(item.lastActivity) : new Date(),
          isOnline: item.isOnline || false,
          status: item.status || 'offline',
          trackingEnabled: item.trackingEnabled || false,
          consentGiven: item.consentGiven || false
        }));
        setTrackingData(trackingData);
      } else {
        setTrackingData([]);
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
      showNotification('Failed to load tracking data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Start/stop tracking
  const handleTrackingToggle = async () => {
    try {
      if (isTracking) {
        // await realtimeTrackingService.stopTracking('user');
        setIsTracking(false);
        showNotification('Tracking stopped', 'success');
      } else {
        // await realtimeTrackingService.startTracking('user', {});
        setIsTracking(true);
        showNotification('Tracking started', 'success');
      }
    } catch (error) {
      console.error('Error toggling tracking:', error);
      showNotification('Failed to toggle tracking', 'error');
    }
  };

  // Filter data
  const filteredData = trackingData.filter(user => {
    const matchesSearch = user.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
                         user.userEmail.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || user.status === filters.status;
    const matchesDepartment = !filters.department || user.userDepartment === filters.department;
    const matchesDeviceType = !filters.deviceType || user.deviceInfo.deviceType === filters.deviceType;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesDeviceType;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Statistics
  const getTotalUsers = () => trackingData.length;
  const getOnlineUsers = () => trackingData.filter(user => user.isOnline).length;
  const getOfflineUsers = () => trackingData.filter(user => !user.isOnline).length;
  const getActiveUsers = () => trackingData.filter(user => user.status === 'online').length;
  const getAwayUsers = () => trackingData.filter(user => user.status === 'away').length;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(2)} km`;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800';
      case 'away':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleViewDetails = (user: UserTrackingData) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleViewMap = (user: UserTrackingData) => {
    setSelectedUser(user);
    setShowMapModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Tracking & Monitoring</h1>
          <p className="text-gray-600">Monitor user activity, location, and device information in real-time</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={handleTrackingToggle}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2",
              isTracking 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "bg-green-600 text-white hover:bg-green-700"
            )}
          >
            {isTracking ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            <span>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
          </button>
          <button 
            onClick={loadTrackingData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => {/* Export functionality */}}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard
          name="Total Users"
          value={getTotalUsers()}
          icon={Users}
          color="blue"
        />
        <DashboardCard
          name="Online"
          value={getOnlineUsers()}
          icon={UserCheck}
          color="green"
        />
        <DashboardCard
          name="Offline"
          value={getOfflineUsers()}
          icon={User}
          color="gray"
        />
        <DashboardCard
          name="Active"
          value={getActiveUsers()}
          icon={Activity}
          color="yellow"
        />
        <DashboardCard
          name="Away"
          value={getAwayUsers()}
          icon={Clock}
          color="indigo"
        />
      </div>

      {/* Search and Filters */}
      {trackingData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              
              {(filters.status || filters.department || filters.deviceType) && (
                <button
                  onClick={() => setFilters({ search: '', status: '', department: '', deviceType: '' })}
                  className="px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="idle">Idle</option>
                    <option value="away">Away</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Departments</option>
                    {Array.from(new Set(trackingData.map(user => user.userDepartment))).map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                  <select
                    value={filters.deviceType}
                    onChange={(e) => handleFilterChange('deviceType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Devices</option>
                    <option value="desktop">Desktop</option>
                    <option value="mobile">Mobile</option>
                    <option value="tablet">Tablet</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracking Data Table */}
      {trackingData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                          <div className="text-sm text-gray-500">{user.userEmail}</div>
                          <div className="text-sm text-gray-500">{user.userDepartment}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                          getStatusColor(user.status)
                        )}>
                          {user.status}
                        </span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          user.isOnline ? "bg-green-500" : "bg-gray-400"
                        )}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(user.deviceInfo.deviceType)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.deviceInfo.deviceType}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.deviceInfo.operatingSystem}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {user.currentLocation.city || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.currentLocation.address || 'Location not available'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(user.lastSeen)}
                      </div>
                      {user.totalDistance && (
                        <div className="text-sm text-gray-500">
                          {formatDistance(user.totalDistance)} traveled
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewMap(user)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Map className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredData.length === 0 && trackingData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or filter parameters</p>
        </div>
      )}

      {/* Empty State */}
      {trackingData.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Tracking Data</h3>
          <p className="text-gray-500 mb-6">Start tracking to monitor user activity and location</p>
          <button
            onClick={handleTrackingToggle}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Wifi className="w-4 h-4" />
            <span>Start Tracking</span>
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredData.length > rowsPerPage && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.ceil(filteredData.length / rowsPerPage) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg",
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                )}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(Math.ceil(filteredData.length / rowsPerPage), currentPage + 1))}
              disabled={currentPage === Math.ceil(filteredData.length / rowsPerPage)}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetailsModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 p-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-primary-100 rounded-lg">
                  <Eye className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">User Tracking Details</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Details Content */}
            <div className="p-4 space-y-6">
              {/* User Header */}
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-xl">
                    {selectedUser.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">{selectedUser.userName}</h4>
                  <p className="text-gray-600">{selectedUser.userEmail}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      getStatusColor(selectedUser.status)
                    )}>
                      {selectedUser.status}
                    </span>
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      selectedUser.isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    )}>
                      {selectedUser.isOnline ? 'Online' : 'Offline'}
                    </span>
                    <span className="text-sm text-gray-500">{selectedUser.userDepartment}</span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">User Information</h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Name</p>
                        <p className="text-sm text-gray-600">{selectedUser.userName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{selectedUser.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Role</p>
                        <p className="text-sm text-gray-600">{selectedUser.userRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Department</p>
                        <p className="text-sm text-gray-600">{selectedUser.userDepartment}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Activity */}
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Status & Activity</h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Status</p>
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                          getStatusColor(selectedUser.status)
                        )}>
                          {selectedUser.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Wifi className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Online Status</p>
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                          selectedUser.isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        )}>
                          {selectedUser.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Seen</p>
                        <p className="text-sm text-gray-600">{formatDate(selectedUser.lastSeen)}</p>
                      </div>
                    </div>
                    {selectedUser.lastActivity && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Last Activity</p>
                          <p className="text-sm text-gray-600">{formatDate(selectedUser.lastActivity)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Device Information */}
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Device Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {getDeviceIcon(selectedUser.deviceInfo.deviceType)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Device Type</p>
                        <p className="text-sm text-gray-600">{selectedUser.deviceInfo.deviceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Operating System</p>
                        <p className="text-sm text-gray-600">{selectedUser.deviceInfo.operatingSystem}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Browser</p>
                        <p className="text-sm text-gray-600">{selectedUser.deviceInfo.browser}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Screen Resolution</p>
                        <p className="text-sm text-gray-600">{selectedUser.deviceInfo.screenResolution}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Location Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">City</span>
                      <span className="text-sm text-gray-900">{selectedUser.currentLocation.city || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">State</span>
                      <span className="text-sm text-gray-900">{selectedUser.currentLocation.state || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Country</span>
                      <span className="text-sm text-gray-900">{selectedUser.currentLocation.country || '—'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Address</span>
                      <span className="text-sm text-gray-900">{selectedUser.currentLocation.address || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Coordinates</span>
                      <span className="text-sm text-gray-900">
                        {selectedUser.currentLocation.latitude && selectedUser.currentLocation.longitude 
                          ? `${selectedUser.currentLocation.latitude}, ${selectedUser.currentLocation.longitude}`
                          : '—'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 p-4">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors mr-3"
              >
                Close
              </button>
              <button
                onClick={() => handleViewMap(selectedUser)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Map className="w-4 h-4" />
                <span>View Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMapModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Map className="w-5 h-5" />
                <span>Location Map - {selectedUser.userName}</span>
              </h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Map View</h3>
                  <p className="text-gray-500 mb-4">
                    Location: {selectedUser.currentLocation.latitude}, {selectedUser.currentLocation.longitude}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedUser.currentLocation.address || 'Address not available'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowMapModal(false)}
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

export default UserTracking;
