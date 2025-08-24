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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup
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
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  BarChart as ChartIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

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
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  submittedAt: Date;
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
    start: Date | null;
    end: Date | null;
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Mock data for development
  const mockSurveys: Survey[] = [
    {
      id: '1',
      title: 'Employee Satisfaction Survey 2024',
      description: 'Annual survey to measure employee satisfaction and identify areas for improvement',
      category: 'HR',
      type: 'satisfaction',
      status: 'active',
      priority: 'high',
      authorId: '1',
      authorName: 'HR Manager',
      targetAudience: ['All Employees', 'Managers'],
      isAnonymous: true,
      allowMultipleResponses: false,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      createdAt: new Date('2023-12-15'),
      updatedAt: new Date('2024-01-01'),
      questions: [
        {
          id: 'q1',
          text: 'How satisfied are you with your current role?',
          type: 'rating',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 1
        },
        {
          id: 'q2',
          text: 'What aspects of your job do you find most rewarding?',
          type: 'text',
          required: false,
          order: 2
        },
        {
          id: 'q3',
          text: 'How would you rate the work-life balance?',
          type: 'rating',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 3
        }
      ],
      responses: [
        {
          id: 'r1',
          surveyId: '1',
          respondentName: 'John Doe',
          respondentEmail: 'john.doe@company.com',
          submittedAt: new Date('2024-01-15'),
          answers: [
            {
              id: 'a1',
              questionId: 'q1',
              value: 4,
              ratingValue: 4
            },
            {
              id: 'a2',
              questionId: 'q2',
              value: 'Working with great team members',
              textValue: 'Working with great team members'
            },
            {
              id: 'a3',
              questionId: 'q3',
              value: 3,
              ratingValue: 3
            }
          ],
          completionTime: 180,
          isComplete: true
        }
      ],
      settings: {
        allowPartialCompletion: false,
        showProgressBar: true,
        randomizeQuestions: false,
        requireAuthentication: true,
        notificationEmails: ['hr@company.com']
      }
    },
    {
      id: '2',
      title: 'Training Program Feedback',
      description: 'Collect feedback on recent training programs to improve future sessions',
      category: 'Training',
      type: 'training',
      status: 'closed',
      priority: 'medium',
      authorId: '2',
      authorName: 'Training Coordinator',
      targetAudience: ['Training Participants'],
      isAnonymous: false,
      allowMultipleResponses: false,
      startDate: new Date('2023-12-01'),
      endDate: new Date('2023-12-15'),
      createdAt: new Date('2023-11-20'),
      updatedAt: new Date('2023-12-16'),
      questions: [
        {
          id: 'q4',
          text: 'How effective was the training content?',
          type: 'rating',
          required: true,
          minRating: 1,
          maxRating: 5,
          order: 1
        },
        {
          id: 'q5',
          text: 'What topics would you like to see covered in future training?',
          type: 'text',
          required: false,
          order: 2
        }
      ],
      responses: [],
      settings: {
        allowPartialCompletion: true,
        showProgressBar: true,
        randomizeQuestions: false,
        requireAuthentication: false,
        notificationEmails: ['training@company.com']
      }
    }
  ];

  useEffect(() => {
    // Load mock data
    setSurveys(mockSurveys);
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
    setSelectedSurvey(null);
    setIsViewMode(false);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleEditSurvey = (survey: Survey) => {
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

  const handleDeleteSurvey = (surveyId: string) => {
    setSurveys(prev => prev.filter(survey => survey.id !== surveyId));
    setSnackbar({
      open: true,
      message: 'Survey deleted successfully',
      severity: 'success'
    });
  };

  const handleActivateSurvey = (surveyId: string) => {
    setSurveys(prev => prev.map(survey =>
      survey.id === surveyId
        ? { ...survey, status: 'active', updatedAt: new Date() }
        : survey
    ));
    setSnackbar({
      open: true,
      message: 'Survey activated successfully',
      severity: 'success'
    });
  };

  const handlePauseSurvey = (surveyId: string) => {
    setSurveys(prev => prev.map(survey =>
      survey.id === surveyId
        ? { ...survey, status: 'paused', updatedAt: new Date() }
        : survey
    ));
    setSnackbar({
      open: true,
      message: 'Survey paused successfully',
      severity: 'warning'
    });
  };

  const handleCloseSurvey = (surveyId: string) => {
    setSurveys(prev => prev.map(survey =>
      survey.id === surveyId
        ? { ...survey, status: 'closed', updatedAt: new Date() }
        : survey
    ));
    setSnackbar({
      open: true,
      message: 'Survey closed successfully',
      severity: 'info'
    });
  };

  const handleArchiveSurvey = (surveyId: string) => {
    setSurveys(prev => prev.map(survey =>
      survey.id === surveyId
        ? { ...survey, status: 'archived', updatedAt: new Date() }
        : survey
    ));
    setSnackbar({
      open: true,
      message: 'Survey archived successfully',
      severity: 'info'
    });
  };

  const handleSaveSurvey = (surveyData: Partial<Survey>) => {
    if (selectedSurvey && !isCreateMode) {
      // Update existing survey
      setSurveys(prev => prev.map(survey =>
        survey.id === selectedSurvey.id
          ? { ...survey, ...surveyData, updatedAt: new Date() }
          : survey
      ));
      setSnackbar({
        open: true,
        message: 'Survey updated successfully',
        severity: 'success'
      });
    } else {
      // Create new survey
      const newSurvey: Survey = {
        id: Date.now().toString(),
        title: surveyData.title || '',
        description: surveyData.description || '',
        category: surveyData.category || '',
        type: surveyData.type || 'general',
        status: 'draft',
        priority: surveyData.priority || 'medium',
        authorId: '1', // Current user ID
        authorName: 'Current User',
        targetAudience: surveyData.targetAudience || [],
        isAnonymous: surveyData.isAnonymous || false,
        allowMultipleResponses: surveyData.allowMultipleResponses || false,
        startDate: surveyData.startDate || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: surveyData.questions || [],
        responses: [],
        settings: surveyData.settings || {
          allowPartialCompletion: false,
          showProgressBar: true,
          randomizeQuestions: false,
          requireAuthentication: true,
          notificationEmails: []
        }
      };
      setSurveys(prev => [newSurvey, ...prev]);
      setSnackbar({
        open: true,
        message: 'Survey created successfully',
        severity: 'success'
      });
    }
    setIsDialogOpen(false);
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

  const paginatedSurveys = filteredSurveys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);

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

      {/* Filters */}
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

      {/* Surveys Table */}
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
                      {survey.createdAt.toLocaleDateString()}
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
          {selectedSurvey && (
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
                                Submitted: {response.submittedAt.toLocaleString()}
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
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