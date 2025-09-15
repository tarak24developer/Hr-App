import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  FileText,
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import incidentService, { Incident, IncidentCategory, IncidentFormData, IncidentStats } from '../services/incidentService';
import { User as UserType } from '../types';
import { showNotification } from '../utils/notification';
import DashboardCard from '../components/DashboardCard';

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [users] = useState<UserType[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<IncidentFormData>({
    title: '',
    description: '',
    category: '',
    severity: 'medium',
    priority: 'medium',
    assigneeId: '',
    location: '',
    tags: []
  });
  
  // Filter and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [incidentsResult, categoriesResult, statsResult] = await Promise.all([
        incidentService.getIncidents(),
        incidentService.getCategories(),
        incidentService.getIncidentStats()
      ]);

      if (incidentsResult.success && incidentsResult.data) {
        setIncidents(incidentsResult.data);
        setFilteredIncidents(incidentsResult.data);
      } else {
        setError('Failed to load incidents');
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...incidents];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(incident =>
        incident.title.toLowerCase().includes(searchLower) ||
        incident.description.toLowerCase().includes(searchLower) ||
        incident.location.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    if (severityFilter) {
      filtered = filtered.filter(incident => incident.severity === severityFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(incident => incident.category === categoryFilter);
    }

    setFilteredIncidents(filtered);
    setCurrentPage(1);
  }, [incidents, searchTerm, statusFilter, severityFilter, categoryFilter]);

  // Pagination
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredIncidents.length / rowsPerPage);

  // Handlers
  const handleCreateIncident = () => {
    setSelectedIncident(null);
    setViewMode(false);
    setFormData({
      title: '',
      description: '',
      category: '',
      severity: 'medium',
      priority: 'medium',
      assigneeId: '',
      location: '',
      tags: []
    });
    setDialogOpen(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setViewMode(false);
    setFormData({
      title: incident.title,
      description: incident.description,
      category: incident.category,
      severity: incident.severity,
      priority: incident.priority,
      assigneeId: incident.assigneeId || '',
      location: incident.location,
      tags: incident.tags
    });
    setDialogOpen(true);
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setViewMode(true);
    setDialogOpen(true);
  };

  const handleDeleteClick = (incident: Incident) => {
    setIncidentToDelete(incident);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!incidentToDelete) return;

    try {
      const result = await incidentService.permanentDeleteIncident(incidentToDelete.id);
      
      if (result.success) {
        showNotification(`Incident "${incidentToDelete.title}" deleted successfully`, 'success');
        await loadData();
      } else {
        throw new Error(result.message || 'Failed to delete incident');
      }
    } catch (err) {
      console.error('Error deleting incident:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to delete incident', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setIncidentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setIncidentToDelete(null);
  };

  const handleSaveIncident = async () => {
    try {
      if (selectedIncident) {
        // Update existing incident
        const result = await incidentService.updateIncident(selectedIncident.id, formData);
        if (result.success) {
          showNotification('Incident updated successfully', 'success');
          await loadData();
        } else {
          throw new Error(result.message || 'Failed to update incident');
        }
      } else {
        // Create new incident
        const result = await incidentService.createIncident(formData);
        if (result.success) {
          showNotification('Incident created successfully', 'success');
          await loadData();
        } else {
          throw new Error(result.message || 'Failed to create incident');
        }
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Error saving incident:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to save incident', 'error');
    }
  };

  const handleFormChange = (field: keyof IncidentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'investigating':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'critical': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#f44336';
      case 'investigating': return '#ff9800';
      case 'resolved': return '#4caf50';
      case 'closed': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'urgent': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category ? category.color : '#9e9e9e';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
          <p className="text-gray-600">Track and manage security incidents and issues</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
          onClick={handleCreateIncident}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Incident</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            name="Total Incidents"
            value={stats.total}
            icon={FileText}
            color="blue"
          />
          <DashboardCard
            name="Open Incidents"
            value={stats.open}
            icon={AlertTriangle}
            color="yellow"
          />
          <DashboardCard
            name="Critical Incidents"
            value={stats.critical}
            icon={AlertCircle}
            color="red"
          />
          <DashboardCard
            name="Resolved Today"
            value={stats.resolvedToday}
            icon={CheckCircle}
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
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <option value="">All Categories</option>
                {categories.map((category) => (
                <option key={category.id} value={category.name}>
                    {category.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setSeverityFilter('');
                setCategoryFilter('');
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {incident.title}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {incident.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(incident.category) }}
                    >
                      {incident.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: getSeverityColor(incident.severity) }}
                    >
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(incident.status)}
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getStatusColor(incident.status) }}
                      >
                        {incident.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: getPriorityColor(incident.priority) }}
                    >
                      {incident.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {incident.assigneeId ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-900">
                          User {incident.assigneeId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {incident.location}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(incident.reportedAt)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(incident.reportedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                          onClick={() => handleViewIncident(incident)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => handleEditIncident(incident)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Incident"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => handleDeleteClick(incident)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Incident"
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

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDialogOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
          {viewMode ? 'View Incident' : selectedIncident ? 'Edit Incident' : 'Create Incident'}
              </h3>
              <button
                onClick={() => setDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {viewMode ? (
                // View Mode - grouped sections, read-only
                <div className="p-4">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-primary-100 rounded-lg">
                        <Eye className="w-5 h-5 text-primary-600" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">Incident Details</h3>
                    </div>
                    <button
                      onClick={() => setDialogOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Incident Details Content */}
                  <div className="space-y-6">
                    {/* Incident Header */}
                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900">{selectedIncident?.title}</h4>
                        <p className="text-gray-600">{selectedIncident?.category}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            selectedIncident?.status === 'open' ? 'bg-red-100 text-red-800' :
                            selectedIncident?.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                            selectedIncident?.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          )}>
                            {selectedIncident?.status?.replace('_', ' ')}
                          </span>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            selectedIncident?.severity === 'low' ? 'bg-green-100 text-green-800' :
                            selectedIncident?.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            selectedIncident?.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {selectedIncident?.severity}
                          </span>
                          <span className="text-sm text-gray-500">{selectedIncident?.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Incident Information */}
                      <div className="space-y-4">
                        <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Incident Information</h5>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Category</p>
                              <p className="text-sm text-gray-600">{selectedIncident?.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Severity</p>
                              <span className={cn(
                                "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                                selectedIncident?.severity === 'low' ? 'bg-green-100 text-green-800' :
                                selectedIncident?.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                selectedIncident?.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {selectedIncident?.severity}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Priority</p>
                              <span className={cn(
                                "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                                selectedIncident?.priority === 'low' ? 'bg-green-100 text-green-800' :
                                selectedIncident?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                selectedIncident?.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {selectedIncident?.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status & Assignment */}
                      <div className="space-y-4">
                        <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Status & Assignment</h5>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Status</p>
                              <span className={cn(
                                "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                                selectedIncident?.status === 'open' ? 'bg-red-100 text-red-800' :
                                selectedIncident?.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                                selectedIncident?.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              )}>
                                {selectedIncident?.status?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Location</p>
                              <p className="text-sm text-gray-600">{selectedIncident?.location || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Reported At</p>
                              <p className="text-sm text-gray-600">{selectedIncident?.reportedAt || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Description</h5>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-900">{selectedIncident?.description || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setDialogOpen(false)}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={3}
                  required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                      <select
                    value={formData.severity}
                    onChange={(e) => handleFormChange('severity', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                      <select
                    value={formData.assigneeId}
                    onChange={(e) => handleFormChange('assigneeId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                        <option value="">Unassigned</option>
                    {users.map((user) => (
                          <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
            {viewMode ? 'Close' : 'Cancel'}
              </button>
          {!viewMode && (
                <button
              onClick={handleSaveIncident}
              disabled={!formData.title || !formData.description || !formData.category}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedIncident ? 'Update' : 'Create'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancelDelete}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Delete Incident</span>
              </h3>
              <button
                onClick={handleCancelDelete}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700">
            Are you sure you want to delete "{incidentToDelete?.title}"?
            This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;