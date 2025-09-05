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
  Card,
  CardContent,
  Alert,
  Snackbar,
  TablePagination,
  Tooltip,
  Avatar,
  CircularProgress,
  Fade,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Announcement as AnnouncementIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';

interface Announcement {
  id: string;
  title: string;
  content: string;
  summary: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'general' | 'urgent' | 'maintenance' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  authorId: string;
  targetAudience: string[];
  isPublished: boolean;
  isPinned: boolean;
  isArchived: boolean;
  publishDate: Date;
  expiryDate?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
  attachments: string[];
  tags: string[];
  readCount: number;
  likeCount: number;
  commentCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AnnouncementCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

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
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<AnnouncementFilters>(initialFilters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    type: 'general' as 'info' | 'warning' | 'error' | 'success' | 'general' | 'urgent' | 'maintenance' | 'update',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: '',
    targetAudience: ['all'] as string[]
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });



  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load announcements
      const announcementsResult = await firebaseService.getCollection('announcements');
      if (announcementsResult?.success && announcementsResult.data) {
        const transformedAnnouncements: Announcement[] = announcementsResult.data.map((announcement: any) => ({
          id: announcement.id,
          title: announcement.title || '',
          content: announcement.content || '',
          summary: announcement.summary || '',
          type: announcement.type || 'general',
          priority: announcement.priority || 'medium',
          category: announcement.category || '',
          authorId: announcement.authorId || '',
          targetAudience: announcement.targetAudience || ['all'],
          isPublished: announcement.isPublished || false,
          isPinned: announcement.isPinned || false,
          isArchived: announcement.isArchived || false,
          publishDate: announcement.publishDate ? new Date(announcement.publishDate) : new Date(),
          expiryDate: announcement.expiryDate ? new Date(announcement.expiryDate) : undefined,
          createdAt: announcement.createdAt ? new Date(announcement.createdAt) : new Date(),
          updatedAt: announcement.updatedAt ? new Date(announcement.updatedAt) : new Date(),
          attachments: announcement.attachments || [],
          tags: announcement.tags || [],
          readCount: announcement.readCount || 0,
          likeCount: announcement.likeCount || 0,
          commentCount: announcement.commentCount || 0
        })) as Announcement[];
        setAnnouncements(transformedAnnouncements);
      }

      // Load categories
      const categoriesResult = await firebaseService.getCollection('announcementCategories');
      if (categoriesResult?.success && categoriesResult.data) {
        const transformedCategories: AnnouncementCategory[] = categoriesResult.data.map((category: any) => ({
          id: category.id,
          name: category.name || '',
          description: category.description || '',
          color: category.color || '#9e9e9e',
          icon: category.icon || 'general',
          isActive: category.isActive !== undefined ? category.isActive : true
        }));
        setCategories(transformedCategories);
      } else {
        // Set default categories if none exist
        setCategories([
    { id: '1', name: 'General', description: 'General announcements', color: '#9e9e9e', icon: 'general', isActive: true },
    { id: '2', name: 'System', description: 'System-related announcements', color: '#2196f3', icon: 'info', isActive: true },
    { id: '3', name: 'Maintenance', description: 'Maintenance notifications', color: '#795548', icon: 'maintenance', isActive: true },
    { id: '4', name: 'Updates', description: 'System updates and changes', color: '#607d8b', icon: 'update', isActive: true },
    { id: '5', name: 'Urgent', description: 'Urgent announcements', color: '#9c27b0', icon: 'urgent', isActive: true }
        ]);
      }

      // Load users
      const usersResult = await firebaseService.getCollection('users');
      if (usersResult?.success && usersResult.data) {
        const transformedUsers: User[] = usersResult.data.map((user: any) => ({
          id: user.id,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || 'Unknown User',
          email: user.email || '',
          role: user.role || 'Employee',
          avatar: user.avatar || undefined
        }));
        setUsers(transformedUsers);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
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
      filtered = filtered.filter(announcement => announcement.publishDate >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(announcement => announcement.publishDate <= filters.dateRange.end!);
    }

    setFilteredAnnouncements(filtered);
    setPage(0);
  }, [announcements, filters]);

  const handleFilterChange = (field: keyof AnnouncementFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAnnouncement = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      type: 'general',
      priority: 'medium',
      category: '',
      targetAudience: ['all']
    });
    setIsDialogOpen(true);
  };

  const handleEditAnnouncement = (_announcement: Announcement) => {
    setSnackbar({
      open: true,
      message: 'Edit announcement functionality coming soon',
      severity: 'info'
    });
  };

  const handleViewAnnouncement = (_announcement: Announcement) => {
    setSnackbar({
      open: true,
      message: 'View announcement functionality coming soon',
      severity: 'info'
    });
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const result = await firebaseService.deleteDocument('announcements', announcementId);
      
      if (result?.success) {
    setSnackbar({
      open: true,
      message: 'Announcement deleted successfully',
      severity: 'success'
    });
        loadData(); // Reload data from Firebase
      } else {
        throw new Error(result?.error || 'Failed to delete announcement');
      }
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to delete announcement',
        severity: 'error'
      });
    }
  };

  const handleSaveAnnouncement = async () => {
    try {
      setProcessing(true);
      
      // Validate required fields
      if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      setSnackbar({
        open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
      });
        return;
      }

      // Create new announcement
      const newAnnouncementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        summary: formData.summary.trim() || formData.content.trim().substring(0, 100) + '...',
        type: formData.type,
        priority: formData.priority,
        category: formData.category,
        authorId: '1', // TODO: Get from auth context
        targetAudience: formData.targetAudience,
        isPublished: false,
        isPinned: false,
        isArchived: false,
        publishDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
        tags: [],
        readCount: 0,
        likeCount: 0,
        commentCount: 0
      };
      
      const result = await firebaseService.addDocument('announcements', newAnnouncementData);
      
      if (result?.success) {
      setSnackbar({
        open: true,
        message: 'Announcement created successfully',
        severity: 'success'
      });
        loadData(); // Reload data from Firebase
        setIsDialogOpen(false);
        setFormData({
          title: '',
          content: '',
          summary: '',
          type: 'general',
          priority: 'medium',
          category: '',
          targetAudience: ['all']
        });
      } else {
        throw new Error(result?.error || 'Failed to create announcement');
      }
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to create announcement',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      title: '',
      content: '',
      summary: '',
      type: 'general',
      priority: 'medium',
      category: '',
      targetAudience: ['all']
    });
  };



  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'general':
        return <AnnouncementIcon color="action" />;
      case 'urgent':
        return <AnnouncementIcon color="error" />;
      case 'maintenance':
        return <ScheduleIcon color="warning" />;
      case 'update':
        return <CheckCircleIcon color="info" />;
      default:
        return <AnnouncementIcon />;
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
    return user ? user.name : 'Unknown User';
  };

  const getPublishedCount = () => {
    return announcements.filter(announcement => announcement.isPublished).length;
  };

  const getDraftCount = () => {
    return announcements.filter(announcement => !announcement.isPublished).length;
  };

  const getPinnedCount = () => {
    return announcements.filter(announcement => announcement.isPinned).length;
  };

  const getTotalCount = () => {
    return announcements.length;
  };


  const paginatedAnnouncements = filteredAnnouncements.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
  return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        bgcolor: 'grey.50'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Loading Announcements...
        </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Fade in timeout={300}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Announcements
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Manage and publish company announcements and updates
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ArchiveIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: '600',
                  borderColor: 'grey.400',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'grey.600',
                    bgcolor: 'grey.50',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
          >
            Archive All
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
                onClick={loadData}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: '600',
                  borderColor: 'grey.400',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'grey.600',
                    bgcolor: 'grey.50',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAnnouncement}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
          >
            Create Announcement
          </Button>
            </Stack>
      </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

      {/* Statistics Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
            gap: 3, 
            mb: 4 
          }}>
            <Card sx={{ 
              p: 2.5, 
              bgcolor: 'white', 
              height: '100%', 
              minHeight: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.100',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                borderColor: 'primary.200'
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1.5
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        mb: 0.5
                      }}
                    >
              Total Announcements
            </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: '700', 
                        color: 'primary.main',
                        lineHeight: 1.1
                      }}
                    >
              {getTotalCount()}
            </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'primary.50',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AnnouncementIcon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
          </CardContent>
        </Card>

            <Card sx={{ 
              p: 2.5, 
              bgcolor: 'white', 
              height: '100%', 
              minHeight: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.100',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                borderColor: 'success.200'
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1.5
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        mb: 0.5
                      }}
                    >
              Published
            </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: '700', 
                        color: 'success.main',
                        lineHeight: 1.1
                      }}
                    >
              {getPublishedCount()}
            </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'success.50',
                    color: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CheckCircleIcon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
          </CardContent>
        </Card>

            <Card sx={{ 
              p: 2.5, 
              bgcolor: 'white', 
              height: '100%', 
              minHeight: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.100',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                borderColor: 'warning.200'
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1.5
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        mb: 0.5
                      }}
                    >
              Drafts
            </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: '700', 
                        color: 'warning.main',
                        lineHeight: 1.1
                      }}
                    >
              {getDraftCount()}
            </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'warning.50',
                    color: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ScheduleIcon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
          </CardContent>
        </Card>

            <Card sx={{ 
              p: 2.5, 
              bgcolor: 'white', 
              height: '100%', 
              minHeight: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.100',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                borderColor: 'info.200'
              }
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1.5
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        mb: 0.5
                      }}
                    >
              Pinned
            </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: '700', 
                        color: 'info.main',
                        lineHeight: 1.1
                      }}
                    >
              {getPinnedCount()}
            </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'info.50',
                    color: 'info.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ArchiveIcon sx={{ fontSize: 24 }} />
                  </Box>
                </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
          <Card sx={{ 
            bgcolor: 'white', 
            boxShadow: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                Filters & Search
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
                gap: 2, 
                alignItems: 'center' 
              }}>
          <TextField
                  placeholder="Search announcements..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
                  size="medium"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />
                
                <FormControl size="medium">
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) => handleFilterChange('type', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="update">Update</MenuItem>
            </Select>
          </FormControl>

                <FormControl size="medium">
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              label="Priority"
              onChange={(e) => handleFilterChange('priority', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>

                <FormControl size="medium">
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) => handleFilterChange('category', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

                <FormControl size="medium">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
              <MenuItem value="pinned">Pinned</MenuItem>
            </Select>
          </FormControl>
        </Box>
            </CardContent>
          </Card>

      {/* Announcements Table */}
          <Card sx={{ 
            bgcolor: 'white', 
            boxShadow: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Author</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Published</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAnnouncements.map((announcement) => (
                    <TableRow 
                      key={announcement.id} 
                      hover
                      sx={{ 
                        '&:hover': { bgcolor: 'primary.50' },
                        '&:nth-of-type(even)': { bgcolor: 'grey.25' }
                      }}
                    >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTypeIcon(announcement.type)}
                      <Chip
                        label={announcement.type}
                        size="small"
                        sx={{
                          bgcolor: getTypeColor(announcement.type),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {announcement.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 300 }}>
                        {announcement.summary}
                      </Typography>
                      {announcement.isPinned && (
                        <Chip
                          label="Pinned"
                          size="small"
                          variant="outlined"
                          color="warning"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={announcement.priority}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(announcement.priority),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {announcement.category}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body2">
                        {getUserName(announcement.authorId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {announcement.isPublished ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <ScheduleIcon color="warning" fontSize="small" />
                      )}
                      <Chip
                        label={announcement.isPublished ? 'Published' : 'Draft'}
                        size="small"
                        variant="outlined"
                        color={announcement.isPublished ? 'success' : 'warning'}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {announcement.publishDate.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {announcement.publishDate.toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewAnnouncement(announcement)}
                              sx={{ 
                                color: 'info.main',
                                '&:hover': { 
                                  bgcolor: 'info.50',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Announcement">
                        <IconButton
                          size="small"
                          onClick={() => handleEditAnnouncement(announcement)}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': { 
                                  bgcolor: 'primary.50',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Announcement">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                              sx={{ 
                                color: 'error.main',
                                '&:hover': { 
                                  bgcolor: 'error.50',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                        </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredAnnouncements.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: '1px solid',
                borderColor: 'grey.200',
                bgcolor: 'grey.50'
              }}
            />
          </Card>

          {/* Create Announcement Dialog */}
          <Dialog 
            open={isDialogOpen} 
            onClose={handleCloseDialog} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: 'grey.200'
              }
            }}
          >
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              Create New Announcement
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                gap: 3 
              }}>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    label="Title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    fullWidth
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
          />
        </Box>
                
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    label="Summary"
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Brief summary of the announcement (optional)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    label="Content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    multiline
                    rows={6}
                    fullWidth
                    required
                    placeholder="Detailed content of the announcement..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>
                
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Type"
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="success">Success</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="update">Update</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      label="Priority"
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      sx={{ borderRadius: 2 }}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Target Audience</InputLabel>
                    <Select
                      value={formData.targetAudience}
                      label="Target Audience"
                      multiple
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as string[] }))}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Users</MenuItem>
                      <MenuItem value="employees">Employees</MenuItem>
                      <MenuItem value="managers">Managers</MenuItem>
                      <MenuItem value="directors">Directors</MenuItem>
                      <MenuItem value="hr">HR Team</MenuItem>
                      <MenuItem value="it">IT Team</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={handleCloseDialog}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: 'grey.400',
                  color: 'text.secondary',
                  fontWeight: '600',
                  '&:hover': {
                    borderColor: 'grey.600',
                    bgcolor: 'grey.50',
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handleSaveAnnouncement}
                disabled={processing || !formData.title.trim() || !formData.content.trim() || !formData.category}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: '600',
                  bgcolor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease',
                  '&:disabled': {
                    bgcolor: 'grey.400',
                    boxShadow: 'none'
                  }
                }}
              >
                {processing ? <CircularProgress size={20} /> : 'Create Announcement'}
              </Button>
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
      </Fade>
    </Box>
  );
};

export default Announcements; 