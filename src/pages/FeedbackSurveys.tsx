import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Users,
  Download,
  User as UserIcon,
  Badge,
  Clock as ClockIcon
} from 'lucide-react';
import { cn } from '../utils/cn';
import firebaseService from '../services/firebaseService';
import DashboardCard from '../components/DashboardCard';

interface Survey {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'feedback' | 'satisfaction' | 'performance' | 'culture' | 'training' | 'general';
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  authorId: string;
  authorName: string;
  targetAudience: string[];
  isAnonymous: boolean;
  allowMultipleResponses: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  settings: SurveySettings;
}

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'checkbox' | 'rating' | 'scale' | 'date' | 'file';
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  scaleLabels?: string[];
  order: number;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId?: string;
  respondentName?: string;
  respondentEmail?: string;
  submittedAt: string;
  answers: SurveyAnswer[];
  completionTime?: number;
  isComplete: boolean;
}

interface SurveyAnswer {
  id: string;
  questionId: string;
  value: string | string[] | number;
  textValue?: string;
  ratingValue?: number;
  selectedOptions?: string[];
}

interface SurveySettings {
  allowPartialCompletion: boolean;
  showProgressBar: boolean;
  randomizeQuestions: boolean;
  timeLimit?: number;
  requireAuthentication: boolean;
  notificationEmails: string[];
}

