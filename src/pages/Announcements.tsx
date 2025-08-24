import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
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
  Announcement as AnnouncementIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

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
  expiryDate?: Date;
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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
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
  const mockCategories: AnnouncementCategory[] = [
    { id: '1', name: 'General', description: 'General announcements', color: '#9e9e9e', icon: 'general', isActive: true },
    { id: '2', name: 'System', description: 'System-related announcements', color: '#2196f3', icon: 'info', isActive: true },
    { id: '3', name: 'Maintenance', description: 'Maintenance notifications', color: '#795548', icon: 'maintenance', isActive: true },
    { id: '4', name: 'Updates', description: 'System updates and changes', color: '#607d8b', icon: 'update', isActive: true },
    { id: '5', name: 'Urgent', description: 'Urgent announcements', color: '#9c27b0', icon: 'urgent', isActive: true }
  ];

  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Manager' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Employee' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Director' }
  ];

  const mockAnnouncements: Announcement[] = [
    {
      id: '1',
      title: 'System Maintenance Scheduled',
      content: 'We will be performing scheduled system maintenance on Saturday, January 20th, 2024 from 2:00 AM to 6:00 AM EST. During this time, the system may be temporarily unavailable. We apologize for any inconvenience.',
      summary: 'Scheduled system maintenance on January 20th',
      type: 'maintenance',
      priority: 'high',
      category: 'Maintenance',
      authorId: '3',
      targetAudience: ['all'],
      isPublished: true,
      isPinned: true,
      isArchived: false,
      publishDate: new Date('2024-01-15T10:00:00'),
      expiryDate: new Date('2024-01-21T23:59:59'),
      createdAt: new Date('2024-01-15T09:00:00'),
      updatedAt: new Date('2024-01-15T09:00:00'),
      attachments: ['maintenance_schedule.pdf'],
      tags: ['maintenance', 'system', 'scheduled'],
      readCount: 45,
      likeCount: 12,
      commentCount: 3
    },
    {
      id: '2',
      title: 'New Feature Release',
      content: 'We are excited to announce the release of our new employee portal features! The updated interface includes improved navigation, enhanced reporting tools, and mobile optimization. Please take some time to explore the new features.',
      summary: 'New employee portal features released',
      type: 'update',
      priority: 'medium',
      category: 'Updates',
      authorId: '1',
      targetAudience: ['employees', 'managers'],
      isPublished: true,
      isPinned: false,
      isArchived: false,
      publishDate: new Date('2024-01-14T14:00:00'),
      createdAt: new Date('2024-01-14T13:00:00'),
      updatedAt: new Date('2024-01-14T13:00:00'),
      attachments: ['feature_guide.pdf', 'screenshots.zip'],
      tags: ['features', 'portal', 'release'],
      readCount: 89,
      likeCount: 34,
      commentCount: 8
    }
  ];

  useEffect(() => {
    // Load mock data
    setCategories(mockCategories);
    setUsers(mockUsers);
    setAnnouncements(mockAnnouncements);
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
    setIsDialogOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteAnnouncement = (announcementId: string) => {
    setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
    setSnackbar({
      open: true,
      message: 'Announcement deleted successfully',
      severity: 'success'
    });
  };

  const handleSaveAnnouncement = (announcementData: Partial<Announcement>) => {
    if (selectedAnnouncement) {
      // Update existing announcement
      setAnnouncements(prev => prev.map(ann =>
        ann.id === selectedAnnouncement.id
          ? { ...ann, ...announcementData, updatedAt: new Date() }
          : ann
      ));
      setSnackbar({
        open: true,
        message: 'Announcement updated successfully',
        severity: 'success'
      });
    } else {
      // Create new announcement
      const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        title: announcementData.title || '',
        content: announcementData.content || '',
        summary: announcementData.summary || '',
        type: announcementData.type || 'general',
        priority: announcementData.priority || 'medium',
        category: announcementData.category || '',
        authorId: '1', // Current user ID
        targetAudience: announcementData.targetAudience || ['all'],
        isPublished: false,
        isPinned: false,
        isArchived: false,
        publishDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: announcementData.attachments || [],
        tags: announcementData.tags || [],
        readCount: 0,
        likeCount: 0,
        commentCount: 0
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      setSnackbar({
        open: true,
        message: 'Announcement created successfully',
        severity: 'success'
      });
    }
    setIsDialogOpen(false);
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

  const getTodayCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return announcements.filter(announcement => 
      announcement.createdAt >= today
    ).length;
  };

  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Announcements
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
            onClick={handleCreateAnnouncement}
          >
            Create Announcement
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Announcements
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
              Published
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {getPublishedCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Live announcements
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Drafts
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {getDraftCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Pending review
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Pinned
            </Typography>
            <Typography variant="h4" component="div" color="primary.main">
              {getPinnedCount()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Important announcements
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
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="update">Update</MenuItem>
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
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
              <MenuItem value="pinned">Pinned</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Announcements Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Published</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAnnouncements.map((announcement) => (
                <TableRow key={announcement.id} hover>
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
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewAnnouncement(announcement)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Announcement">
                        <IconButton
                          size="small"
                          onClick={() => handleEditAnnouncement(announcement)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Announcement">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
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

export default Announcements; 