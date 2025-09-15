import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Megaphone,
  Clock,
  User as UserIcon,
  Archive,
  RefreshCw,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Pin,
  Send,
  FileEdit,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { announcementService } from '../services/announcementService';
import { Announcement, AnnouncementCategory, AnnouncementFormData, AnnouncementStats, User } from '../types';
import { showNotification } from '../utils/notification';
import DashboardCard from '../components/DashboardCard';


interface AnnouncementFilters {
  search: string;
  type: string;
  priority: string;
  category: string;
  status: 'all' | 'published' | 'draft' | 'archived' | 'pinned';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const initialFilters: AnnouncementFilters = {
  search: '',
  type: '',
  priority: '',
  category: '',
  status: 'all',
  dateRange: {
    start: null,
    end: null
  }
};

const typeColors = {
  info: '#2196f3',
  warning: '#ff9800',
  error: '#f44336',
  success: '#4caf50',
  general: '#9e9e9e',
  urgent: '#9c27b0',
  maintenance: '#795548',
  update: '#607d8b'
};

const priorityColors = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  urgent: '#9c27b0'
};

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<AnnouncementCategory[]>([]);
  const [users] = useState<User[]>([]);
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [filters, setFilters] = useState<AnnouncementFilters>(initialFilters);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isFormMode, setIsFormMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    summary: '',
    type: 'general',
    priority: 'medium',
    category: '',
    targetAudience: ['all'],
    isPublished: false,
    isPinned: false,
    publishDate: new Date().toISOString(),
    attachments: [],
    tags: []
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // Load data from Firebase
  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const result = await announcementService.getAnnouncements();
      if (result.success && result.data) {
        setAnnouncements(result.data);
      } else {
        console.error('Failed to load announcements:', result.error);
        showNotification('Failed to load announcements', 'error');
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      showNotification('Error loading announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const result = await announcementService.getCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        console.error('Failed to load categories:', result.error);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const result = await announcementService.getAnnouncementStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.error('Failed to load stats:', result.error);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadAnnouncements(),
        loadCategories(),
        loadStats()
      ]);
    };
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [announcements, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...announcements];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchLower) ||
        announcement.content.toLowerCase().includes(searchLower) ||
        announcement.summary.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(announcement => announcement.type === filters.type);
    }

    if (filters.priority) {
      filtered = filtered.filter(announcement => announcement.priority === filters.priority);
    }

    if (filters.category) {
      filtered = filtered.filter(announcement => announcement.category === filters.category);
    }

    if (filters.status === 'published') {
      filtered = filtered.filter(announcement => announcement.isPublished);
    } else if (filters.status === 'draft') {
      filtered = filtered.filter(announcement => !announcement.isPublished);
    } else if (filters.status === 'archived') {
      filtered = filtered.filter(announcement => announcement.isArchived);
    } else if (filters.status === 'pinned') {
      filtered = filtered.filter(announcement => announcement.isPinned);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(announcement => new Date(announcement.publishDate) >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(announcement => new Date(announcement.publishDate) <= filters.dateRange.end!);
    }

    setFilteredAnnouncements(filtered);
    setCurrentPage(1);
  }, [announcements, filters]);

  const handleFilterChange = (field: keyof AnnouncementFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAnnouncement = () => {
    setSelectedAnnouncement(null);
    setIsViewMode(false);
    setIsFormMode(true);
    setFormData({
      title: '',
      content: '',
      summary: '',
      type: 'general',
      priority: 'medium',
      category: '',
      targetAudience: ['all'],
      isPublished: false,
      isPinned: false,
      publishDate: new Date().toISOString(),
      attachments: [],
      tags: []
    });
    setIsDialogOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewMode(false);
    setIsFormMode(true);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      summary: announcement.summary,
      type: announcement.type,
      priority: announcement.priority,
      category: announcement.category,
      targetAudience: announcement.targetAudience,
      isPublished: announcement.isPublished,
      isPinned: announcement.isPinned,
      publishDate: announcement.publishDate,
      expiryDate: announcement.expiryDate || '',
      attachments: announcement.attachments,
      tags: announcement.tags
    });
    setIsDialogOpen(true);
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewMode(true);
    setIsFormMode(false);
    setIsDialogOpen(true);
    // Increment read count
    announcementService.incrementReadCount(announcement.id);
  };

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    
    try {
      setLoading(true);
      const result = await announcementService.permanentDeleteAnnouncement(announcementToDelete.id);
      if (result.success) {
        showNotification('Announcement deleted successfully', 'success');
        await Promise.all([loadAnnouncements(), loadStats()]);
      } else {
        throw new Error(result.error || 'Failed to delete announcement');
      }
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      showNotification(error.message || 'Failed to delete announcement', 'error');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.title.trim()) {
      showNotification('Title is required', 'error');
      return;
    }

    try {
      setLoading(true);
      let result;
      
      if (selectedAnnouncement) {
        result = await announcementService.updateAnnouncement(selectedAnnouncement.id, formData);
      } else {
        result = await announcementService.createAnnouncement(formData);
      }

      if (result.success) {
        showNotification(`Announcement ${selectedAnnouncement ? 'updated' : 'created'} successfully`, 'success');
        await Promise.all([loadAnnouncements(), loadStats()]);
        handleCloseDialog();
      } else {
        throw new Error(result.error || 'Failed to save announcement');
      }
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      showNotification(error.message || 'Failed to save announcement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsViewMode(false);
    setIsFormMode(false);
    setSelectedAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      summary: '',
      type: 'general',
      priority: 'medium',
      category: '',
      targetAudience: ['all'],
      isPublished: false,
      isPinned: false,
      publishDate: new Date().toISOString(),
      attachments: [],
      tags: []
    });
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      const result = await announcementService.togglePinAnnouncement(announcement.id, !announcement.isPinned);
      if (result.success) {
        showNotification(`Announcement ${!announcement.isPinned ? 'pinned' : 'unpinned'} successfully`, 'success');
        await loadAnnouncements();
      } else {
        throw new Error(result.error || 'Failed to toggle pin status');
      }
    } catch (error: any) {
      console.error('Error toggling pin status:', error);
      showNotification(error.message || 'Failed to toggle pin status', 'error');
    }
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    try {
      const result = await announcementService.togglePublishAnnouncement(announcement.id, !announcement.isPublished);
      if (result.success) {
        showNotification(`Announcement ${!announcement.isPublished ? 'published' : 'unpublished'} successfully`, 'success');
        await loadAnnouncements();
      } else {
        throw new Error(result.error || 'Failed to toggle publish status');
      }
    } catch (error: any) {
      console.error('Error toggling publish status:', error);
      showNotification(error.message || 'Failed to toggle publish status', 'error');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'general':
        return <Megaphone className="w-4 h-4 text-gray-600" />;
      case 'urgent':
        return <Megaphone className="w-4 h-4 text-red-600" />;
      case 'maintenance':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'update':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Megaphone className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    return priorityColors[priority as keyof typeof priorityColors] || '#9e9e9e';
  };

  const getTypeColor = (type: string) => {
    return typeColors[type as keyof typeof typeColors] || '#9e9e9e';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const getPublishedCount = () => {
    return stats?.published || 0;
  };

  const getDraftCount = () => {
    return stats?.drafts || 0;
  };

  const getPinnedCount = () => {
    return stats?.pinned || 0;
  };

  const getTotalCount = () => {
    return stats?.total || 0;
  };


  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Manage and publish company announcements</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Archive className="w-4 h-4" />
            <span>Archive All</span>
          </button>
          <button
            onClick={() => loadAnnouncements()}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCreateAnnouncement}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Announcement</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          name="Total Announcements"
          value={loading ? '...' : getTotalCount()}
          icon={Megaphone}
          color="blue"
        />
        <DashboardCard
          name="Published"
          value={loading ? '...' : getPublishedCount()}
          icon={Send}
          color="green"
        />
        <DashboardCard
          name="Drafts"
          value={loading ? '...' : getDraftCount()}
          icon={FileEdit}
          color="yellow"
        />
        <DashboardCard
          name="Pinned"
          value={loading ? '...' : getPinnedCount()}
          icon={Pin}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search announcements..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="maintenance">Maintenance</option>
              <option value="update">Update</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
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
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="pinned">Pinned</option>
            </select>

            <button
              onClick={() => setFilters(initialFilters)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Announcements Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-sm text-gray-500">Loading announcements...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500">No announcements found</p>
                  </td>
                </tr>
              ) : (
                paginatedAnnouncements.map((announcement) => (
                <tr key={announcement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(announcement.type)}
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getTypeColor(announcement.type) }}
                      >
                        {announcement.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {announcement.title}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {announcement.summary}
                      </div>
                      {announcement.isPinned && (
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
                      style={{ backgroundColor: getPriorityColor(announcement.priority) }}
                    >
                      {announcement.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {announcement.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm text-gray-900">
                        {getUserName(announcement.authorId)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {announcement.isPublished ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className={cn(
                        "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                        announcement.isPublished 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      )}>
                        {announcement.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(announcement.publishDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(announcement.publishDate).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                          onClick={() => handleViewAnnouncement(announcement)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => handleEditAnnouncement(announcement)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Announcement"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => handleTogglePin(announcement)}
                        className={cn(
                          "hover:text-yellow-900",
                          announcement.isPinned ? "text-yellow-600" : "text-gray-600"
                        )}
                        title={announcement.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => handleTogglePublish(announcement)}
                        className={cn(
                          "hover:text-green-900",
                          announcement.isPublished ? "text-green-600" : "text-gray-600"
                        )}
                        title={announcement.isPublished ? "Unpublish" : "Publish"}
                      >
                        {announcement.isPublished ? <Send className="w-4 h-4" /> : <FileEdit className="w-4 h-4" />}
                      </button>
                      <button
                          onClick={() => handleDeleteClick(announcement)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
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

      {/* View/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseDialog}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
          {isViewMode ? 'View Announcement' : isFormMode ? (selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement') : 'Announcement Details'}
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isViewMode && selectedAnnouncement ? (
                // View Mode - grouped sections, read-only
                <div className="p-4">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-primary-100 rounded-lg">
                        <Eye className="w-5 h-5 text-primary-600" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">Announcement Details</h3>
                    </div>
                    <button
                      onClick={handleCloseDialog}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Announcement Details Content */}
                  <div className="space-y-6">
                    {/* Announcement Header */}
                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <Megaphone className="w-8 h-8 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900">{selectedAnnouncement.title}</h4>
                        <p className="text-gray-600">{selectedAnnouncement.category}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span 
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: getTypeColor(selectedAnnouncement.type) }}
                          >
                            {selectedAnnouncement.type}
                          </span>
                          <span 
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: getPriorityColor(selectedAnnouncement.priority) }}
                          >
                            {selectedAnnouncement.priority}
                          </span>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            selectedAnnouncement.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          )}>
                            {selectedAnnouncement.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Announcement Information */}
                      <div className="space-y-4">
                        <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Announcement Information</h5>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Megaphone className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Type</p>
                              <span 
                                className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                                style={{ backgroundColor: getTypeColor(selectedAnnouncement.type) }}
                              >
                                {selectedAnnouncement.type}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Priority</p>
                              <span 
                                className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                                style={{ backgroundColor: getPriorityColor(selectedAnnouncement.priority) }}
                              >
                                {selectedAnnouncement.priority}
                              </span>
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
                                selectedAnnouncement.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              )}>
                                {selectedAnnouncement.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Pin className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Pinned</p>
                              <span className={cn(
                                "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                                selectedAnnouncement.isPinned ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                              )}>
                                {selectedAnnouncement.isPinned ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-4">
                        <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Timeline</h5>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <Clock className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Published</p>
                              <p className="text-sm text-gray-600">
                                {new Date(selectedAnnouncement.publishDate).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Clock className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Expires</p>
                              <p className="text-sm text-gray-600">
                                {selectedAnnouncement.expiryDate ? 
                                  new Date(selectedAnnouncement.expiryDate).toLocaleString() : 
                                  '—'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <Megaphone className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Category</p>
                              <p className="text-sm text-gray-600">{selectedAnnouncement.category || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Content</h5>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedAnnouncement.content || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                    <button
                      onClick={handleCloseDialog}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
          ) : isFormMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                    <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="success">Success</option>
                        <option value="urgent">Urgent</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="update">Update</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPublished"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                        Published
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPinned"
                        checked={formData.isPinned}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-900">
                        Pinned
                      </label>
                    </div>
                  </div>
                </div>
          ) : null}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
            {isViewMode ? 'Close' : 'Cancel'}
              </button>
          {isFormMode && (
                <button
              onClick={handleFormSubmit}
              disabled={loading || !formData.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : null}
                  <span>{selectedAnnouncement ? 'Update' : 'Create'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteDialogOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>Delete Announcement</span>
              </h3>
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
            Are you sure you want to permanently delete "{announcementToDelete?.title}"? This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
            Cancel
              </button>
              <button
            onClick={handleConfirmDelete}
            disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements; 