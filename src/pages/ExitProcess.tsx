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
  Grid,
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
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExitToApp as ExitIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowDown as ArrowDownIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface ExitProcess {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeDepartment: string;
  exitDate: Date;
  reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  checklist: ExitChecklistItem[];
  notes: string;
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
  lastUpdated: Date;
}

interface ExitChecklistItem {
  id: string;
  task: string;
  category: 'hr' | 'it' | 'finance' | 'operations' | 'security';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignedTo: string;
  dueDate: Date;
  completedAt?: Date;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  avatar?: string;
}

interface ExitProcessFilters {
  search: string;
  status: string;
  priority: string;
  department: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const initialFilters: ExitProcessFilters = {
  search: '',
  status: '',
  priority: '',
  department: '',
  dateRange: {
    start: null,
    end: null
  }
};

const statusColors = {
  pending: '#ff9800',
  in_progress: '#2196f3',
  completed: '#4caf50',
  cancelled: '#f44336'
};

const priorityColors = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  urgent: '#9c27b0'
};

const categoryColors = {
  hr: '#2196f3',
  it: '#4caf50',
  finance: '#ff9800',
  operations: '#9c27b0',
  security: '#f44336'
};

const ExitProcess: React.FC = () => {
  const [exitProcesses, setExitProcesses] = useState<ExitProcess[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<ExitProcess[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<ExitProcessFilters>(initialFilters);
  const [selectedProcess, setSelectedProcess] = useState<ExitProcess | null>(null);
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
  const mockEmployees: Employee[] = [
    { id: '1', name: 'John Doe', email: 'john.doe@company.com', department: 'Engineering', position: 'Software Engineer' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', department: 'Marketing', position: 'Marketing Manager' },
    { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', department: 'Sales', position: 'Sales Representative' }
  ];

  const mockExitProcesses: ExitProcess[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      employeeEmail: 'john.doe@company.com',
      employeeDepartment: 'Engineering',
      exitDate: new Date('2024-02-15'),
      reason: 'Career advancement opportunity',
      status: 'in_progress',
      priority: 'medium',
      checklist: [
        {
          id: '1',
          task: 'Return company laptop',
          category: 'it',
          status: 'completed',
          assignedTo: 'IT Manager',
          dueDate: new Date('2024-02-10'),
          completedAt: new Date('2024-02-08')
        },
        {
          id: '2',
          task: 'Exit interview',
          category: 'hr',
          status: 'in_progress',
          assignedTo: 'HR Manager',
          dueDate: new Date('2024-02-12')
        },
        {
          id: '3',
          task: 'Final paycheck processing',
          category: 'finance',
          status: 'pending',
          assignedTo: 'Payroll Manager',
          dueDate: new Date('2024-02-15')
        }
      ],
      notes: 'Employee has been cooperative throughout the process',
      initiatedBy: 'John Doe',
      initiatedAt: new Date('2024-01-20'),
      lastUpdated: new Date('2024-02-08')
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      employeeEmail: 'jane.smith@company.com',
      employeeDepartment: 'Marketing',
      exitDate: new Date('2024-02-20'),
      reason: 'Personal reasons',
      status: 'pending',
      priority: 'low',
      checklist: [
        {
          id: '4',
          task: 'Return access cards',
          category: 'security',
          status: 'pending',
          assignedTo: 'Security Manager',
          dueDate: new Date('2024-02-18')
        },
        {
          id: '5',
          task: 'Exit interview',
          category: 'hr',
          status: 'pending',
          assignedTo: 'HR Manager',
          dueDate: new Date('2024-02-19')
        }
      ],
      notes: 'Process initiated, awaiting employee response',
      initiatedBy: 'Jane Smith',
      initiatedAt: new Date('2024-02-01'),
      lastUpdated: new Date('2024-02-01')
    }
  ];

  useEffect(() => {
    // Load mock data
    setEmployees(mockEmployees);
    setExitProcesses(mockExitProcesses);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exitProcesses, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...exitProcesses];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(process =>
        process.employeeName.toLowerCase().includes(searchLower) ||
        process.employeeEmail.toLowerCase().includes(searchLower) ||
        process.employeeId.toLowerCase().includes(searchLower) ||
        process.reason.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(process => process.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(process => process.priority === filters.priority);
    }

    if (filters.department) {
      filtered = filtered.filter(process => process.employeeDepartment === filters.department);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(process => process.exitDate >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(process => process.exitDate <= filters.dateRange.end!);
    }

    setFilteredProcesses(filtered);
    setCurrentPage(1);
  }, [exitProcesses, filters]);

  const handleFilterChange = (field: keyof ExitProcessFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateProcess = () => {
    setSelectedProcess(null);
    setIsViewMode(false);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleEditProcess = (process: ExitProcess) => {
    setSelectedProcess(process);
    setIsViewMode(false);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleViewProcess = (process: ExitProcess) => {
    setSelectedProcess(process);
    setIsViewMode(true);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleDeleteProcess = (processId: string) => {
    setExitProcesses(prev => prev.filter(process => process.id !== processId));
    setSnackbar({
      open: true,
      message: 'Exit process deleted successfully',
      severity: 'success'
    });
  };

  const handleStartProcess = (processId: string) => {
    setExitProcesses(prev => prev.map(process =>
      process.id === processId
        ? { ...process, status: 'in_progress', lastUpdated: new Date() }
        : process
    ));
    setSnackbar({
      open: true,
      message: 'Exit process started successfully',
      severity: 'success'
    });
  };

  const handleCompleteProcess = (processId: string) => {
    setExitProcesses(prev => prev.map(process =>
      process.id === processId
        ? { ...process, status: 'completed', completedAt: new Date(), lastUpdated: new Date() }
        : process
    ));
    setSnackbar({
      open: true,
      message: 'Exit process completed successfully',
      severity: 'success'
    });
  };

  const handleSaveProcess = (processData: Partial<ExitProcess>) => {
    if (selectedProcess && !isCreateMode) {
      // Update existing process
      setExitProcesses(prev => prev.map(process =>
        process.id === selectedProcess.id
          ? { ...process, ...processData, lastUpdated: new Date() }
          : process
      ));
      setSnackbar({
        open: true,
        message: 'Exit process updated successfully',
        severity: 'success'
      });
    } else {
      // Create new process
      const newProcess: ExitProcess = {
        id: Date.now().toString(),
        employeeId: processData.employeeId || '',
        employeeName: processData.employeeName || '',
        employeeEmail: processData.employeeEmail || '',
        employeeDepartment: processData.employeeDepartment || '',
        exitDate: processData.exitDate || new Date(),
        reason: processData.reason || '',
        status: 'pending',
        priority: processData.priority || 'medium',
        checklist: processData.checklist || [],
        notes: processData.notes || '',
        initiatedBy: 'Current User',
        initiatedAt: new Date(),
        lastUpdated: new Date()
      };
      setExitProcesses(prev => [newProcess, ...prev]);
      setSnackbar({
        open: true,
        message: 'Exit process created successfully',
        severity: 'success'
      });
    }
    setIsDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <WarningIcon color="warning" />;
      case 'in_progress':
        return <AssignmentIcon color="primary" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'cancelled':
        return <StopIcon color="error" />;
      default:
        return <WarningIcon />;
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
        return <CheckCircleIcon color="success" />;
      default:
        return <WarningIcon />;
    }
  };

  const getChecklistProgress = (checklist: ExitChecklistItem[]) => {
    const totalItems = checklist.length;
    const completedItems = checklist.filter(item => item.status === 'completed').length;
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  const getDepartmentCount = (departmentName: string) => {
    return exitProcesses.filter(process => process.employeeDepartment === departmentName).length;
  };

  const getStatusCount = (statusName: string) => {
    return exitProcesses.filter(process => process.status === statusName).length;
  };

  const paginatedProcesses = filteredProcesses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProcesses.length / itemsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Exit Process Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProcess}
          sx={{ bgcolor: 'primary.main' }}
        >
          Initiate Exit Process
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Processes
              </Typography>
              <Typography variant="h4" component="div">
                {exitProcesses.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" component="div" color="primary.main">
                {getStatusCount('in_progress')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {getStatusCount('pending')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {getStatusCount('completed')}
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
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search Processes"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label="Department"
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                {Array.from(new Set(exitProcesses.map(process => process.employeeDepartment))).map(dept => (
                  <MenuItem key={dept} value={dept}>
                    {dept} ({getDepartmentCount(dept)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Exit Processes Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Exit Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProcesses.map((process) => (
                <TableRow key={process.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                        {process.employeeName.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {process.employeeName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {process.employeeId} • {process.employeeDepartment}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {process.exitDate.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {process.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(process.status)}
                      <Chip
                        label={process.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: statusColors[process.status],
                          color: 'white',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPriorityIcon(process.priority)}
                      <Chip
                        label={process.priority}
                        size="small"
                        sx={{
                          bgcolor: priorityColors[process.priority],
                          color: 'white',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: '100%', maxWidth: 100 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="textSecondary">
                          {Math.round(getChecklistProgress(process.checklist))}%
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {process.checklist.filter(item => item.status === 'completed').length}/
                          {process.checklist.length}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={getChecklistProgress(process.checklist)}
                        sx={{ height: 6, borderRadius: 1 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {process.lastUpdated.toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {process.lastUpdated.toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewProcess(process)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Process">
                        <IconButton
                          size="small"
                          onClick={() => handleEditProcess(process)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {process.status === 'pending' && (
                        <Tooltip title="Start Process">
                          <IconButton
                            size="small"
                            onClick={() => handleStartProcess(process.id)}
                            color="success"
                          >
                            <StartIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {process.status === 'in_progress' && (
                        <Tooltip title="Complete Process">
                          <IconButton
                            size="small"
                            onClick={() => handleCompleteProcess(process.id)}
                            color="success"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete Process">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteProcess(process.id)}
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

      {/* Process Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExitIcon />
            <Typography variant="h6">
              {isViewMode ? 'Exit Process Details' : isCreateMode ? 'Initiate Exit Process' : 'Edit Exit Process'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProcess && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Employee Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Employee Name"
                        secondary={selectedProcess.employeeName}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Department"
                        secondary={selectedProcess.employeeDepartment}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Exit Date"
                        secondary={selectedProcess.exitDate.toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Reason"
                        secondary={selectedProcess.reason}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Process Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={selectedProcess.status.replace('_', ' ')}
                            size="small"
                            sx={{
                              bgcolor: statusColors[selectedProcess.status],
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Priority"
                        secondary={
                          <Chip
                            label={selectedProcess.priority}
                            size="small"
                            sx={{
                              bgcolor: priorityColors[selectedProcess.priority],
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Initiated By"
                        secondary={selectedProcess.initiatedBy}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Initiated At"
                        secondary={selectedProcess.initiatedAt.toLocaleDateString()}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Exit Checklist</Typography>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">
                        Checklist Progress: {Math.round(getChecklistProgress(selectedProcess.checklist))}%
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {selectedProcess.checklist.map((item) => (
                          <ListItem key={item.id} divider>
                            <ListItemIcon>
                              <Checkbox
                                checked={item.status === 'completed'}
                                disabled
                                color="primary"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={item.task}
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    Category: {item.category.toUpperCase()}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Assigned to: {item.assignedTo}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Due: {item.dueDate.toLocaleDateString()}
                                  </Typography>
                                  {item.notes && (
                                    <Typography variant="caption" display="block">
                                      Notes: {item.notes}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <Chip
                              label={item.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                bgcolor: item.status === 'completed' ? '#4caf50' : 
                                         item.status === 'in_progress' ? '#ff9800' : '#9e9e9e',
                                color: 'white',
                                textTransform: 'capitalize'
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
                {selectedProcess.notes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Notes</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        {selectedProcess.notes}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
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

export default ExitProcess; 