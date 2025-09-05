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
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'user' | 'work' | 'event' | 'assignment' | 'payment' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  readAt?: Date | undefined;
  expiresAt?: Date | undefined;
  metadata: Record<string, any>;
  actions?: NotificationAction[];
}

interface NotificationAction {
  id: string;
  label: string;
  action: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

interface NotificationFilters {
  search: string;
  type: string;
  priority: string;
  category: string;
  status: 'all' | 'read' | 'unread' | 'pinned';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const initialFilters: NotificationFilters = {
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

const priorityColors = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  urgent: '#9c27b0'
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<NotificationFilters>(initialFilters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error' | 'system' | 'user' | 'work' | 'event' | 'assignment' | 'payment' | 'security',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: '',
    recipientId: ''
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
      
      // Load notifications
      const notificationsResult = await firebaseService.getCollection('notifications');
      if (notificationsResult?.success && notificationsResult.data) {
        const transformedNotifications: Notification[] = notificationsResult.data.map((notification: any) => ({
          id: notification.id,
          title: notification.title || '',
          message: notification.message || '',
          type: notification.type || 'info',
          priority: notification.priority || 'medium',
          category: notification.category || '',
          senderId: notification.senderId || '',
          recipientId: notification.recipientId || '',
          isRead: notification.isRead || false,
          isPinned: notification.isPinned || false,
          isArchived: notification.isArchived || false,
          createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
          readAt: notification.readAt ? new Date(notification.readAt) : undefined,
          expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined,
          metadata: notification.metadata || {},
          actions: notification.actions || []
        }));
        setNotifications(transformedNotifications);
      }

      // Load categories
      const categoriesResult = await firebaseService.getCollection('notificationCategories');
      if (categoriesResult?.success && categoriesResult.data) {
        const transformedCategories: NotificationCategory[] = categoriesResult.data.map((category: any) => ({
          id: category.id,
          name: category.name || '',
          description: category.description || '',
          color: category.color || '#9e9e9e',
          icon: category.icon || 'info',
          isActive: category.isActive !== undefined ? category.isActive : true
        }));
        setCategories(transformedCategories);
      } else {
        // Set default categories if none exist
        setCategories([
    { id: '1', name: 'System', description: 'System notifications', color: '#9c27b0', icon: 'system', isActive: true },
    { id: '2', name: 'User', description: 'User-related notifications', color: '#607d8b', icon: 'user', isActive: true },
    { id: '3', name: 'Work', description: 'Work-related notifications', color: '#795548', icon: 'work', isActive: true },
    { id: '4', name: 'Event', description: 'Event notifications', color: '#e91e63', icon: 'event', isActive: true },
    { id: '5', name: 'Security', description: 'Security alerts', color: '#ff5722', icon: 'security', isActive: true }
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
  }, [notifications, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...notifications];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(notification => notification.type === filters.type);
    }

    if (filters.priority) {
      filtered = filtered.filter(notification => notification.priority === filters.priority);
    }

    if (filters.category) {
      filtered = filtered.filter(notification => notification.category === filters.category);
    }

    if (filters.status === 'read') {
      filtered = filtered.filter(notification => notification.isRead);
    } else if (filters.status === 'unread') {
      filtered = filtered.filter(notification => !notification.isRead);
    } else if (filters.status === 'pinned') {
      filtered = filtered.filter(notification => notification.isPinned);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(notification => notification.createdAt >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(notification => notification.createdAt <= filters.dateRange.end!);
    }

    setFilteredNotifications(filtered);
    setPage(0);
  }, [notifications, filters]);

  const handleFilterChange = (field: keyof NotificationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateNotification = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      category: '',
      recipientId: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditNotification = (_notification: Notification) => {
    setSnackbar({
      open: true,
      message: 'Edit notification functionality coming soon',
      severity: 'info'
    });
  };

  const handleViewNotification = (_notification: Notification) => {
    setSnackbar({
      open: true,
      message: 'View notification functionality coming soon',
      severity: 'info'
    });
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const result = await firebaseService.deleteDocument('notifications', notificationId);
      
      if (result?.success) {
    setSnackbar({
      open: true,
      message: 'Notification deleted successfully',
      severity: 'success'
    });
        loadData(); // Reload data from Firebase
      } else {
        throw new Error(result?.error || 'Failed to delete notification');
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to delete notification',
        severity: 'error'
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const updateData = {
        isRead: true,
        readAt: new Date().toISOString()
      };
      
      const result = await firebaseService.updateDocument('notifications', notificationId, updateData);
      
      if (result?.success) {
    setSnackbar({
      open: true,
      message: 'Notification marked as read',
      severity: 'success'
    });
        loadData(); // Reload data from Firebase
      } else {
        throw new Error(result?.error || 'Failed to mark notification as read');
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to mark notification as read',
        severity: 'error'
      });
    }
  };

  const handleSaveNotification = async () => {
    try {
      setProcessing(true);
      
      // Validate required fields
      if (!formData.title.trim() || !formData.message.trim() || !formData.category) {
      setSnackbar({
        open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
      });
        return;
      }

      // Create new notification
      const newNotificationData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        priority: formData.priority,
        category: formData.category,
        senderId: '1', // TODO: Get from auth context
        recipientId: formData.recipientId || '',
        isRead: false,
        isPinned: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        metadata: {},
        actions: []
      };
      
      const result = await firebaseService.addDocument('notifications', newNotificationData);
      
      if (result?.success) {
      setSnackbar({
        open: true,
        message: 'Notification created successfully',
        severity: 'success'
      });
        loadData(); // Reload data from Firebase
        setIsDialogOpen(false);
        setFormData({
          title: '',
          message: '',
          type: 'info',
          priority: 'medium',
          category: '',
          recipientId: ''
        });
      } else {
        throw new Error(result?.error || 'Failed to create notification');
      }
    } catch (err: any) {
      console.error('Error creating notification:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to create notification',
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
      message: '',
      type: 'info',
      priority: 'medium',
      category: '',
      recipientId: ''
    });
  };



  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'system':
        return <NotificationsIcon color="primary" />;
      case 'user':
        return <PersonIcon color="primary" />;
      case 'work':
        return <WorkIcon color="primary" />;
      case 'event':
        return <EventIcon color="primary" />;
      case 'assignment':
        return <AssignmentIcon color="primary" />;
      case 'payment':
        return <PaymentIcon color="primary" />;
      case 'security':
        return <SecurityIcon color="primary" />;
      default:
        return <NotificationsIcon />;
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

  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.isRead).length;
  };

