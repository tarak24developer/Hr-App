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
  Badge
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
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useDataService } from '../hooks/useDataService';

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
  resolvedAt?: Date;
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
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
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
  const mockCategories: IncidentCategory[] = [
    { id: '1', name: 'Security Breach', description: 'Unauthorized access or security violations', color: '#f44336' },
    { id: '2', name: 'System Failure', description: 'Hardware or software system failures', color: '#ff9800' },
    { id: '3', name: 'Data Loss', description: 'Loss or corruption of important data', color: '#9c27b0' },
    { id: '4', name: 'Network Issue', description: 'Network connectivity or performance problems', color: '#2196f3' },
    { id: '5', name: 'User Error', description: 'Mistakes made by system users', color: '#4caf50' }
  ];

  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'IT Manager' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Security Analyst' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'System Admin' }
  ];

  const mockIncidents: Incident[] = [
    {
      id: '1',
      title: 'Unauthorized Access Attempt',
      description: 'Multiple failed login attempts detected from unknown IP address',
      category: 'Security Breach',
      severity: 'high',
      status: 'investigating',
      priority: 'high',
      reporterId: '1',
      assigneeId: '2',
      location: 'Main Office',
      reportedAt: new Date('2024-01-15T10:30:00'),
      updatedAt: new Date('2024-01-15T14:20:00'),
      attachments: ['security_log.pdf'],
      tags: ['security', 'login', 'investigation'],
      notes: [
        {
          id: '1',
          content: 'Initial investigation started. Checking firewall logs.',
          authorId: '2',
          createdAt: new Date('2024-01-15T11:00:00'),
          isInternal: true
        }
      ]
    },
    {
      id: '2',
      title: 'Server Room Temperature Alert',
      description: 'Temperature in server room exceeded safe limits',
      category: 'System Failure',
      severity: 'medium',
      status: 'resolved',
      priority: 'medium',
      reporterId: '3',
      assigneeId: '3',
      location: 'Server Room',
      reportedAt: new Date('2024-01-14T16:45:00'),
      updatedAt: new Date('2024-01-14T18:30:00'),
      resolvedAt: new Date('2024-01-14T18:30:00'),
      attachments: ['temp_log.csv'],
      tags: ['hardware', 'environment', 'resolved'],
      notes: [
        {
          id: '2',
          content: 'AC unit repaired and temperature normalized.',
          authorId: '3',
          createdAt: new Date('2024-01-14T18:30:00'),
          isInternal: false
        }
      ]
    }
  ];

  useEffect(() => {
    // Load mock data
    setCategories(mockCategories);
    setUsers(mockUsers);
    setIncidents(mockIncidents);
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
    setCurrentPage(1);
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
    setIsDialogOpen(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteIncident = (incidentId: string) => {
    setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
    setSnackbar({
      open: true,
      message: 'Incident deleted successfully',
      severity: 'success'
    });
  };

  const handleSaveIncident = (incidentData: Partial<Incident>) => {
    if (selectedIncident) {
      // Update existing incident
      setIncidents(prev => prev.map(inc =>
        inc.id === selectedIncident.id
          ? { ...inc, ...incidentData, updatedAt: new Date() }
          : inc
      ));
      setSnackbar({
        open: true,
        message: 'Incident updated successfully',
        severity: 'success'
      });
    } else {
      // Create new incident
      const newIncident: Incident = {
        id: Date.now().toString(),
        title: incidentData.title || '',
        description: incidentData.description || '',
        category: incidentData.category || '',
        severity: incidentData.severity || 'medium',
        status: 'open',
        priority: incidentData.priority || 'medium',
        reporterId: '1', // Current user ID
        location: incidentData.location || '',
        reportedAt: new Date(),
        updatedAt: new Date(),
        attachments: incidentData.attachments || [],
        tags: incidentData.tags || [],
        notes: []
      };
      setIncidents(prev => [newIncident, ...prev]);
      setSnackbar({
        open: true,
        message: 'Incident created successfully',
        severity: 'success'
      });
    }
    setIsDialogOpen(false);
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
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Incident Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateIncident}
          sx={{ bgcolor: 'primary.main' }}
        >
          Create Incident
        </Button>
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
              Total Incidents
            </Typography>
            <Typography variant="h4" component="div">
              {incidents.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Open Incidents
            </Typography>
            <Typography variant="h4" component="div" color="warning.main">
              {incidents.filter(incident => incident.status === 'open').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Critical Incidents
            </Typography>
            <Typography variant="h4" component="div" color="error.main">
              {incidents.filter(incident => incident.severity === 'critical').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Resolved Today
            </Typography>
            <Typography variant="h4" component="div" color="success.main">
              {incidents.filter(incident => 
                incident.status === 'resolved' && 
                incident.resolvedAt && 
                incident.resolvedAt.toDateString() === new Date().toDateString()
              ).length}
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
        </Box>
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
                <TableCell>Actions</TableCell>
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
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                          onClick={() => handleDeleteIncident(incident.id)}
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

export default IncidentManagement;
