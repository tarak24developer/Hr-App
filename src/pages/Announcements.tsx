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
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Fade
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
  CheckCircle as CheckCircleIcon,
  PushPin as PinIcon,
  Publish as PublishIcon,
  Create as DraftIcon
} from '@mui/icons-material';
import { announcementService } from '../services/announcementService';
import { Announcement, AnnouncementCategory, AnnouncementFormData, AnnouncementStats, User } from '../types';


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
  const [stats, setStats] = useState<AnnouncementStats | null>(null);
  const [filters, setFilters] = useState<AnnouncementFilters>(initialFilters);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isFormMode, setIsFormMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    summary: '',
    type: 'general',
    priority: 'medium',
    category: '',
    targetAudience: ['all'],
    isPublished: false,
    isPinned: false,
    publishDate: new Date().toISOString(),
    attachments: [],
    tags: []
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load data from Firebase
  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const result = await announcementService.getAnnouncements();
      if (result.success && result.data) {
        setAnnouncements(result.data);
      } else {
        console.error('Failed to load announcements:', result.error);
        setSnackbar({
          open: true,
          message: 'Failed to load announcements',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      setSnackbar({
        open: true,
        message: 'Error loading announcements',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const result = await announcementService.getCategories();
      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        console.error('Failed to load categories:', result.error);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const result = await announcementService.getAnnouncementStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.error('Failed to load stats:', result.error);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadAnnouncements(),
        loadCategories(),
        loadStats()
      ]);
    };
    loadData();
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
    setIsFormMode(true);
    setFormData({
      title: '',
      content: '',
      summary: '',
      type: 'general',
      priority: 'medium',
      category: '',
      targetAudience: ['all'],
      isPublished: false,
      isPinned: false,
      publishDate: new Date().toISOString(),
      attachments: [],
      tags: []
    });
    setIsDialogOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewMode(false);
    setIsFormMode(true);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      summary: announcement.summary,
      type: announcement.type,
      priority: announcement.priority,
      category: announcement.category,
      targetAudience: announcement.targetAudience,
      isPublished: announcement.isPublished,
      isPinned: announcement.isPinned,
      publishDate: announcement.publishDate,
      expiryDate: announcement.expiryDate,
      attachments: announcement.attachments,
      tags: announcement.tags
    });
    setIsDialogOpen(true);
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewMode(true);
    setIsFormMode(false);
    setIsDialogOpen(true);
    // Increment read count
    announcementService.incrementReadCount(announcement.id);
  };

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    
    try {
      setLoading(true);
      const result = await announcementService.permanentDeleteAnnouncement(announcementToDelete.id);
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Announcement deleted successfully',
          severity: 'success'
        });
        await Promise.all([loadAnnouncements(), loadStats()]);
      } else {
        throw new Error(result.error || 'Failed to delete announcement');
      }
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete announcement',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.title.trim()) {
      setSnackbar({
        open: true,
        message: 'Title is required',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      let result;
      
      if (selectedAnnouncement) {
        result = await announcementService.updateAnnouncement(selectedAnnouncement.id, formData);
      } else {
        result = await announcementService.createAnnouncement(formData);
      }

      if (result.success) {
        setSnackbar({
          open: true,
          message: `Announcement ${selectedAnnouncement ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
        await Promise.all([loadAnnouncements(), loadStats()]);
        handleCloseDialog();
      } else {
        throw new Error(result.error || 'Failed to save announcement');
      }
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save announcement',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsViewMode(false);
    setIsFormMode(false);
    setSelectedAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      summary: '',
      type: 'general',
      priority: 'medium',
      category: '',
      targetAudience: ['all'],
      isPublished: false,
      isPinned: false,
      publishDate: new Date().toISOString(),
      attachments: [],
      tags: []
    });
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      const result = await announcementService.togglePinAnnouncement(announcement.id, !announcement.isPinned);
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Announcement ${!announcement.isPinned ? 'pinned' : 'unpinned'} successfully`,
          severity: 'success'
        });
        await loadAnnouncements();
      } else {
        throw new Error(result.error || 'Failed to toggle pin status');
      }
    } catch (error: any) {
      console.error('Error toggling pin status:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to toggle pin status',
        severity: 'error'
      });
    }
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    try {
      const result = await announcementService.togglePublishAnnouncement(announcement.id, !announcement.isPublished);
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Announcement ${!announcement.isPublished ? 'published' : 'unpublished'} successfully`,
          severity: 'success'
        });
        await loadAnnouncements();
      } else {
        throw new Error(result.error || 'Failed to toggle publish status');
      }
    } catch (error: any) {
      console.error('Error toggling publish status:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to toggle publish status',
        severity: 'error'
      });
    }
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
    return stats?.published || 0;
  };

  const getDraftCount = () => {
    return stats?.drafts || 0;
  };

  const getPinnedCount = () => {
    return stats?.pinned || 0;
  };

  const getTotalCount = () => {
    return stats?.total || 0;
  };

  const getTodayCount = () => {
    return stats?.today || 0;
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Announcements
              </Typography>
              <Typography variant="h4" component="div">
                {loading ? <CircularProgress size={24} /> : getTotalCount()}
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
                Published
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {loading ? <CircularProgress size={24} /> : getPublishedCount()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Live announcements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Drafts
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {loading ? <CircularProgress size={24} /> : getDraftCount()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pending review
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
              <Typography variant="h4" component="div" color="primary.main">
                {loading ? <CircularProgress size={24} /> : getPinnedCount()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Important announcements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading announcements...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedAnnouncements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      No announcements found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAnnouncements.map((announcement) => (
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
                      {new Date(announcement.publishDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(announcement.publishDate).toLocaleTimeString()}
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
                      <Tooltip title={announcement.isPinned ? "Unpin" : "Pin"}>
                        <IconButton
                          size="small"
                          onClick={() => handleTogglePin(announcement)}
                          color={announcement.isPinned ? "warning" : "default"}
                        >
                          <PinIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={announcement.isPublished ? "Unpublish" : "Publish"}>
                        <IconButton
                          size="small"
                          onClick={() => handleTogglePublish(announcement)}
                          color={announcement.isPublished ? "success" : "default"}
                        >
                          {announcement.isPublished ? <PublishIcon /> : <DraftIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Announcement">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(announcement)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                ))
              )}
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

      {/* View/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle>
          {isViewMode ? 'View Announcement' : isFormMode ? (selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement') : 'Announcement Details'}
        </DialogTitle>
        <DialogContent>
          {isViewMode && selectedAnnouncement ? (
            <Box>
              <Typography variant="h5" gutterBottom>
                {selectedAnnouncement.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={selectedAnnouncement.type}
                  size="small"
                  sx={{
                    bgcolor: getTypeColor(selectedAnnouncement.type),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip
                  label={selectedAnnouncement.priority}
                  size="small"
                  sx={{
                    bgcolor: getPriorityColor(selectedAnnouncement.priority),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                {selectedAnnouncement.isPinned && (
                  <Chip label="Pinned" size="small" color="warning" />
                )}
              </Box>
              <Typography variant="body1" paragraph>
                {selectedAnnouncement.content}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Published: {new Date(selectedAnnouncement.publishDate).toLocaleString()}
              </Typography>
            </Box>
          ) : isFormMode ? (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Summary"
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    multiline
                    rows={4}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Type"
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="success">Success</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="update">Update</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      label="Priority"
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {categories.map(category => (
                        <MenuItem key={category.id} value={category.name}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isPublished}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                      />
                    }
                    label="Published"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isPinned}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                      />
                    }
                    label="Pinned"
                  />
                </Grid>
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {isFormMode && (
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? <CircularProgress size={20} /> : (selectedAnnouncement ? 'Update' : 'Create')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Announcement</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete "{announcementToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
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

export default Announcements; 