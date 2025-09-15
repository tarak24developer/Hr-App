import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  Clock,
  Building,
  Star,
  Globe,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Badge
} from 'lucide-react';
import { cn } from '../utils/cn';
import firebaseService from '../services/firebaseService';
import DashboardCard from '../components/DashboardCard';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'National' | 'Optional' | 'Company Specific';
  description: string;
  isActive: boolean;
  isRecurring: boolean;
  country?: string;
  region?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HolidayFormData {
  name: string;
  date: string;
  type: string;
  description: string;
  isActive: boolean;
  isRecurring: boolean;
  country: string;
  region: string;
}

const Holidays: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  // Form data
  const [formData, setFormData] = useState<HolidayFormData>({
    name: '',
    date: '',
    type: '',
    description: '',
    isActive: true,
    isRecurring: false,
    country: '',
    region: ''
  });

  // Load data
  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const response = await firebaseService.getCollection('holidays');
      if (response.success && response.data) {
        const holidayList: Holiday[] = response.data.map((doc: any) => ({
          id: doc.id || doc['id'],
          name: doc.name || '',
          date: doc.date || '',
          type: doc.type || 'National',
          description: doc.description || '',
          isActive: doc.isActive !== false,
          isRecurring: !!doc.isRecurring,
          country: doc.country || '',
          region: doc.region || '',
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date()
        }));
        setHolidays(holidayList);
      } else {
        setHolidays([]);
      }
    } catch (error) {
      console.error('Error loading holidays:', error);
      setError('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  // Filtered holidays
  const filteredHolidays = useMemo(() => {
    let filtered = [...holidays];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(holiday =>
        holiday.name.toLowerCase().includes(searchLower) ||
        holiday.description.toLowerCase().includes(searchLower) ||
        (holiday.country || '').toLowerCase().includes(searchLower)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(holiday => holiday.type === typeFilter);
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(holiday => holiday.date.startsWith(yearFilter));
    }

    if (showActiveOnly) {
      filtered = filtered.filter(holiday => holiday.isActive);
    }

    return filtered;
  }, [holidays, searchQuery, typeFilter, yearFilter, showActiveOnly]);

  // Statistics
  const stats = useMemo(() => {
    const total = holidays.length;
    const active = holidays.filter(h => h.isActive).length;
    const national = holidays.filter(h => h.type === 'National').length;
    const company = holidays.filter(h => h.type === 'Company Specific').length;
    const optional = holidays.filter(h => h.type === 'Optional').length;

    return { total, active, national, company, optional };
  }, [holidays]);

  // Form validation
  const isFormValid = useMemo(() => {
    return Boolean(
      (formData.name || '').trim() &&
      (formData.date || '').trim() &&
      (formData.type || '').trim()
    );
  }, [formData.name, formData.date, formData.type]);

  // Action handlers
  const handleCreateHoliday = () => {
    setFormData({
      name: '',
      date: '',
      type: '',
      description: '',
      isActive: true,
      isRecurring: false,
      country: '',
      region: ''
    });
    setShowCreateModal(true);
  };

  const handleViewHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setShowViewModal(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      description: holiday.description,
      isActive: holiday.isActive,
      isRecurring: holiday.isRecurring,
      country: holiday.country || '',
      region: holiday.region || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setShowDeleteModal(true);
  };

  const confirmDeleteHoliday = async () => {
    if (!selectedHoliday) return;
    
    try {
      await firebaseService.deleteDocument('holidays', selectedHoliday.id);
      setHolidays(prev => prev.filter(h => h.id !== selectedHoliday.id));
      setShowDeleteModal(false);
      setSuccessMessage('Holiday deleted successfully');
    } catch (error) {
      setError('Failed to delete holiday');
    }
  };

  const handleSaveHoliday = async () => {
    if (!isFormValid) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const holidayData = {
        ...formData,
        createdAt: selectedHoliday ? selectedHoliday.createdAt : new Date(),
        updatedAt: new Date()
      };

      if (selectedHoliday) {
        // Update existing holiday
        await firebaseService.updateDocument('holidays', selectedHoliday.id, holidayData);
        setHolidays(prev => prev.map(h => h.id === selectedHoliday.id ? { ...h, ...holidayData } as Holiday : h));
        setShowEditModal(false);
        setSuccessMessage('Holiday updated successfully');
      } else {
        // Create new holiday
        const response = await firebaseService.addDocument('holidays', holidayData);
        if (response.success && response.data) {
          setHolidays(prev => [...prev, response.data as Holiday]);
          setShowCreateModal(false);
          setSuccessMessage('Holiday created successfully');
        }
      }
    } catch (error) {
      setError('Failed to save holiday');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'National': return 'bg-blue-100 text-blue-800';
      case 'Optional': return 'bg-orange-100 text-orange-800';
      case 'Company Specific': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'National': return Globe;
      case 'Optional': return Star;
      case 'Company Specific': return Building;
      default: return Calendar;
    }
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const years = ['2024', '2025', '2026', '2027', '2028'];
  const holidayTypes = ['National', 'Optional', 'Company Specific'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading holidays...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Holiday Management</h1>
          <p className="text-gray-600">Manage company holidays, national holidays, and special days</p>
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
            onClick={handleCreateHoliday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
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
          name="Total Holidays"
          value={stats.total}
          icon={Calendar}
          color="blue"
        />
        <DashboardCard
          name="Active"
          value={stats.active}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          name="National"
          value={stats.national}
          icon={Globe}
          color="indigo"
        />
        <DashboardCard
          name="Company"
          value={stats.company}
          icon={Building}
          color="purple"
        />
        <DashboardCard
          name="Optional"
          value={stats.optional}
          icon={Star}
          color="yellow"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search holidays by name or description"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Types</option>
              {holidayTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Active Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Holidays Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holiday Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No holidays found</h3>
                    <p className="text-gray-600 mb-4">
                      {holidays.length === 0 
                        ? 'No holidays have been created yet. Click "Add Holiday" to get started.'
                        : 'No holidays match the current filters. Try adjusting your search criteria.'
                      }
                    </p>
                    {holidays.length === 0 && (
                      <button
                        onClick={handleCreateHoliday}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Holiday</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((holiday, index) => {
                  const TypeIcon = getTypeIcon(holiday.type);
                  return (
                    <tr key={holiday.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{holiday.name}</div>
                            {holiday.isRecurring && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Recurring
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(holiday.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getDayOfWeek(holiday.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          getTypeColor(holiday.type)
                        )}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {holiday.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {holiday.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewHoliday(holiday)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditHoliday(holiday)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHoliday(holiday)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add New Holiday</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.name || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                      placeholder="Enter holiday name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.date || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.type || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                    >
                      <option value="">Select type</option>
                      {holidayTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter country"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter holiday description"
                  />
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Recurring</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHoliday}
                disabled={!isFormValid}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  isFormValid
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                )}
              >
                Create Holiday
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedHoliday && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto z-[210]">
            <div className="p-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <Eye className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Holiday Details</h3>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Holiday Details Content */}
              <div className="space-y-6">
                {/* Holiday Header */}
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900">{selectedHoliday.name}</h4>
                    <p className="text-gray-600">{new Date(selectedHoliday.date).toLocaleDateString()}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        getTypeColor(selectedHoliday.type)
                      )}>
                        {selectedHoliday.type}
                      </span>
                      <span className="text-sm text-gray-500">{getDayOfWeek(selectedHoliday.date)}</span>
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
                          <CalendarIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Holiday Name</p>
                          <p className="text-sm text-gray-600">{selectedHoliday.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Date</p>
                          <p className="text-sm text-gray-600">{new Date(selectedHoliday.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Badge className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Type</p>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                            getTypeColor(selectedHoliday.type)
                          )}>
                            {selectedHoliday.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Day of Week</p>
                          <p className="text-sm text-gray-600">{getDayOfWeek(selectedHoliday.date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Status Information</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Status</p>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                            selectedHoliday.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          )}>
                            {selectedHoliday.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Star className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Recurring</p>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                            selectedHoliday.isRecurring ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          )}>
                            {selectedHoliday.isRecurring ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                {selectedHoliday.description && (
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Description</h5>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedHoliday.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 space-x-3">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditHoliday(selectedHoliday);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Edit Holiday
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Holiday</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.name || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                      placeholder="Enter holiday name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.date || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2",
                        (formData.type || '').trim() ? "border-gray-300 focus:ring-primary-500" : "border-red-300 focus:ring-red-500"
                      )}
                    >
                      <option value="">Select type</option>
                      {holidayTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter country"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter holiday description"
                  />
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Recurring</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHoliday}
                disabled={!isFormValid}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  isFormValid
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                )}
              >
                Update Holiday
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the holiday <strong>{selectedHoliday.name}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteHoliday}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Holiday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays;
