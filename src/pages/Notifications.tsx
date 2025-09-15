import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  User as UserIcon,
  Briefcase,
  Calendar,
  FileText,
  CreditCard,
  Shield,
  Archive,
  RefreshCw,
  Info,
  AlertCircle,
  AlertTriangle,
  Pin,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import notificationService from '../services/notificationService';
import { Notification, NotificationCategory, NotificationFormData, NotificationStats, User } from '../types';
import { showNotification } from '../utils/notification';
import DashboardCard from '../components/DashboardCard';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    category: '',
    recipientId: '',
    expiresAt: '',
    metadata: {},
    actions: []
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [notificationsResult, categoriesResult, usersResult, statsResult] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getCategories(),
        notificationService.getUsers(),
        notificationService.getNotificationStats()
      ]);

      if (notificationsResult.success) {
        setNotifications(notificationsResult.data || []);
      } else {
        console.error('Failed to load notifications:', notificationsResult.error);
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data || []);
      } else {
        console.error('Failed to load categories:', categoriesResult.error);
      }

      if (usersResult.success) {
        setUsers(usersResult.data || []);
      } else {
        console.error('Failed to load users:', usersResult.error);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        console.error('Failed to load stats:', statsResult.error);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load notifications data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters
  useEffect(() => {
    let filtered = [...notifications];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.category.toLowerCase().includes(searchLower)
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter(notification => notification.priority === priorityFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(notification => notification.category === categoryFilter);
    }

    if (statusFilter === 'read') {
      filtered = filtered.filter(notification => notification.isRead);
    } else if (statusFilter === 'unread') {
      filtered = filtered.filter(notification => !notification.isRead);
    } else if (statusFilter === 'pinned') {
      filtered = filtered.filter(notification => notification.isPinned);
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, searchTerm, typeFilter, priorityFilter, categoryFilter, statusFilter]);


  const handleCreateNotification = () => {
    setSelectedNotification(null);
    setIsViewMode(false);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      category: '',
      recipientId: '',
      expiresAt: '',
      metadata: {},
      actions: []
    });
    setIsDialogOpen(true);
  };

  const handleEditNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewMode(false);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      category: notification.category,
      recipientId: notification.recipientId,
      expiresAt: notification.expiresAt || '',
      metadata: notification.metadata || {},
      actions: notification.actions || []
    });
    setIsDialogOpen(true);
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteNotification = (notification: Notification) => {
    setNotificationToDelete(notification);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!notificationToDelete) return;

    try {
      const result = await notificationService.permanentDeleteNotification(notificationToDelete.id);
      
      if (result.success) {
        showNotification('Notification deleted successfully', 'success');
        await loadData();
      } else {
        showNotification('Failed to delete notification', 'error');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      showNotification('Error deleting notification', 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
        showNotification('Notification marked as read', 'success');
        await loadData();
      } else {
        showNotification('Failed to mark notification as read', 'error');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showNotification('Error marking notification as read', 'error');
    }
  };

  const handleTogglePin = async (notificationId: string, isPinned: boolean) => {
    try {
      const result = await notificationService.togglePin(notificationId, !isPinned);
      
      if (result.success) {
        showNotification(isPinned ? 'Notification unpinned' : 'Notification pinned', 'success');
        await loadData();
      } else {
        showNotification('Failed to toggle pin status', 'error');
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      showNotification('Error toggling pin status', 'error');
    }
  };

  const handleFormChange = (field: keyof NotificationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = async () => {
    try {
      let result;
      
    if (selectedNotification) {
      // Update existing notification
        result = await notificationService.updateNotification(selectedNotification.id, formData);
      } else {
        // Create new notification
        result = await notificationService.createNotification(formData);
      }

      if (result.success) {
        showNotification(selectedNotification ? 'Notification updated successfully' : 'Notification created successfully', 'success');
        setIsDialogOpen(false);
        await loadData();
    } else {
        showNotification(selectedNotification ? 'Failed to update notification' : 'Failed to create notification', 'error');
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      showNotification('Error saving notification', 'error');
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleArchiveAll = async () => {
    try {
      const result = await notificationService.archiveAll();
      
      if (result.success) {
        showNotification('All notifications archived', 'success');
        await loadData();
      } else {
        showNotification('Failed to archive notifications', 'error');
      }
    } catch (error) {
      console.error('Error archiving notifications:', error);
      showNotification('Error archiving notifications', 'error');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'system':
        return <Bell className="w-4 h-4 text-purple-600" />;
      case 'user':
        return <UserIcon className="w-4 h-4 text-blue-600" />;
      case 'work':
        return <Briefcase className="w-4 h-4 text-orange-600" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-pink-600" />;
      case 'assignment':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-teal-600" />;
      case 'security':
        return <Shield className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      urgent: '#9c27b0'
    };
    return colors[priority as keyof typeof colors] || '#9e9e9e';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      info: '#2196f3',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      system: '#9c27b0',
      user: '#607d8b',
      work: '#795548',
      event: '#e91e63',
      assignment: '#3f51b5',
      payment: '#009688',
      security: '#ff5722'
    };
    return colors[type as keyof typeof colors] || '#9e9e9e';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Manage and track system notifications</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleArchiveAll}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Archive className="w-4 h-4" />
            <span>Archive All</span>
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCreateNotification}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notification</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            name="Total Notifications"
            value={stats.total}
            icon={Bell}
            color="blue"
          />
          <DashboardCard
            name="Unread"
            value={stats.unread}
            icon={BellRing}
            color="red"
          />
          <DashboardCard
            name="Pinned"
            value={stats.pinned}
            icon={Pin}
            color="yellow"
          />
          <DashboardCard
            name="Today"
            value={stats.today}
            icon={Clock}
            color="green"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="work">Work</option>
              <option value="event">Event</option>
              <option value="assignment">Assignment</option>
              <option value="payment">Payment</option>
              <option value="security">Security</option>
            </select>

            <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="pinned">Pinned</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setPriorityFilter('');
                setCategoryFilter('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedNotifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getNotificationIcon(notification.type)}
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getTypeColor(notification.type) }}
                      >
                        {notification.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {notification.message}
                      </div>
                      {notification.isPinned && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                          <Pin className="w-3 h-3 mr-1" />
                          Pinned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: getPriorityColor(notification.priority) }}
                    >
                      {notification.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {notification.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm text-gray-900">
                        {getUserName(notification.recipientId)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {notification.isRead ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <BellRing className="w-4 h-4 text-red-600" />
                      )}
                      <span className={cn(
                        "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                        notification.isRead 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}>
                        {notification.isRead ? 'Read' : 'Unread'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                          onClick={() => handleViewNotification(notification)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                        >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!notification.isRead && (
                        <button
                            onClick={() => handleMarkAsRead(notification.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Read"
                          >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                          onClick={() => handleTogglePin(notification.id, notification.isPinned)}
                        className={cn(
                          "hover:text-yellow-900",
                          notification.isPinned ? "text-yellow-600" : "text-gray-600"
                        )}
                        title={notification.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => handleEditNotification(notification)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Notification"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => handleDeleteNotification(notification)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Notification"
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-t border-b border-gray-300",
                  page === currentPage
                    ? "bg-blue-50 text-blue-600 border-blue-300"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                )}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit/View Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDialogOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
          {isViewMode ? 'View Notification' : selectedNotification ? 'Edit Notification' : 'Create Notification'}
              </h3>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isViewMode ? (
                // View Mode - grouped sections, read-only
                <div className="p-4">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-primary-100 rounded-lg">
                        <Eye className="w-5 h-5 text-primary-600" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">Notification Details</h3>
                    </div>
                    <button
                      onClick={() => setIsDialogOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Notification Details Content */}
                  <div className="space-y-6">
                    {/* Notification Header */}
                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <Bell className="w-8 h-8 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900">{selectedNotification?.title}</h4>
                        <p className="text-gray-600">{selectedNotification?.category}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            selectedNotification?.type === 'info' ? 'bg-blue-100 text-blue-800' :
                            selectedNotification?.type === 'success' ? 'bg-green-100 text-green-800' :
                            selectedNotification?.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            selectedNotification?.type === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          )}>
                            {selectedNotification?.type}
                          </span>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            selectedNotification?.priority === 'low' ? 'bg-green-100 text-green-800' :
                            selectedNotification?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            selectedNotification?.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {selectedNotification?.priority}
                          </span>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            selectedNotification?.isRead ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          )}>
                            {selectedNotification?.isRead ? 'Read' : 'Unread'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Notification Information */}
                      <div className="space-y-4">
                        <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Notification Information</h5>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Type</p>
                              <span className={cn(
                                "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                                selectedNotification?.type === 'info' ? 'bg-blue-100 text-blue-800' :
                                selectedNotification?.type === 'success' ? 'bg-green-100 text-green-800' :
                                selectedNotification?.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                selectedNotification?.type === 'error' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              )}>
                                {selectedNotification?.type}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Priority</p>
                              <span className={cn(
                                "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                                selectedNotification?.priority === 'low' ? 'bg-green-100 text-green-800' :
                                selectedNotification?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                selectedNotification?.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {selectedNotification?.priority}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Bell className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Category</p>
                              <p className="text-sm text-gray-600">{selectedNotification?.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Status</p>
                              <span className={cn(
                                "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                                selectedNotification?.isRead ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              )}>
                                {selectedNotification?.isRead ? 'Read' : 'Unread'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recipient & Timeline */}
                      <div className="space-y-4">
                        <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Recipient & Timeline</h5>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Recipient</p>
                              <p className="text-sm text-gray-600">{getUserName(selectedNotification?.recipientId || '') || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <Clock className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Created</p>
                              <p className="text-sm text-gray-600">
                                {selectedNotification?.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Expires At</p>
                              <p className="text-sm text-gray-600">
                                {selectedNotification?.expiresAt ? new Date(selectedNotification.expiresAt).toLocaleString() : '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message Section */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Message</h5>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900">{selectedNotification?.message || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setIsDialogOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                  value={formData.message}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                  rows={3}
                  required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="system">System</option>
                        <option value="user">User</option>
                        <option value="work">Work</option>
                        <option value="event">Event</option>
                        <option value="assignment">Assignment</option>
                        <option value="payment">Payment</option>
                        <option value="security">Security</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                    value={formData.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                        <option value="">Select Category</option>
                    {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                        {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                      <select
                    value={formData.recipientId}
                    onChange={(e) => handleFormChange('recipientId', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                        <option value="">Select Recipient</option>
                    {users.map((user) => (
                          <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
                    <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => handleFormChange('expiresAt', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
            {isViewMode ? 'Close' : 'Cancel'}
              </button>
          {!isViewMode && (
                <button
                  onClick={handleFormSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
              {selectedNotification ? 'Update' : 'Create'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteDialogOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>Delete Notification</span>
              </h3>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
            Are you sure you want to permanently delete this notification? This action cannot be undone.
              </p>
          {notificationToDelete && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notificationToDelete.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                {notificationToDelete.message}
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications; 