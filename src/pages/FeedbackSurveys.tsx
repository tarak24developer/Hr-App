import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Pagination,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  LinearProgress,
  Rating,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assessment as AssessmentIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Person as PersonIcon,
  Archive as ArchiveIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,

  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  BarChart as ChartIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import firebaseService from '@/services/firebaseService';
import { showNotification } from '@/utils/notification';

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

interface SurveyFilters {
  search: string;
  type: string;
  status: string;
  category: string;
  author: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

const initialFilters: SurveyFilters = {
  search: '',
  type: '',
  status: '',
  category: '',
  author: '',
  dateRange: {
    start: null,
    end: null
  }
};

const statusColors = {
  draft: '#9e9e9e',
  active: '#4caf50',
  paused: '#ff9800',
  closed: '#f44336',
  archived: '#607d8b'
};

const priorityColors = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  urgent: '#9c27b0'
};

const typeColors = {
  feedback: '#2196f3',
  satisfaction: '#4caf50',
  performance: '#ff9800',
  culture: '#9c27b0',
  training: '#607d8b',
  general: '#795548'
};

const FeedbackSurveys: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [filters, setFilters] = useState<SurveyFilters>(initialFilters);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Form state for creating/editing surveys
  const [surveyForm, setSurveyForm] = useState({
    title: '',
    description: '',
    category: '',
    type: 'general' as 'feedback' | 'satisfaction' | 'performance' | 'culture' | 'training' | 'general',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    targetAudience: [] as string[],
    isAnonymous: false,
    allowMultipleResponses: false,
    startDate: '',
    endDate: '',
    questions: [] as SurveyQuestion[],
    settings: {
      allowPartialCompletion: false,
      showProgressBar: true,
      randomizeQuestions: false,
      requireAuthentication: true,
      notificationEmails: [] as string[]
    }
  });

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: 'text' as 'text' | 'multiple_choice' | 'checkbox' | 'rating' | 'scale' | 'date' | 'file',
    required: false,
    options: [] as string[],
    minRating: 1,
    maxRating: 5,
    scaleLabels: [] as string[]
  });

  // Question editing state
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Fetch surveys from Firebase
  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await firebaseService.getCollection('surveys');
      
      if (result.success && result.data) {
        const surveysData = result.data.map((survey: any) => ({
          id: survey.id,
          title: survey.title || '',
          description: survey.description || '',
          category: survey.category || '',
          type: survey.type || 'general',
          status: survey.status || 'draft',
          priority: survey.priority || 'medium',
          authorId: survey.authorId || '',
          authorName: survey.authorName || '',
          targetAudience: survey.targetAudience || [],
          isAnonymous: survey.isAnonymous || false,
          allowMultipleResponses: survey.allowMultipleResponses || false,
          startDate: survey.startDate || '',
          endDate: survey.endDate || '',
          createdAt: survey.createdAt || '',
          updatedAt: survey.updatedAt || '',
          questions: survey.questions || [],
          responses: survey.responses || [],
          settings: survey.settings || {
            allowPartialCompletion: false,
            showProgressBar: true,
            randomizeQuestions: false,
            requireAuthentication: true,
            notificationEmails: []
          }
        }));
        setSurveys(surveysData);
      } else {
        setError('Failed to load surveys');
        showNotification('Error loading surveys', 'error');
      }
    } catch (err) {
      console.error('Error fetching surveys:', err);
      setError('Failed to load surveys');
      showNotification('Error loading surveys', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Survey form handlers
  const handleSurveyFormChange = (field: string, value: any) => {
    setSurveyForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setSurveyForm(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleSaveSurvey = async () => {
    try {
      if (!surveyForm.title || !surveyForm.description || !surveyForm.category) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      if (surveyForm.questions.length === 0) {
        showNotification('Please add at least one question', 'error');
        return;
      }

      const surveyData = {
        ...surveyForm,
        authorId: 'current-user-id', // TODO: Get from auth context
        authorName: 'Current User', // TODO: Get from auth context
        status: 'draft' as const,
        createdAt: isCreateMode ? new Date().toISOString() : selectedSurvey?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isCreateMode) {
        const result = await firebaseService.addDocument('surveys', surveyData);
        if (result.success) {
          showNotification('Survey created successfully!', 'success');
          setIsDialogOpen(false);
          resetSurveyForm();
          fetchSurveys();
        } else {
          showNotification('Failed to create survey', 'error');
        }
      } else if (selectedSurvey) {
        const result = await firebaseService.updateDocument('surveys', selectedSurvey.id, surveyData);
        if (result.success) {
          showNotification('Survey updated successfully!', 'success');
          setIsDialogOpen(false);
          resetSurveyForm();
          fetchSurveys();
        } else {
          showNotification('Failed to update survey', 'error');
        }
      }
    } catch (err) {
      console.error('Error saving survey:', err);
      showNotification('Error saving survey', 'error');
    }
  };

  const resetSurveyForm = () => {
    setSurveyForm({
      title: '',
      description: '',
      category: '',
      type: 'general' as 'feedback' | 'satisfaction' | 'performance' | 'culture' | 'training' | 'general',
      priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
      targetAudience: [] as string[],
      isAnonymous: false,
      allowMultipleResponses: false,
      startDate: '',
      endDate: '',
      questions: [] as SurveyQuestion[],
      settings: {
        allowPartialCompletion: false,
        showProgressBar: true,
        randomizeQuestions: false,
        requireAuthentication: true,
        notificationEmails: [] as string[]
      }
    });
    setQuestionForm({
      text: '',
      type: 'text' as 'text' | 'multiple_choice' | 'checkbox' | 'rating' | 'scale' | 'date' | 'file',
      required: false,
      options: [] as string[],
      minRating: 1,
      maxRating: 5,
      scaleLabels: [] as string[]
    });
    setEditingQuestionIndex(null);
    setShowQuestionForm(false);
  };

  // Question management functions
  const handleQuestionFormChange = (field: string, value: any) => {
    setQuestionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddQuestion = () => {
    if (!questionForm.text) {
      showNotification('Please enter question text', 'error');
      return;
    }

    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(),
      text: questionForm.text,
      type: questionForm.type,
      required: questionForm.required,
      options: questionForm.type === 'multiple_choice' || questionForm.type === 'checkbox' ? questionForm.options : [],
      minRating: questionForm.type === 'rating' ? questionForm.minRating : 1,
      maxRating: questionForm.type === 'rating' ? questionForm.maxRating : 5,
      scaleLabels: questionForm.type === 'scale' ? questionForm.scaleLabels : [],
      order: surveyForm.questions.length
    };

    setSurveyForm(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    // Reset question form
    setQuestionForm({
      text: '',
      type: 'text',
      required: false,
      options: [],
      minRating: 1,
      maxRating: 5,
      scaleLabels: []
    });
    setShowQuestionForm(false);
  };

  const handleEditQuestion = (index: number) => {
    const question = surveyForm.questions[index];
    if (!question) return;
    
    setQuestionForm({
      text: question.text,
      type: question.type,
      required: question.required,
      options: question.options || [],
      minRating: question.minRating || 1,
      maxRating: question.maxRating || 5,
      scaleLabels: question.scaleLabels || []
    });
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
  };

  const handleUpdateQuestion = () => {
    if (!questionForm.text || editingQuestionIndex === null) return;

    const currentQuestion = surveyForm.questions[editingQuestionIndex];
    if (!currentQuestion) return;

    const updatedQuestion: SurveyQuestion = {
      id: currentQuestion.id,
      text: questionForm.text,
      type: questionForm.type,
      required: questionForm.required,
      options: questionForm.type === 'multiple_choice' || questionForm.type === 'checkbox' ? questionForm.options : [],
      minRating: questionForm.type === 'rating' ? questionForm.minRating : 1,
      maxRating: questionForm.type === 'rating' ? questionForm.maxRating : 5,
      scaleLabels: questionForm.type === 'scale' ? questionForm.scaleLabels : [],
      order: currentQuestion.order
    };

    setSurveyForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === editingQuestionIndex ? updatedQuestion : q)
    }));

    setEditingQuestionIndex(null);
    setShowQuestionForm(false);
    setQuestionForm({
      text: '',
      type: 'text',
      required: false,
      options: [],
      minRating: 1,
      maxRating: 5,
      scaleLabels: []
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setSurveyForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleAddOption = () => {
    const newOption = `Option ${questionForm.options.length + 1}`;
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
  };

  const handleRemoveOption = (index: number) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [surveys, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...surveys];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(survey =>
        survey.title.toLowerCase().includes(searchLower) ||
        survey.description.toLowerCase().includes(searchLower) ||
        survey.authorName.toLowerCase().includes(searchLower) ||
        survey.category.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(survey => survey.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(survey => survey.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter(survey => survey.category === filters.category);
    }

    if (filters.author) {
      filtered = filtered.filter(survey => survey.authorName === filters.author);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(survey => survey.createdAt >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(survey => survey.createdAt <= filters.dateRange.end!);
    }

    setFilteredSurveys(filtered);
    setCurrentPage(1);
  }, [surveys, filters]);

  const handleFilterChange = (field: keyof SurveyFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateSurvey = () => {
    resetSurveyForm();
    setSelectedSurvey(null);
    setIsViewMode(false);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleEditSurvey = (survey: Survey) => {
    setSurveyForm({
      title: survey.title,
      description: survey.description,
      category: survey.category,
      type: survey.type,
      priority: survey.priority,
      targetAudience: survey.targetAudience,
      isAnonymous: survey.isAnonymous,
      allowMultipleResponses: survey.allowMultipleResponses,
      startDate: survey.startDate,
      endDate: survey.endDate || '',
      questions: survey.questions,
      settings: survey.settings
    });
    setSelectedSurvey(survey);
    setIsViewMode(false);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleViewSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setIsViewMode(true);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    try {
      const result = await firebaseService.deleteDocument('surveys', surveyId);
      
      if (result.success) {
        setSurveys(prev => prev.filter(survey => survey.id !== surveyId));
        setSnackbar({
          open: true,
          message: 'Survey deleted successfully',
          severity: 'success'
        });
        showNotification('Survey deleted successfully!', 'success');
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to delete survey',
          severity: 'error'
        });
        showNotification('Failed to delete survey', 'error');
      }
    } catch (err) {
      console.error('Error deleting survey:', err);
      setSnackbar({
        open: true,
        message: 'Error deleting survey',
        severity: 'error'
      });
      showNotification('Error deleting survey', 'error');
    }
  };

  const handleActivateSurvey = async (surveyId: string) => {
    try {
      const survey = surveys.find(s => s.id === surveyId);
      if (!survey) return;

      const updatedSurvey = {
        ...survey,
        status: 'active',
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('surveys', surveyId, updatedSurvey);
      
      if (result.success) {
        setSurveys(prev => prev.map(survey =>
          survey.id === surveyId
            ? { ...survey, status: 'active', updatedAt: new Date().toISOString() }
            : survey
        ));
        setSnackbar({
          open: true,
          message: 'Survey activated successfully',
          severity: 'success'
        });
        showNotification('Survey activated successfully!', 'success');
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to activate survey',
          severity: 'error'
        });
        showNotification('Failed to activate survey', 'error');
      }
    } catch (err) {
      console.error('Error activating survey:', err);
      setSnackbar({
        open: true,
        message: 'Error activating survey',
        severity: 'error'
      });
      showNotification('Error activating survey', 'error');
    }
  };

  const handlePauseSurvey = async (surveyId: string) => {
    try {
      const survey = surveys.find(s => s.id === surveyId);
      if (!survey) return;

      const updatedSurvey = {
        ...survey,
        status: 'paused',
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('surveys', surveyId, updatedSurvey);
      
      if (result.success) {
        setSurveys(prev => prev.map(survey =>
          survey.id === surveyId
            ? { ...survey, status: 'paused', updatedAt: new Date().toISOString() }
            : survey
        ));
        setSnackbar({
          open: true,
          message: 'Survey paused successfully',
          severity: 'warning'
        });
        showNotification('Survey paused successfully!', 'info');
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to pause survey',
          severity: 'error'
        });
        showNotification('Failed to pause survey', 'error');
      }
    } catch (err) {
      console.error('Error pausing survey:', err);
      setSnackbar({
        open: true,
        message: 'Error pausing survey',
        severity: 'error'
      });
      showNotification('Error pausing survey', 'error');
    }
  };

  const handleCloseSurvey = async (surveyId: string) => {
    try {
      const survey = surveys.find(s => s.id === surveyId);
      if (!survey) return;

      const updatedSurvey = {
        ...survey,
        status: 'closed',
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('surveys', surveyId, updatedSurvey);
      
      if (result.success) {
        setSurveys(prev => prev.map(survey =>
          survey.id === surveyId
            ? { ...survey, status: 'closed', updatedAt: new Date().toISOString() }
            : survey
        ));
        setSnackbar({
          open: true,
          message: 'Survey closed successfully',
          severity: 'info'
        });
        showNotification('Survey closed successfully!', 'info');
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to close survey',
          severity: 'error'
        });
        showNotification('Failed to close survey', 'error');
      }
    } catch (err) {
      console.error('Error closing survey:', err);
      setSnackbar({
        open: true,
        message: 'Error closing survey',
        severity: 'error'
      });
      showNotification('Error closing survey', 'error');
    }
  };

  const handleArchiveSurvey = async (surveyId: string) => {
    try {
      const survey = surveys.find(s => s.id === surveyId);
      if (!survey) return;

      const updatedSurvey = {
        ...survey,
        status: 'archived',
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('surveys', surveyId, updatedSurvey);
      
      if (result.success) {
        setSurveys(prev => prev.map(survey =>
          survey.id === surveyId
            ? { ...survey, status: 'archived', updatedAt: new Date().toISOString() }
            : survey
        ));
        setSnackbar({
          open: true,
          message: 'Survey archived successfully',
          severity: 'info'
        });
        showNotification('Survey archived successfully!', 'info');
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to archive survey',
          severity: 'error'
        });
        showNotification('Failed to archive survey', 'error');
      }
    } catch (err) {
      console.error('Error archiving survey:', err);
      setSnackbar({
        open: true,
        message: 'Error archiving survey',
        severity: 'error'
      });
      showNotification('Error archiving survey', 'error');
    }
  };

  

  const getResponseRate = (survey: Survey) => {
    if (!survey.targetAudience.length) return 0;
    const targetCount = survey.targetAudience.length;
    const responseCount = survey.responses.length;
    return Math.round((responseCount / targetCount) * 100);
  };

  const getAverageRating = (survey: Survey) => {
    const ratingQuestions = survey.questions.filter(q => q.type === 'rating');
    if (ratingQuestions.length === 0) return 0;

    let totalRating = 0;
    let ratingCount = 0;

    survey.responses.forEach(response => {
      response.answers.forEach(answer => {
        if (answer.ratingValue) {
          totalRating += answer.ratingValue;
          ratingCount++;
        }
      });
    });

    return ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <InfoIcon color="action" />;
      case 'active':
        return <CheckCircleIcon color="success" />;
      case 'paused':
        return <WarningIcon color="warning" />;
      case 'closed':
        return <ErrorIcon color="error" />;
      case 'archived':
        return <ArchiveIcon color="action" />;
      default:
        return <InfoIcon />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <WarningIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <WarningIcon color="action" />;
      default:
        return <WarningIcon />;
    }
  };

  const getSurveyTypeLabel = (type: string) => {
    switch (type) {
      case 'feedback':
        return 'Feedback';
      case 'satisfaction':
        return 'Satisfaction';
      case 'performance':
        return 'Performance';
      case 'culture':
        return 'Culture';
      case 'training':
        return 'Training';
      case 'general':
        return 'General';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const paginatedSurveys = filteredSurveys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchSurveys} variant="contained">
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Feedback & Surveys
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ChartIcon />}
            onClick={() => {}}
          >
            Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {}}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSurvey}
            sx={{ bgcolor: 'primary.main' }}
          >
            Create Survey
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, 
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Surveys
            </Typography>
            <Typography variant="h4" component="div">
              {surveys.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Surveys
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {surveys.filter(survey => survey.status === 'active').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Responses
            </Typography>
            <Typography variant="h4" component="div" color="primary.main">
              {surveys.reduce((total, survey) => total + survey.responses.length, 0)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Avg. Response Rate
            </Typography>
            <Typography variant="h4" component="div" color="info.main">
              {surveys.length > 0 
                ? Math.round(surveys.reduce((total, survey) => total + getResponseRate(survey), 0) / surveys.length)
                : 0}%
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* No Data State */}
      {surveys.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No surveys available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by creating your first survey to collect feedback from your team.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSurvey}
          >
            Create First Survey
          </Button>
        </Box>
      )}

      {/* Filters */}
      {surveys.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2 
          }}>
            <TextField
              fullWidth
              label="Search Surveys"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Survey Type</InputLabel>
              <Select
                value={filters.type}
                label="Survey Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="feedback">Feedback</MenuItem>
                <MenuItem value="satisfaction">Satisfaction</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="culture">Culture</MenuItem>
                <MenuItem value="training">Training</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Training">Training</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      {/* Surveys Table */}
      {surveys.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Survey</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Response Rate</TableCell>
                  <TableCell>Avg. Rating</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSurveys.map((survey) => (
                  <TableRow key={survey.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {survey.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 200 }}>
                          {survey.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            label={survey.category}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`${survey.questions.length} questions`}
                            size="small"
                            variant="outlined"
                            icon={<QuestionAnswerIcon />}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getSurveyTypeLabel(survey.type)}
                        size="small"
                        sx={{
                          bgcolor: typeColors[survey.type],
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(survey.status)}
                        <Chip
                          label={survey.status}
                          size="small"
                          sx={{
                            bgcolor: statusColors[survey.status],
                            color: 'white',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getPriorityIcon(survey.priority)}
                        <Chip
                          label={survey.priority}
                          size="small"
                          sx={{
                            bgcolor: priorityColors[survey.priority],
                            color: 'white',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <PersonIcon />
                        </Avatar>
                        <Typography variant="body2">
                          {survey.authorName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%', maxWidth: 100 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="textSecondary">
                            {getResponseRate(survey)}%
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {survey.responses.length}/{survey.targetAudience.length}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={getResponseRate(survey)}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating
                          value={getAverageRating(survey)}
                          readOnly
                          size="small"
                          precision={0.1}
                        />
                        <Typography variant="body2">
                          {getAverageRating(survey).toFixed(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(survey.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewSurvey(survey)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Survey">
                          <IconButton
                            size="small"
                            onClick={() => handleEditSurvey(survey)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {survey.status === 'draft' && (
                          <Tooltip title="Activate Survey">
                            <IconButton
                              size="small"
                              onClick={() => handleActivateSurvey(survey.id)}
                              color="success"
                            >
                              <SendIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {survey.status === 'active' && (
                          <>
                            <Tooltip title="Pause Survey">
                              <IconButton
                                size="small"
                                onClick={() => handlePauseSurvey(survey.id)}
                                color="warning"
                              >
                                <WarningIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Close Survey">
                              <IconButton
                                size="small"
                                onClick={() => handleCloseSurvey(survey.id)}
                                color="error"
                              >
                                <ErrorIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {survey.status === 'closed' && (
                          <Tooltip title="Archive Survey">
                            <IconButton
                              size="small"
                              onClick={() => handleArchiveSurvey(survey.id)}
                              color="default"
                            >
                              <ArchiveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete Survey">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSurvey(survey.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Survey Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon />
            <Typography variant="h6">
              {isViewMode ? 'Survey Details' : isCreateMode ? 'Create New Survey' : 'Edit Survey'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isViewMode && selectedSurvey ? (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3 
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom>Survey Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Title"
                        secondary={selectedSurvey.title}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Description"
                        secondary={selectedSurvey.description}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Type"
                        secondary={getSurveyTypeLabel(selectedSurvey.type)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={selectedSurvey.status}
                            size="small"
                            sx={{
                              bgcolor: statusColors[selectedSurvey.status],
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Priority"
                        secondary={
                          <Chip
                            label={selectedSurvey.priority}
                            size="small"
                            sx={{
                              bgcolor: priorityColors[selectedSurvey.priority],
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Survey Statistics</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Questions"
                        secondary={selectedSurvey.questions.length}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Responses"
                        secondary={selectedSurvey.responses.length}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Response Rate"
                        secondary={`${getResponseRate(selectedSurvey)}%`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Average Rating"
                        secondary={getAverageRating(selectedSurvey).toFixed(1)}
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Questions</Typography>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Survey Questions ({selectedSurvey.questions.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {selectedSurvey.questions.map((question, index) => (
                        <ListItem key={question.id} divider>
                          <ListItemIcon>
                            <QuestionAnswerIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${index + 1}. ${question.text}`}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  Type: {question.type}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Required: {question.required ? 'Yes' : 'No'}
                                </Typography>
                                {question.options && question.options.length > 0 && (
                                  <Typography variant="caption" display="block">
                                    Options: {question.options.join(', ')}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Box>
              {selectedSurvey.responses.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Recent Responses</Typography>
                  <List>
                    {selectedSurvey.responses.slice(0, 3).map((response) => (
                      <ListItem key={response.id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={response.respondentName || 'Anonymous'}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                Submitted: {formatDate(response.submittedAt)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Completion Time: {response.completionTime}s
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* Survey Form */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Survey Title"
                  value={surveyForm.title}
                  onChange={(e) => handleSurveyFormChange('title', e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Category"
                  value={surveyForm.category}
                  onChange={(e) => handleSurveyFormChange('category', e.target.value)}
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Survey Type</InputLabel>
                  <Select
                    value={surveyForm.type}
                    label="Survey Type"
                    onChange={(e) => handleSurveyFormChange('type', e.target.value)}
                  >
                    <MenuItem value="feedback">Feedback</MenuItem>
                    <MenuItem value="satisfaction">Satisfaction</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                    <MenuItem value="culture">Culture</MenuItem>
                    <MenuItem value="training">Training</MenuItem>
                    <MenuItem value="general">General</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={surveyForm.priority}
                    label="Priority"
                    onChange={(e) => handleSurveyFormChange('priority', e.target.value)}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={surveyForm.startDate}
                  onChange={(e) => handleSurveyFormChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="End Date (Optional)"
                  type="date"
                  value={surveyForm.endDate}
                  onChange={(e) => handleSurveyFormChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Description"
                value={surveyForm.description}
                onChange={(e) => handleSurveyFormChange('description', e.target.value)}
                multiline
                rows={3}
                required
                sx={{ mb: 3 }}
              />

              {/* Settings */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Settings</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={surveyForm.isAnonymous}
                        onChange={(e) => handleSurveyFormChange('isAnonymous', e.target.checked)}
                      />
                    }
                    label="Anonymous Responses"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={surveyForm.allowMultipleResponses}
                        onChange={(e) => handleSurveyFormChange('allowMultipleResponses', e.target.checked)}
                      />
                    }
                    label="Allow Multiple Responses"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={surveyForm.settings.showProgressBar}
                        onChange={(e) => handleSettingsChange('showProgressBar', e.target.checked)}
                      />
                    }
                    label="Show Progress Bar"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={surveyForm.settings.requireAuthentication}
                        onChange={(e) => handleSettingsChange('requireAuthentication', e.target.checked)}
                      />
                    }
                    label="Require Authentication"
                  />
                </Box>
              </Box>

              {/* Questions Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Questions ({surveyForm.questions.length})</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setShowQuestionForm(true)}
                  >
                    Add Question
                  </Button>
                </Box>

                {/* Questions List */}
                {surveyForm.questions.map((question, index) => (
                  <Card key={question.id} sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {index + 1}. {question.text}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={question.type} size="small" />
                          <Chip label={question.required ? 'Required' : 'Optional'} size="small" />
                          {question.options && question.options.length > 0 && (
                            <Chip label={`${question.options.length} options`} size="small" />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditQuestion(index)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteQuestion(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                ))}

                {surveyForm.questions.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed #ccc', borderRadius: 2 }}>
                    <QuestionAnswerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No questions added yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Add questions to your survey to start collecting responses.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowQuestionForm(true)}
                    >
                      Add First Question
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Question Form Modal */}
              {showQuestionForm && (
                <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Question Text"
                      value={questionForm.text}
                      onChange={(e) => handleQuestionFormChange('text', e.target.value)}
                      required
                    />
                    <FormControl fullWidth>
                      <InputLabel>Question Type</InputLabel>
                      <Select
                        value={questionForm.type}
                        label="Question Type"
                        onChange={(e) => handleQuestionFormChange('type', e.target.value)}
                      >
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                        <MenuItem value="checkbox">Checkbox</MenuItem>
                        <MenuItem value="rating">Rating</MenuItem>
                        <MenuItem value="scale">Scale</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={questionForm.required}
                        onChange={(e) => handleQuestionFormChange('required', e.target.checked)}
                      />
                    }
                    label="Required Question"
                    sx={{ mb: 2 }}
                  />

                  {/* Options for multiple choice and checkbox */}
                  {(questionForm.type === 'multiple_choice' || questionForm.type === 'checkbox') && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Options</Typography>
                      {questionForm.options.map((option, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <TextField
                            size="small"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            sx={{ flex: 1 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveOption(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleAddOption}
                        startIcon={<AddIcon />}
                      >
                        Add Option
                      </Button>
                    </Box>
                  )}

                  {/* Rating range for rating questions */}
                  {questionForm.type === 'rating' && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mb: 2 }}>
                      <TextField
                        label="Min Rating"
                        type="number"
                        value={questionForm.minRating}
                        onChange={(e) => handleQuestionFormChange('minRating', parseInt(e.target.value))}
                        inputProps={{ min: 1, max: 10 }}
                      />
                      <TextField
                        label="Max Rating"
                        type="number"
                        value={questionForm.maxRating}
                        onChange={(e) => handleQuestionFormChange('maxRating', parseInt(e.target.value))}
                        inputProps={{ min: 1, max: 10 }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowQuestionForm(false);
                        setEditingQuestionIndex(null);
                        setQuestionForm({
                          text: '',
                          type: 'text',
                          required: false,
                          options: [],
                          minRating: 1,
                          maxRating: 5,
                          scaleLabels: []
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={editingQuestionIndex !== null ? handleUpdateQuestion : handleAddQuestion}
                    >
                      {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isViewMode ? (
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          ) : (
            <>
              <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleSaveSurvey}
              >
                {isCreateMode ? 'Create Survey' : 'Update Survey'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FeedbackSurveys; 