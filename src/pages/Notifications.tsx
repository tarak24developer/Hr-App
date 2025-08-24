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
  ListItemAvatar
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
  Warning as WarningIcon
} from '@mui/icons-material';

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
  readAt?: Date;
  expiresAt?: Date;
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
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
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
  const mockCategories: NotificationCategory[] = [
    { id: '1', name: 'System', description: 'System notifications', color: '#9c27b0', icon: 'system', isActive: true },
    { id: '2', name: 'User', description: 'User-related notifications', color: '#607d8b', icon: 'user', isActive: true },
    { id: '3', name: 'Work', description: 'Work-related notifications', color: '#795548', icon: 'work', isActive: true },
    { id: '4', name: 'Event', description: 'Event notifications', color: '#e91e63', icon: 'event', isActive: true },
    { id: '5', name: 'Security', description: 'Security alerts', color: '#ff5722', icon: 'security', isActive: true }
  ];

  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Manager' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Employee' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Director' }
  ];

  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'System Maintenance',
      message: 'Scheduled system maintenance will begin in 30 minutes. Please save your work.',
      type: 'system',
      priority: 'high',
      category: 'System',
      senderId: '3',
      recipientId: '1',
      isRead: false,
      isPinned: true,
      isArchived: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours from now
      metadata: { maintenanceType: 'routine', duration: '2 hours' },
      actions: [
        { id: '1', label: 'Acknowledge', action: 'acknowledge' },
        { id: '2', label: 'View Details', action: 'view', url: '/maintenance' }
      ]
    },
    {
      id: '2',
      title: 'New Assignment',
      message: 'You have been assigned to the Q4 Project Review task.',
      type: 'assignment',
      priority: 'medium',
      category: 'Work',
      senderId: '3',
      recipientId: '2',
      isRead: true,
      isPinned: false,
      isArchived: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      readAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      metadata: { projectId: 'Q4-2024', dueDate: '2024-12-31' },
      actions: [
        { id: '3', label: 'View Task', action: 'view', url: '/tasks/Q4-2024' },
        { id: '4', label: 'Accept', action: 'accept' }
      ]
    }
  ];

  useEffect(() => {
    // Load mock data
    setCategories(mockCategories);
    setUsers(mockUsers);
    setNotifications(mockNotifications);
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
    setCurrentPage(1);
  }, [notifications, filters]);

  const handleFilterChange = (field: keyof NotificationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateNotification = () => {
    setSelectedNotification(null);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleEditNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setSnackbar({
      open: true,
      message: 'Notification deleted successfully',
      severity: 'success'
    });
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(notif =>
      notif.id === notificationId
        ? { ...notif, isRead: true, readAt: new Date() }
        : notif
    ));
    setSnackbar({
      open: true,
      message: 'Notification marked as read',
      severity: 'success'
    });
  };

  const handleSaveNotification = (notificationData: Partial<Notification>) => {
    if (selectedNotification) {
      // Update existing notification
      setNotifications(prev => prev.map(notif =>
        notif.id === selectedNotification.id
          ? { ...notif, ...notificationData }
          : notif
      ));
      setSnackbar({
        open: true,
        message: 'Notification updated successfully',
        severity: 'success'
      });
    } else {
      // Create new notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        title: notificationData.title || '',
        message: notificationData.message || '',
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'medium',
        category: notificationData.category || '',
        senderId: '1', // Current user ID
        recipientId: notificationData.recipientId || '',
        isRead: false,
        isPinned: false,
        isArchived: false,
        createdAt: new Date(),
        metadata: notificationData.metadata || {},
        actions: notificationData.actions || []
      };
      setNotifications(prev => [newNotification, ...prev]);
      setSnackbar({
        open: true,
        message: 'Notification created successfully',
        severity: 'success'
      });
    }
    setIsDialogOpen(false);
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
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArchiveIcon />}
            sx={{ mr: 1 }}
          >
            Archive All
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
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

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Notifications
            </Typography>
            <Typography variant="h4" component="div">
              {getTotalCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              All time
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Unread
            </Typography>
            <Typography variant="h4" component="div" color="error">
              {getUnreadCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Require attention
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Pinned
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {getPinnedCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Important notifications
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Today
            </Typography>
            <Typography variant="h4" component="div" color="primary.main">
              {getTodayCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              New today
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
          <TextField
            fullWidth
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) => handleFilterChange('type', e.target.value)}
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
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              label="Priority"
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
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
              {categories.map(category => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="pinned">Pinned</MenuItem>
            </Select>
          </FormControl>
        </Box>
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
                <TableCell>Sender</TableCell>
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
                          onClick={() => handleDeleteNotification(notification.id)}
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