const FeedbackSurveys: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  // Form data
  const [formData, setFormData] = useState<Partial<Survey>>({
    title: '',
    description: '',
    category: '',
    type: 'feedback',
    status: 'draft',
    priority: 'medium',
    authorName: '',
    targetAudience: [],
    isAnonymous: false,
    allowMultipleResponses: false,
    startDate: '',
    endDate: '',
    questions: [],
    responses: [],
    settings: {
      allowPartialCompletion: true,
      showProgressBar: true,
      randomizeQuestions: false,
      requireAuthentication: true,
      notificationEmails: []
    }
  });

  // Load data
  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const response = await firebaseService.getCollection('surveys');
      if (response.success && response.data) {
        const surveyList: Survey[] = response.data.map((doc: any) => ({
          id: doc.id || doc['id'],
          title: doc.title || '',
          description: doc.description || '',
          category: doc.category || '',
          type: doc.type || 'feedback',
          status: doc.status || 'draft',
          priority: doc.priority || 'medium',
          authorId: doc.authorId || '',
          authorName: doc.authorName || '',
          targetAudience: doc.targetAudience || [],
          isAnonymous: doc.isAnonymous || false,
          allowMultipleResponses: doc.allowMultipleResponses || false,
          startDate: doc.startDate || '',
          endDate: doc.endDate || '',
          createdAt: doc.createdAt || new Date().toISOString(),
          updatedAt: doc.updatedAt || new Date().toISOString(),
          questions: doc.questions || [],
          responses: doc.responses || [],
          settings: doc.settings || {
            allowPartialCompletion: true,
            showProgressBar: true,
            randomizeQuestions: false,
            requireAuthentication: true,
            notificationEmails: []
          }
        }));
        setSurveys(surveyList);
      } else {
        setSurveys([]);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
      setError('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  // Filtered surveys
  const filteredSurveys = useMemo(() => {
    let filtered = [...surveys];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(survey =>
        survey.title.toLowerCase().includes(searchLower) ||
        survey.description.toLowerCase().includes(searchLower) ||
        survey.category.toLowerCase().includes(searchLower) ||
        survey.authorName.toLowerCase().includes(searchLower)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(survey => survey.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(survey => survey.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(survey => survey.category === categoryFilter);
    }

    return filtered;
  }, [surveys, searchQuery, typeFilter, statusFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = surveys.length;
    const active = surveys.filter(s => s.status === 'active').length;
    const draft = surveys.filter(s => s.status === 'draft').length;
    const closed = surveys.filter(s => s.status === 'closed').length;
    const responses = surveys.reduce((acc, s) => acc + s.responses.length, 0);

    return { total, active, draft, closed, responses };
  }, [surveys]);


  // Form validation
  const isFormValid = useMemo(() => {
    return Boolean(
      (formData.title || '').trim() &&
      (formData.description || '').trim() &&
      (formData.category || '').trim()
    );
  }, [formData.title, formData.description, formData.category]);

  // Action handlers
  const handleCreateSurvey = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      type: 'feedback',
      status: 'draft',
      priority: 'medium',
      authorName: '',
      targetAudience: [],
      isAnonymous: false,
      allowMultipleResponses: false,
      startDate: '',
      endDate: '',
      questions: [],
      responses: [],
      settings: {
        allowPartialCompletion: true,
        showProgressBar: true,
        randomizeQuestions: false,
        requireAuthentication: true,
        notificationEmails: []
      }
    });
    setShowCreateModal(true);
  };

  const handleViewSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setShowViewModal(true);
  };

  const handleEditSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setFormData(survey);
    setShowEditModal(true);
  };

  const handleDeleteSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setShowDeleteModal(true);
  };

  const confirmDeleteSurvey = async () => {
    if (!selectedSurvey) return;
    
    try {
      await firebaseService.deleteDocument('surveys', selectedSurvey.id);
      setSurveys(prev => prev.filter(s => s.id !== selectedSurvey.id));
      setShowDeleteModal(false);
      setSuccessMessage('Survey deleted successfully');
    } catch (error) {
      setError('Failed to delete survey');
    }
  };

  const handleSaveSurvey = async () => {
    if (!isFormValid) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const surveyData = {
        ...formData,
        createdAt: selectedSurvey ? selectedSurvey.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (selectedSurvey) {
        // Update existing survey
        await firebaseService.updateDocument('surveys', selectedSurvey.id, surveyData);
        setSurveys(prev => prev.map(s => s.id === selectedSurvey.id ? { ...s, ...surveyData } : s));
        setShowEditModal(false);
        setSuccessMessage('Survey updated successfully');
      } else {
        // Create new survey
        const response = await firebaseService.addDocument('surveys', surveyData);
        if (response.success && response.data) {
          setSurveys(prev => [...prev, response.data as Survey]);
          setShowCreateModal(false);
          setSuccessMessage('Survey created successfully');
        }
      }
    } catch (error) {
      setError('Failed to save survey');
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feedback': return 'bg-blue-100 text-blue-800';
      case 'satisfaction': return 'bg-green-100 text-green-800';
      case 'performance': return 'bg-purple-100 text-purple-800';
      case 'culture': return 'bg-pink-100 text-pink-800';
      case 'training': return 'bg-indigo-100 text-indigo-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const surveyTypes = ['feedback', 'satisfaction', 'performance', 'culture', 'training', 'general'];
  const surveyStatuses = ['draft', 'active', 'paused', 'closed', 'archived'];
  const surveyCategories = ['HR', 'Operations', 'IT', 'Finance', 'General'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading surveys...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Feedback Surveys</h1>
          <p className="text-gray-600">Create and manage employee feedback surveys</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={() => {/* Export functionality */}}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={handleCreateSurvey}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Survey</span>
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
          name="Total Surveys"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <DashboardCard
          name="Active"
          value={stats.active}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          name="Draft"
          value={stats.draft}
          icon={FileText}
          color="yellow"
        />
        <DashboardCard
          name="Closed"
          value={stats.closed}
          icon={FileText}
          color="gray"
        />
        <DashboardCard
          name="Responses"
          value={stats.responses}
          icon={Users}
          color="purple"
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
              placeholder="Search surveys by title, description, or author"
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
              {surveyTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Status</option>
              {surveyStatuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Categories</option>
              {surveyCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Surveys Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
                    <p className="text-gray-600 mb-4">
                      {surveys.length === 0 
                        ? 'No surveys have been created yet. Click "Create Survey" to get started.'
                        : 'No surveys match the current filters. Try adjusting your search criteria.'
                      }
                    </p>
                    {surveys.length === 0 && (
                      <button
                        onClick={handleCreateSurvey}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Survey</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey, index) => (
                  <tr key={survey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{survey.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{survey.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        getTypeColor(survey.type)
                      )}>
                        {survey.type.charAt(0).toUpperCase() + survey.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{survey.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        getStatusColor(survey.status)
                      )}>
                        {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{survey.authorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{survey.responses.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewSurvey(survey)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditSurvey(survey)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSurvey(survey)}
                          className="text-red-600 hover:text-red-900"
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

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New Survey</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Survey Title *</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter survey title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter survey description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select category</option>
                    {surveyCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type || 'feedback'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {surveyTypes.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {surveyStatuses.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.authorName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter author name"
                  />
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
                onClick={handleSaveSurvey}
                disabled={!isFormValid}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Survey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Survey Modal */}
      {showViewModal && selectedSurvey && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200] p-3">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto z-[210]">
            <div className="p-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <Eye className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Survey Details</h3>
                </div>
              <button
                onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                  <X className="w-4 h-4" />
              </button>
            </div>

              {/* Survey Details Content */}
              <div className="space-y-6">
                {/* Survey Header */}
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900">{selectedSurvey.title}</h4>
                    <p className="text-gray-600">{selectedSurvey.category}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        getTypeColor(selectedSurvey.type)
                      )}>
                        {selectedSurvey.type.charAt(0).toUpperCase() + selectedSurvey.type.slice(1)}
                      </span>
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        getStatusColor(selectedSurvey.status)
                      )}>
                        {selectedSurvey.status.charAt(0).toUpperCase() + selectedSurvey.status.slice(1)}
                      </span>
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
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                <div>
                          <p className="text-sm font-medium text-gray-900">Title</p>
                          <p className="text-sm text-gray-600">{selectedSurvey.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Badge className="w-4 h-4 text-green-600" />
                </div>
                <div>
                          <p className="text-sm font-medium text-gray-900">Category</p>
                          <p className="text-sm text-gray-600">{selectedSurvey.category}</p>
                </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-purple-600" />
                        </div>
                  <div>
                          <p className="text-sm font-medium text-gray-900">Author</p>
                          <p className="text-sm text-gray-600">{selectedSurvey.authorName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Responses</p>
                          <p className="text-sm text-gray-600">{selectedSurvey.responses.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Status Information</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Type</p>
                    <span className={cn(
                            "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                      getTypeColor(selectedSurvey.type)
                    )}>
                      {selectedSurvey.type.charAt(0).toUpperCase() + selectedSurvey.type.slice(1)}
                    </span>
                  </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-green-600" />
                        </div>
                  <div>
                          <p className="text-sm font-medium text-gray-900">Status</p>
                    <span className={cn(
                            "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                      getStatusColor(selectedSurvey.status)
                    )}>
                      {selectedSurvey.status.charAt(0).toUpperCase() + selectedSurvey.status.slice(1)}
                    </span>
                  </div>
                </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                          <p className="text-sm font-medium text-gray-900">Priority</p>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full",
                            getPriorityColor(selectedSurvey.priority)
                          )}>
                            {selectedSurvey.priority.charAt(0).toUpperCase() + selectedSurvey.priority.slice(1)}
                          </span>
                </div>
                </div>
              </div>
            </div>
                </div>

                {/* Description Section */}
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Description</h5>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{selectedSurvey.description}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Additional Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Anonymous</span>
                        <span className="text-sm text-gray-900">{selectedSurvey.isAnonymous ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Multiple Responses</span>
                        <span className="text-sm text-gray-900">{selectedSurvey.allowMultipleResponses ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Target Audience</span>
                        <span className="text-sm text-gray-900">{selectedSurvey.targetAudience.length} groups</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Survey Modal */}
      {showEditModal && selectedSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Survey</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Survey Title *</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter survey title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Enter survey description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select category</option>
                    {surveyCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type || 'feedback'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {surveyTypes.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {surveyStatuses.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.authorName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter author name"
                  />
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
                onClick={handleSaveSurvey}
                disabled={!isFormValid}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Update Survey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete Survey</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600">
                Are you sure you want to delete "{selectedSurvey.title}"? This action cannot be undone.
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
                onClick={confirmDeleteSurvey}
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

export default FeedbackSurveys;
