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
  Container,
  Stack,
  Grid,
  InputAdornment,
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
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import incidentService, { Incident, IncidentCategory, IncidentFormData, IncidentStats } from '../services/incidentService';
import { User } from '../types';

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<IncidentFormData>({
    title: '',
    description: '',
    category: '',
    severity: 'medium',
    priority: 'medium',
    assigneeId: '',
    location: '',
    tags: []
  });
  
  // Filter and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [incidentsResult, categoriesResult, statsResult] = await Promise.all([
        incidentService.getIncidents(),
        incidentService.getCategories(),
        incidentService.getIncidentStats()
      ]);

      if (incidentsResult.success && incidentsResult.data) {
        setIncidents(incidentsResult.data);
        setFilteredIncidents(incidentsResult.data);
      } else {
        setError('Failed to load incidents');
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...incidents];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(incident =>
        incident.title.toLowerCase().includes(searchLower) ||
        incident.description.toLowerCase().includes(searchLower) ||
        incident.location.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(incident => incident.status === statusFilter);
    }

    if (severityFilter) {
      filtered = filtered.filter(incident => incident.severity === severityFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(incident => incident.category === categoryFilter);
    }

    setFilteredIncidents(filtered);
    setCurrentPage(1);
  }, [incidents, searchTerm, statusFilter, severityFilter, categoryFilter]);

  // Pagination
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredIncidents.length / rowsPerPage);

  // Handlers
  const handleCreateIncident = () => {
    setSelectedIncident(null);
    setViewMode(false);
    setFormData({
      title: '',
      description: '',
      category: '',
      severity: 'medium',
      priority: 'medium',
      assigneeId: '',
      location: '',
      tags: []
    });
    setDialogOpen(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setViewMode(false);
    setFormData({
      title: incident.title,
      description: incident.description,
      category: incident.category,
      severity: incident.severity,
      priority: incident.priority,
      assigneeId: incident.assigneeId || '',
      location: incident.location,
      tags: incident.tags
    });
    setDialogOpen(true);
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setViewMode(true);
    setDialogOpen(true);
  };

  const handleDeleteClick = (incident: Incident) => {
    setIncidentToDelete(incident);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!incidentToDelete) return;

    try {
      const result = await incidentService.permanentDeleteIncident(incidentToDelete.id);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Incident "${incidentToDelete.title}" deleted successfully`,
          severity: 'success'
        });
        await loadData();
      } else {
        throw new Error(result.message || 'Failed to delete incident');
      }
    } catch (err) {
      console.error('Error deleting incident:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to delete incident',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setIncidentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setIncidentToDelete(null);
  };

  const handleSaveIncident = async () => {
    try {
      if (selectedIncident) {
        // Update existing incident
        const result = await incidentService.updateIncident(selectedIncident.id, formData);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Incident updated successfully',
            severity: 'success'
          });
          await loadData();
        } else {
          throw new Error(result.message || 'Failed to update incident');
        }
      } else {
        // Create new incident
        const result = await incidentService.createIncident(formData);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Incident created successfully',
            severity: 'success'
          });
          await loadData();
        } else {
          throw new Error(result.message || 'Failed to create incident');
        }
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Error saving incident:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to save incident',
        severity: 'error'
      });
    }
  };

  const handleFormChange = (field: keyof IncidentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <WarningIcon color="error" />;
      case 'investigating':
        return <ScheduleIcon color="warning" />;
      case 'resolved':
        return <CheckCircleIcon color="success" />;
      case 'closed':
        return <CheckCircleIcon color="action" />;
      default:
        return <WarningIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'critical': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#f44336';
      case 'investigating': return '#ff9800';
      case 'resolved': return '#4caf50';
      case 'closed': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'urgent': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category ? category.color : '#9e9e9e';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Incident Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateIncident}
          sx={{ borderRadius: 2 }}
        >
          Create Incident
        </Button>
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
                  Total Incidents
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Open Incidents
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {stats.open}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Critical Incidents
                </Typography>
                <Typography variant="h4" component="div" color="error.main">
                  {stats.critical}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Resolved Today
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {stats.resolvedToday}
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
              placeholder="Search incidents..."
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
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="investigating">Investigating</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                label="Severity"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
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
                <MenuItem value="">All</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setSeverityFilter('');
                setCategoryFilter('');
              }}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Incidents Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Reported</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedIncidents.map((incident) => (
                <TableRow key={incident.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {incident.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 200 }}>
                        {incident.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.category}
                      size="small"
                      sx={{
                        bgcolor: getCategoryColor(incident.category),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.severity}
                      size="small"
                      sx={{
                        bgcolor: getSeverityColor(incident.severity),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(incident.status)}
                      <Chip
                        label={incident.status}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(incident.status),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.priority}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(incident.priority),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {incident.assigneeId ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <PersonIcon />
                        </Avatar>
                        <Typography variant="body2">
                          User {incident.assigneeId}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {incident.location}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(incident.reportedAt)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDateTime(incident.reportedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewIncident(incident)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Incident">
                        <IconButton
                          size="small"
                          onClick={() => handleEditIncident(incident)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Incident">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(incident)}
                          color="error"
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewMode ? 'View Incident' : selectedIncident ? 'Edit Incident' : 'Create Incident'}
        </DialogTitle>
        <DialogContent>
          {viewMode ? (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedIncident?.title}</Typography>
              <Typography variant="body1" paragraph>{selectedIncident?.description}</Typography>
                          <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Category: {selectedIncident?.category}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Severity: {selectedIncident?.severity}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Status: {selectedIncident?.status}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Priority: {selectedIncident?.priority}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Location: {selectedIncident?.location}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Reported: {selectedIncident?.reportedAt}</Typography>
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
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  multiline
                  rows={3}
                  required
                />
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
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={formData.severity}
                    onChange={(e) => handleFormChange('severity', e.target.value)}
                    label="Severity"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
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
                <FormControl fullWidth>
                  <InputLabel>Assignee</InputLabel>
                  <Select
                    value={formData.assigneeId}
                    onChange={(e) => handleFormChange('assigneeId', e.target.value)}
                    label="Assignee"
                  >
                    <MenuItem value="">Unassigned</MenuItem>
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
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  required
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {viewMode ? 'Close' : 'Cancel'}
          </Button>
          {!viewMode && (
            <Button
              variant="contained"
              onClick={handleSaveIncident}
              disabled={!formData.title || !formData.description || !formData.category}
            >
              {selectedIncident ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Incident</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{incidentToDelete?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
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
    </Container>
  );
};

export default IncidentManagement;