  const getPinnedCount = () => {
    return notifications.filter(notification => notification.isPinned).length;
  };

  const getTotalCount = () => {
    return notifications.length;
  };

  const getTodayCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return notifications.filter(notification => 
      notification.createdAt >= today
    ).length;
  };

  const paginatedNotifications = filteredNotifications.slice(
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
            Loading Notifications...
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
                Notifications
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Manage and track all system notifications and alerts
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
            onClick={handleCreateNotification}
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
            Create Notification
          </Button>
            </Stack>
      </Box>

          <Box>
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
              Total Notifications
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
                    <NotificationsIcon sx={{ fontSize: 24 }} />
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
                borderColor: 'error.200'
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
              Unread
            </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: '700', 
                        color: 'error.main',
                        lineHeight: 1.1
                      }}
                    >
              {getUnreadCount()}
            </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: 'error.50',
                    color: 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <NotificationsActiveIcon sx={{ fontSize: 24 }} />
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
              Pinned
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
              {getPinnedCount()}
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
                    <ArchiveIcon sx={{ fontSize: 24 }} />
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
              Today
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
              {getTodayCount()}
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
                  placeholder="Search notifications..."
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
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="system">System</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="work">Work</MenuItem>
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="assignment">Assignment</MenuItem>
              <MenuItem value="payment">Payment</MenuItem>
              <MenuItem value="security">Security</MenuItem>
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
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="pinned">Pinned</MenuItem>
            </Select>
          </FormControl>
        </Box>
            </CardContent>
          </Card>

      {/* Notifications Table */}
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
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Sender</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Created</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedNotifications.map((notification) => (
                <TableRow 
                  key={notification.id} 
                  hover
                  sx={{ 
                    '&:hover': { 
                      bgcolor: 'primary.50' 
                    },
                    '&:nth-of-type(even)': {
                      bgcolor: 'grey.25'
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getNotificationIcon(notification.type)}
                      <Chip
                        label={notification.type}
                        size="small"
                        sx={{
                          bgcolor: getTypeColor(notification.type),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 300 }}>
                        {notification.message}
                      </Typography>
                      {notification.isPinned && (
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
                      label={notification.priority}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(notification.priority),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {notification.category}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body2">
                        {getUserName(notification.senderId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {notification.isRead ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <NotificationsActiveIcon color="error" fontSize="small" />
                      )}
                      <Chip
                        label={notification.isRead ? 'Read' : 'Unread'}
                        size="small"
                        variant="outlined"
                        color={notification.isRead ? 'success' : 'error'}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {notification.createdAt.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {notification.createdAt.toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewNotification(notification)}
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': { 
                              bgcolor: 'primary.50',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {!notification.isRead && (
                        <Tooltip title="Mark as Read">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsRead(notification.id)}
                            sx={{ 
                              color: 'success.main',
                              '&:hover': { 
                                bgcolor: 'success.50',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit Notification">
                        <IconButton
                          size="small"
                          onClick={() => handleEditNotification(notification)}
                          sx={{ 
                            color: 'info.main',
                            '&:hover': { 
                              bgcolor: 'info.50',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Notification">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNotification(notification.id)}
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
              count={filteredNotifications.length}
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

          {/* Create Notification Dialog */}
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
              Create New Notification
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
                    label="Message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    multiline
                    rows={4}
                    fullWidth
                    required
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
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="success">Success</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="system">System</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="work">Work</MenuItem>
                      <MenuItem value="event">Event</MenuItem>
                      <MenuItem value="assignment">Assignment</MenuItem>
                      <MenuItem value="payment">Payment</MenuItem>
                      <MenuItem value="security">Security</MenuItem>
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
                    <InputLabel>Recipient</InputLabel>
                    <Select
                      value={formData.recipientId}
                      label="Recipient"
                      onChange={(e) => setFormData(prev => ({ ...prev, recipientId: e.target.value }))}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">All Users</MenuItem>
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name}
                        </MenuItem>
                      ))}
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
                onClick={handleSaveNotification}
                disabled={processing || !formData.title.trim() || !formData.message.trim() || !formData.category}
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
                {processing ? <CircularProgress size={20} /> : 'Create Notification'}
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
        </Box>
      </Fade>
    </Box>
  );
};

export default Notifications; 