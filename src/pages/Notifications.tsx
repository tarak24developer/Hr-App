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
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Grid,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PushPin as PushPinIcon
} from '@mui/icons-material';
import notificationService from '../services/notificationService';
import { Notification, NotificationCategory, NotificationFormData, NotificationStats, User } from '../types';

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
  
  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

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

  const handleFilterChange = (field: string, value: any) => {
    switch (field) {
      case 'search':
        setSearchTerm(value);
        break;
      case 'type':
        setTypeFilter(value);
        break;
      case 'priority':
        setPriorityFilter(value);
        break;
      case 'category':
        setCategoryFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
    }
  };

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
    setSnackbar({
      open: true,
      message: 'Notification deleted successfully',
      severity: 'success'
    });
        await loadData();
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to delete notification',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting notification',
        severity: 'error'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setNotificationToDelete(null);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
    setSnackbar({
      open: true,
      message: 'Notification marked as read',
      severity: 'success'
    });
        await loadData();
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to mark notification as read',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setSnackbar({
        open: true,
        message: 'Error marking notification as read',
        severity: 'error'
      });
    }
  };

  const handleTogglePin = async (notificationId: string, isPinned: boolean) => {
    try {
      const result = await notificationService.togglePin(notificationId, !isPinned);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: isPinned ? 'Notification unpinned' : 'Notification pinned',
          severity: 'success'
        });
        await loadData();
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to toggle pin status',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      setSnackbar({
        open: true,
        message: 'Error toggling pin status',
        severity: 'error'
      });
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
      setSnackbar({
        open: true,
          message: selectedNotification ? 'Notification updated successfully' : 'Notification created successfully',
        severity: 'success'
      });
        setIsDialogOpen(false);
        await loadData();
    } else {
        setSnackbar({
          open: true,
          message: selectedNotification ? 'Failed to update notification' : 'Failed to create notification',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      setSnackbar({
        open: true,
        message: 'Error saving notification',
        severity: 'error'
      });
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleArchiveAll = async () => {
    try {
      const result = await notificationService.archiveAll();
      
      if (result.success) {
      setSnackbar({
        open: true,
          message: 'All notifications archived',
        severity: 'success'
      });
        await loadData();
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to archive notifications',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error archiving notifications:', error);
      setSnackbar({
        open: true,
        message: 'Error archiving notifications',
        severity: 'error'
      });
    }
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

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>Loading notifications...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArchiveIcon />}
            onClick={handleArchiveAll}
            sx={{ mr: 1 }}
          >
            Archive All
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNotification}
          >
            Create Notification
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Notifications
            </Typography>
            <Typography variant="h4" component="div">
                  {stats.total}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              All time
            </Typography>
          </CardContent>
        </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Unread
            </Typography>
            <Typography variant="h4" component="div" color="error">
                  {stats.unread}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Require attention
            </Typography>
          </CardContent>
        </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Pinned
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
                  {stats.pinned}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Important notifications
            </Typography>
          </CardContent>
        </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Today
            </Typography>
            <Typography variant="h4" component="div" color="primary.main">
                  {stats.today}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              New today
            </Typography>
          </CardContent>
        </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              label="Type"
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
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              label="Priority"
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="pinned">Pinned</MenuItem>
            </Select>
          </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Notifications Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedNotifications.map((notification) => (
                <TableRow key={notification.id} hover>
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
                        {getUserName(notification.recipientId)}
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
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewNotification(notification)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {!notification.isRead && (
                        <Tooltip title="Mark as Read">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsRead(notification.id)}
                            color="success"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={notification.isPinned ? "Unpin" : "Pin"}>
                        <IconButton
                          size="small"
                          onClick={() => handleTogglePin(notification.id, notification.isPinned)}
                          color={notification.isPinned ? "warning" : "default"}
                        >
                          <PushPinIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Notification">
                        <IconButton
                          size="small"
                          onClick={() => handleEditNotification(notification)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Notification">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNotification(notification)}
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

      {/* Create/Edit/View Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }
        }}
      >
        <DialogTitle>
          {isViewMode ? 'View Notification' : selectedNotification ? 'Edit Notification' : 'Create Notification'}
        </DialogTitle>
        <DialogContent>
          {isViewMode ? (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedNotification?.title}</Typography>
              <Typography variant="body1" paragraph>{selectedNotification?.message}</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Type: {selectedNotification?.type}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Priority: {selectedNotification?.priority}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Category: {selectedNotification?.category}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Recipient: {getUserName(selectedNotification?.recipientId || '')}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Status: {selectedNotification?.isRead ? 'Read' : 'Unread'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Created: {selectedNotification?.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : ''}</Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Message"
                  value={formData.message}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    label="Type"
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
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value)}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.name}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Recipient</InputLabel>
                  <Select
                    value={formData.recipientId}
                    onChange={(e) => handleFormChange('recipientId', e.target.value)}
                    label="Recipient"
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Expires At (Optional)"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => handleFormChange('expiresAt', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button onClick={handleFormSubmit} variant="contained">
              {selectedNotification ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }
        }}
      >
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this notification? This action cannot be undone.
          </Typography>
          {notificationToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {notificationToDelete.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {notificationToDelete.message}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete Permanently
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
  );
};

export default Notifications; 