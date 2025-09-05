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
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';

interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reporterId: string;
  assigneeId?: string;
  location: string;
  reportedAt: Date;
  updatedAt: Date;
  resolvedAt?: Date | undefined;
  attachments: string[];
  tags: string[];
  notes: IncidentNote[];
}

interface IncidentNote {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  isInternal: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface IncidentCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface IncidentFilters {
  search: string;
  category: string;
  severity: string;
  status: string;
  priority: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  assignedTo: string;
}

const initialFilters: IncidentFilters = {
  search: '',
  category: '',
  severity: '',
  status: '',
  priority: '',
  dateRange: {
    start: null,
    end: null
  },
  assignedTo: ''
};

const severityColors = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#9c27b0'
};

const statusColors = {
  open: '#f44336',
  investigating: '#ff9800',
  resolved: '#4caf50',
  closed: '#9e9e9e'
};

const priorityColors = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  urgent: '#9c27b0'
};

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [categories, setCategories] = useState<IncidentCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<IncidentFilters>(initialFilters);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    location: '',
    assigneeId: '',
    tags: [] as string[],
    attachments: [] as string[]
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
      
      // Load incidents
      const incidentsResult = await firebaseService.getCollection('incidents');
      if (incidentsResult?.success && incidentsResult.data) {
        const transformedIncidents: Incident[] = incidentsResult.data.map((incident: any) => ({
          id: incident.id,
          title: incident.title || '',
          description: incident.description || '',
          category: incident.category || '',
          severity: incident.severity || 'medium',
          status: incident.status || 'open',
          priority: incident.priority || 'medium',
          reporterId: incident.reporterId || '',
          assigneeId: incident.assigneeId || undefined,
          location: incident.location || '',
          reportedAt: incident.reportedAt ? new Date(incident.reportedAt) : new Date(),
          updatedAt: incident.updatedAt ? new Date(incident.updatedAt) : new Date(),
          resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : undefined as Date | undefined,
          attachments: incident.attachments || [],
          tags: incident.tags || [],
          notes: incident.notes || []
        }));
        setIncidents(transformedIncidents as Incident[]);
      }

      // Load categories
      const categoriesResult = await firebaseService.getCollection('incidentCategories');
      if (categoriesResult?.success && categoriesResult.data) {
        const transformedCategories: IncidentCategory[] = categoriesResult.data.map((category: any) => ({
          id: category.id,
          name: category.name || '',
          description: category.description || '',
          color: category.color || '#9e9e9e'
        }));
        setCategories(transformedCategories);
      } else {
        // Set default categories if none exist
        setCategories([
    { id: '1', name: 'Security Breach', description: 'Unauthorized access or security violations', color: '#f44336' },
    { id: '2', name: 'System Failure', description: 'Hardware or software system failures', color: '#ff9800' },
    { id: '3', name: 'Data Loss', description: 'Loss or corruption of important data', color: '#9c27b0' },
    { id: '4', name: 'Network Issue', description: 'Network connectivity or performance problems', color: '#2196f3' },
    { id: '5', name: 'User Error', description: 'Mistakes made by system users', color: '#4caf50' }
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
  }, [incidents, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...incidents];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(incident =>
        incident.title.toLowerCase().includes(searchLower) ||
        incident.description.toLowerCase().includes(searchLower) ||
        incident.location.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(incident => incident.category === filters.category);
    }

    if (filters.severity) {
      filtered = filtered.filter(incident => incident.severity === filters.severity);
    }

    if (filters.status) {
      filtered = filtered.filter(incident => incident.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(incident => incident.priority === filters.priority);
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(incident => incident.assigneeId === filters.assignedTo);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(incident => incident.reportedAt >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(incident => incident.reportedAt <= filters.dateRange.end!);
    }

    setFilteredIncidents(filtered);
    setPage(0);
  }, [incidents, filters]);

  const handleFilterChange = (field: keyof IncidentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateIncident = () => {
    setSelectedIncident(null);
    setIsViewMode(false);
    setIsEditMode(false);
    setFormData({
      title: '',
      description: '',
      category: '',
      severity: 'medium',
      priority: 'medium',
      location: '',
      assigneeId: '',
      tags: [],
      attachments: []
    });
    setIsDialogOpen(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsViewMode(false);
    setIsEditMode(true);
    setFormData({
      title: incident.title,
      description: incident.description,
      category: incident.category,
      severity: incident.severity,
      priority: incident.priority,
      location: incident.location,
      assigneeId: incident.assigneeId || '',
      tags: incident.tags,
      attachments: incident.attachments
    });
    setIsDialogOpen(true);
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsViewMode(true);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

    const handleDeleteIncident = async (incidentId: string) => {
    try {
      const result = await firebaseService.deleteDocument('incidents', incidentId);
      
      if (result?.success) {
    setSnackbar({
      open: true,
      message: 'Incident deleted successfully',
      severity: 'success'
    });
        loadData(); // Reload data from Firebase
      } else {
        throw new Error(result?.error || 'Failed to delete incident');
      }
    } catch (err: any) {
      console.error('Error deleting incident:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to delete incident',
        severity: 'error'
      });
    }
  };

  const handleSaveIncident = async () => {
    try {
      setProcessing(true);
      
      if (isEditMode && selectedIncident) {
      // Update existing incident
        const updateData = {
          ...formData,
          updatedAt: new Date().toISOString()
        };
        
        const result = await firebaseService.updateDocument('incidents', selectedIncident.id, updateData);
        
        if (result?.success) {
      setSnackbar({
        open: true,
        message: 'Incident updated successfully',
        severity: 'success'
      });
          loadData(); // Reload data from Firebase
          setIsDialogOpen(false);
        } else {
          throw new Error(result?.error || 'Failed to update incident');
        }
    } else {
      // Create new incident
        const newIncidentData = {
          ...formData,
        status: 'open',
          reporterId: '1', // TODO: Get from auth context
          reportedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: [],
          createdAt: new Date().toISOString()
        };
        
        const result = await firebaseService.addDocument('incidents', newIncidentData);
        
        if (result?.success) {
      setSnackbar({
        open: true,
        message: 'Incident created successfully',
        severity: 'success'
      });
          loadData(); // Reload data from Firebase
          setIsDialogOpen(false);
        } else {
          throw new Error(result?.error || 'Failed to create incident');
        }
      }
    } catch (err: any) {
      console.error('Error saving incident:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Failed to save incident',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedIncident(null);
    setIsViewMode(false);
    setIsEditMode(false);
  };

  

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

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category ? category.color : '#9e9e9e';
  };

  const paginatedIncidents = filteredIncidents.slice(
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
            Loading Incidents...
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
          Incident Management
        </Typography>
              <Typography variant="body1" color="textSecondary">
                Track and manage security incidents and system issues
              </Typography>
            </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateIncident}
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
          Create Incident
        </Button>
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
              Total Incidents
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
              {incidents.length}
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
                    <WarningIcon sx={{ fontSize: 24 }} />
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
              Open Incidents
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
              {incidents.filter(incident => incident.status === 'open').length}
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
              Critical Incidents
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
              {incidents.filter(incident => incident.severity === 'critical').length}
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
                    <WarningIcon sx={{ fontSize: 24 }} />
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
              Resolved Today
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
              {incidents.filter(incident => 
                incident.status === 'resolved' && 
                incident.resolvedAt && 
                incident.resolvedAt.toDateString() === new Date().toDateString()
              ).length}
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
                  placeholder="Search incidents..."
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
                    {categories.map((category) => (
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
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="investigating">Investigating</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="medium">
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity}
                    label="Severity"
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
                  >
                    <MenuItem value="">All Severities</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
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
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    value={filters.assignedTo}
                    label="Assigned To"
                    onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
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
            </CardContent>
          </Card>

      {/* Incidents Table */}
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
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Severity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Assignee</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Reported</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedIncidents.map((incident) => (
                <TableRow 
                  key={incident.id} 
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
                        bgcolor: severityColors[incident.severity],
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
                          bgcolor: statusColors[incident.status],
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
                        bgcolor: priorityColors[incident.priority],
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
                          {getUserName(incident.assigneeId)}
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
                      {incident.reportedAt.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {incident.reportedAt.toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewIncident(incident)}
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
                      <Tooltip title="Edit Incident">
                        <IconButton
                          size="small"
                          onClick={() => handleEditIncident(incident)}
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
                      <Tooltip title="Delete Incident">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteIncident(incident.id)}
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
              count={filteredIncidents.length}
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

          {/* Incident Dialog */}
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
              bgcolor: isViewMode ? 'info.main' : isEditMode ? 'warning.main' : 'primary.main', 
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              {isViewMode ? 'View Incident' : isEditMode ? 'Edit Incident' : 'Create New Incident'}
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
              {isViewMode && selectedIncident ? (
                // View Mode
                <Box>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                    gap: 3 
                  }}>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {selectedIncident.title}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {selectedIncident.description}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Category
                      </Typography>
                      <Chip
                        label={selectedIncident.category}
                        sx={{
                          bgcolor: getCategoryColor(selectedIncident.category),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Severity
                      </Typography>
                      <Chip
                        label={selectedIncident.severity}
                        sx={{
                          bgcolor: severityColors[selectedIncident.severity],
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Status
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(selectedIncident.status)}
                        <Chip
                          label={selectedIncident.status}
                          sx={{
                            bgcolor: statusColors[selectedIncident.status],
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Priority
                      </Typography>
                      <Chip
                        label={selectedIncident.priority}
                        sx={{
                          bgcolor: priorityColors[selectedIncident.priority],
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Location
                      </Typography>
                      <Typography variant="body1">
                        {selectedIncident.location}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Assigned To
                      </Typography>
                      <Typography variant="body1">
                        {selectedIncident.assigneeId ? getUserName(selectedIncident.assigneeId) : 'Unassigned'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Reported At
                      </Typography>
                      <Typography variant="body1">
                        {selectedIncident.reportedAt.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Last Updated
                      </Typography>
                      <Typography variant="body1">
                        {selectedIncident.updatedAt.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    {selectedIncident.tags.length > 0 && (
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Tags
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedIncident.tags.map((tag, index) => (
                            <Chip key={index} label={tag} size="small" />
                          ))}
                        </Box>
        </Box>
      )}
                  </Box>
                </Box>
              ) : (
                // Create/Edit Mode
                <Box>
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
                        disabled={isViewMode}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <TextField
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        multiline
                        rows={4}
                        fullWidth
                        required
                        disabled={isViewMode}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <FormControl fullWidth disabled={isViewMode}>
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
                      <FormControl fullWidth disabled={isViewMode}>
                        <InputLabel>Severity</InputLabel>
                        <Select
                          value={formData.severity}
                          label="Severity"
                          onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    
                    <Box>
                      <FormControl fullWidth disabled={isViewMode}>
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
                      <FormControl fullWidth disabled={isViewMode}>
                        <InputLabel>Assigned To</InputLabel>
                        <Select
                          value={formData.assigneeId}
                          label="Assigned To"
                          onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">Unassigned</MenuItem>
                          {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <TextField
                        label="Location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        fullWidth
                        disabled={isViewMode}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
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
                {isViewMode ? 'Close' : 'Cancel'}
              </Button>
              
              {!isViewMode && (
                <Button 
                  variant="contained" 
                  onClick={handleSaveIncident}
                  disabled={processing || !formData.title || !formData.description || !formData.category}
                  sx={{ 
                    px: 3, 
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: '600',
                    bgcolor: isEditMode ? 'warning.main' : 'primary.main',
                    boxShadow: `0 4px 12px rgba(${isEditMode ? '255, 152, 0' : '25, 118, 210'}, 0.3)`,
                    '&:hover': {
                      bgcolor: isEditMode ? 'warning.dark' : 'primary.dark',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px rgba(${isEditMode ? '255, 152, 0' : '25, 118, 210'}, 0.4)`
                    },
                    transition: 'all 0.3s ease',
                    '&:disabled': {
                      bgcolor: 'grey.400',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {processing ? <CircularProgress size={20} /> : (isEditMode ? 'Update' : 'Create')}
                </Button>
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
      </Fade>
    </Box>
  );
};

export default IncidentManagement;
