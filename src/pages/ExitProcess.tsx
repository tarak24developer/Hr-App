import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  ExitToApp as ExitIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';
import type { User } from '../types';

interface ExitChecklistItem {
  id: string;
  task: string;
  category: 'hr' | 'it' | 'finance' | 'operations' | 'security';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  assignedTo: string;
  dueDate: Date;
  notes?: string;
  completedAt?: Date;
}

interface ExitProcessData {
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
  notes?: string;
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
  lastUpdated: Date;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
}

const ExitProcess: React.FC = () => {
  console.log('ExitProcess component rendering');
  
  const [exitProcesses, setExitProcesses] = useState<ExitProcessData[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<ExitProcessData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ExitProcessData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [filters] = useState({
    status: '',
    priority: '',
    department: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    processId: string | null;
    processName: string;
  }>({
    open: false,
    processId: null,
    processName: ''
  });

  // Form state for creating/editing processes
  const [formData, setFormData] = useState<Partial<ExitProcessData>>({
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    employeeDepartment: '',
    exitDate: new Date(),
    reason: '',
    priority: 'medium',
    notes: '',
    checklist: []
  });

  // Reset form data when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen && isCreateMode) {
      setFormData({
        employeeId: '',
        employeeName: '',
        employeeEmail: '',
        employeeDepartment: '',
        exitDate: new Date(),
        reason: '',
        priority: 'medium',
        notes: '',
        checklist: []
      });
    } else if (isDialogOpen && selectedProcess && !isCreateMode) {
      setFormData({
        employeeId: selectedProcess.employeeId,
        employeeName: selectedProcess.employeeName,
        employeeEmail: selectedProcess.employeeEmail,
        employeeDepartment: selectedProcess.employeeDepartment,
        exitDate: selectedProcess.exitDate,
        reason: selectedProcess.reason,
        priority: selectedProcess.priority,
        notes: selectedProcess.notes || '',
        checklist: selectedProcess.checklist
      });
    }
  }, [isDialogOpen, isCreateMode, selectedProcess]);

  useEffect(() => {
    console.log('ExitProcess useEffect - loading data');
    // Load data from Firebase
    loadExitProcesses();
    loadEmployees();
  }, []);

  useEffect(() => {
    console.log('ExitProcess useEffect - applying filters');
    applyFilters();
  }, [exitProcesses, filters]);

  const loadExitProcesses = async () => {
    setLoading(true);
    try {
      // Fetch exit processes from Firebase
      const response = await firebaseService.getCollection('exitProcesses');
      console.log('Raw Firebase response:', response);
      if (response.success && response.data) {
        // Transform Firebase data to ExitProcess format
        const processes: ExitProcessData[] = response.data.map((doc: any) => {
          // Helper function to safely convert dates
          const safeDate = (dateValue: any): Date => {
            if (!dateValue) return new Date();
            try {
              const date = new Date(dateValue);
              return isNaN(date.getTime()) ? new Date() : date;
            } catch {
              return new Date();
            }
          };

          // Ensure we get the correct Firebase document ID
          const documentId = doc.id || doc['id'] || doc.docId || doc.documentId;
          console.log('Processing document:', { 
            originalId: doc.id, 
            fallbackId: doc['id'], 
            finalId: documentId,
            docData: doc 
          });
          
          return {
            id: documentId, // Use Firebase document ID
            employeeId: doc.employeeId || '',
            employeeName: doc.employeeName || '',
            employeeEmail: doc.employeeEmail || '',
            employeeDepartment: doc.employeeDepartment || '',
            exitDate: safeDate(doc.exitDate),
            reason: doc.reason || '',
            status: doc.status || 'pending',
            priority: doc.priority || 'medium',
            checklist: (doc.checklist || []).map((item: any) => ({
              ...item,
              dueDate: safeDate(item.dueDate),
              completedAt: item.completedAt ? safeDate(item.completedAt) : undefined
            })),
            notes: doc.notes || '',
            initiatedBy: doc.initiatedBy || '',
            initiatedAt: safeDate(doc.initiatedAt),
            completedAt: doc.completedAt ? safeDate(doc.completedAt) : new Date(),
            lastUpdated: safeDate(doc.lastUpdated)
          };
        });
        console.log('Loaded exit processes from Firebase:', processes.map(p => ({ id: p.id, employeeName: p.employeeName })));
        setExitProcesses(processes);
      } else {
        console.error('Error loading exit processes:', response.error);
        setSnackbar({
          open: true,
          message: 'Error loading exit processes',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading exit processes:', error);
      setSnackbar({
        open: true,
        message: 'Error loading exit processes',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      // Fetch employees from Firebase users collection
      const response = await firebaseService.getCollection<User>('users');
      if (response.success && response.data) {
        const employeeList: Employee[] = response.data.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          department: user.department || '',
          position: user.position || ''
        }));
        setEmployees(employeeList);
      } else {
        console.error('Error loading employees:', response.error);
        setSnackbar({
          open: true,
          message: 'Error loading employees',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      setSnackbar({
        open: true,
        message: 'Error loading employees',
        severity: 'error'
      });
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...exitProcesses];

    if (filters.status) {
      filtered = filtered.filter(process => process.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(process => process.priority === filters.priority);
    }

    if (filters.department) {
      filtered = filtered.filter(process => process.employeeDepartment === filters.department);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(process =>
        process.employeeName.toLowerCase().includes(searchLower) ||
        process.employeeEmail.toLowerCase().includes(searchLower) ||
        process.reason.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProcesses(filtered);
    setCurrentPage(1);
  }, [exitProcesses, filters]);

  const handleCreateProcess = () => {
    console.log('handleCreateProcess called');
    setSelectedProcess(null);
    setIsViewMode(false);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleEditProcess = (process: ExitProcessData) => {
    console.log('handleEditProcess called with:', process);
    setSelectedProcess(process);
    setIsViewMode(false);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleViewProcess = (process: ExitProcessData) => {
    console.log('handleViewProcess called with:', process);
    setSelectedProcess(process);
    setIsViewMode(true);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleDeleteProcess = async (processId: string) => {
    console.log('handleDeleteProcess called with ID:', processId);
    console.log('Process to delete:', exitProcesses.find(p => p.id === processId));
    console.log('All processes before delete:', exitProcesses.map(p => ({ id: p.id, employeeName: p.employeeName })));
    
    try {
      // First, let's check if the document actually exists in Firebase
      console.log('Attempting to delete document with ID:', processId);
      console.log('Document ID type:', typeof processId);
      console.log('Document ID length:', processId.length);
      
      // Delete from Firebase
      const response = await firebaseService.deleteDocument('exitProcesses', processId);
      console.log('Firebase delete response:', response);
      
      if (response.success) {
        // Update local state
        setExitProcesses(prev => {
          const filtered = prev.filter(process => process.id !== processId);
          console.log('Processes after local state update:', filtered.map(p => ({ id: p.id, employeeName: p.employeeName })));
          return filtered;
        });
        setSnackbar({
          open: true,
          message: 'Exit process deleted successfully',
          severity: 'success'
        });
      } else {
        throw new Error(response.error || 'Failed to delete exit process');
      }
    } catch (error) {
      console.error('Error deleting exit process:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting exit process: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
      // Don't update local state if Firebase delete failed
    }
  };

  const handleStartProcess = async (processId: string) => {
    console.log('Starting process with ID:', processId);
    console.log('Available processes:', exitProcesses.map(p => ({ id: p.id, employeeName: p.employeeName })));
    console.log('Process to start:', exitProcesses.find(p => p.id === processId));
    
    try {
      // Update status in Firebase
      const response = await firebaseService.updateDocument('exitProcesses', processId, {
        status: 'in_progress',
        lastUpdated: new Date()
      });
      
      if (response.success) {
        // Update local state
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
      } else {
        throw new Error(response.error || 'Failed to start exit process');
      }
    } catch (error) {
      console.error('Error starting exit process:', error);
      setSnackbar({
        open: true,
        message: 'Error starting exit process: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    }
  };

  const handleCompleteProcess = async (processId: string) => {
    try {
      // Update status in Firebase
      const response = await firebaseService.updateDocument('exitProcesses', processId, {
        status: 'completed',
        completedAt: new Date(),
        lastUpdated: new Date()
      });
      
      if (response.success) {
        // Update local state
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
      } else {
        throw new Error(response.error || 'Failed to complete exit process');
      }
    } catch (error) {
      console.error('Error completing exit process:', error);
      setSnackbar({
        open: true,
        message: 'Error completing exit process: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    }
  };

  // (Temporary cleanup utilities removed)

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


  const getStatusCount = (statusName: string) => {
    return exitProcesses.filter(process => process.status === statusName).length;
  };

  const paginatedProcesses = filteredProcesses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          sx={{ bgcolor: 'primary.main', mr: 2 }}
        >
          Initiate Exit Process
        </Button>
        

      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            {exitProcesses.length}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Processes
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main">
            {getStatusCount('pending')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Pending
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="info.main">
            {getStatusCount('in_progress')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            In Progress
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">
            {getStatusCount('completed')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Completed
          </Typography>
        </Paper>
      </Box>

      {/* Main Table */}
      <TableContainer component={Paper}>
        <Table>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <Typography variant="h6" color="textSecondary">
                      Loading exit processes...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : paginatedProcesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <ExitIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No Exit Processes Found
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {exitProcesses.length === 0 
                          ? 'No exit processes have been created yet. Click "Initiate Exit Process" to get started.'
                          : 'No processes match the current filters. Try adjusting your search criteria.'
                        }
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProcesses.map((process) => (
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
                        {process.exitDate instanceof Date ? process.exitDate.toLocaleDateString() : new Date(process.exitDate).toLocaleDateString()}
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
                          bgcolor: process.status === 'pending' ? '#ff9800' : 
                                   process.status === 'in_progress' ? '#2196f3' : 
                                   process.status === 'completed' ? '#4caf50' : '#f44336',
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
                          bgcolor: process.priority === 'urgent' ? '#f44336' : 
                                   process.priority === 'high' ? '#ff9800' : 
                                   process.priority === 'medium' ? '#2196f3' : '#4caf50',
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
                      {process.lastUpdated instanceof Date ? process.lastUpdated.toLocaleDateString() : new Date(process.lastUpdated).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {process.lastUpdated instanceof Date ? process.lastUpdated.toLocaleTimeString() : new Date(process.lastUpdated).toLocaleTimeString()}
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
                          onClick={() => setDeleteConfirm({
                            open: true,
                            processId: process.id,
                            processName: process.employeeName
                          })}
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

      {/* Create/Edit/View Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isViewMode ? 'View Exit Process' : isCreateMode ? 'Create New Exit Process' : 'Edit Exit Process'}
        </DialogTitle>
        <DialogContent>
          {isViewMode && selectedProcess ? (
            // View Mode - Display process details
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <Typography variant="h6" gutterBottom>Employee Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {selectedProcess.employeeName.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary="Employee Name"
                        secondary={selectedProcess.employeeName}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Department"
                        secondary={selectedProcess.employeeDepartment}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Status"
                        secondary={selectedProcess.status.replace('_', ' ')}
                      />
                      <Chip
                        label={selectedProcess.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: selectedProcess.status === 'pending' ? '#ff9800' : 
                                   selectedProcess.status === 'in_progress' ? '#2196f3' : 
                                   selectedProcess.status === 'completed' ? '#4caf50' : '#f44336',
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Priority"
                        secondary={selectedProcess.priority}
                      />
                      <Chip
                        label={selectedProcess.priority}
                        size="small"
                        sx={{
                          bgcolor: selectedProcess.priority === 'urgent' ? '#f44336' : 
                                   selectedProcess.priority === 'high' ? '#ff9800' : 
                                   selectedProcess.priority === 'medium' ? '#2196f3' : '#4caf50',
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <Typography variant="h6" gutterBottom>Process Details</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Exit Date"
                        secondary={selectedProcess.exitDate instanceof Date ? selectedProcess.exitDate.toLocaleDateString() : new Date(selectedProcess.exitDate).toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ExitIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Reason"
                        secondary={selectedProcess.reason}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
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
                        secondary={selectedProcess.initiatedAt instanceof Date ? selectedProcess.initiatedAt.toLocaleDateString() : new Date(selectedProcess.initiatedAt).toLocaleDateString()}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box sx={{ gridColumn: 'span 2' }}>
                  <Typography variant="h6" gutterBottom>Checklist Progress</Typography>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        Checklist Items ({selectedProcess.checklist.filter(item => item.status === 'completed').length}/{selectedProcess.checklist.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {selectedProcess.checklist.map((item) => (
                          <ListItem key={item.id}>
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
                                <>
                                  <Typography variant="caption" display="block">
                                    Assigned to: {item.assignedTo}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Due: {item.dueDate instanceof Date ? item.dueDate.toLocaleDateString() : new Date(item.dueDate).toLocaleDateString()}
                                  </Typography>
                                  {item.notes && (
                                    <Typography variant="caption" display="block">
                                      Notes: {item.notes}
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                            <Chip
                              label={item.status}
                              size="small"
                              sx={{
                                bgcolor: item.status === 'completed' ? '#4caf50' : 
                                         item.status === 'in_progress' ? '#2196f3' : '#ff9800',
                                color: 'white',
                                textTransform: 'capitalize'
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </Box>
            </Box>
          ) : (
            // Create/Edit Mode - Show form
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Box sx={{ gridColumn: 'span 1' }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Employee *</InputLabel>
                    <Select
                      value={formData.employeeId || ''}
                      label="Select Employee *"
                      onChange={(e) => {
                        const selectedEmployee = employees.find(emp => emp.id === e.target.value);
                        if (selectedEmployee) {
                          setFormData(prev => ({
                            ...prev,
                            employeeId: selectedEmployee.id,
                            employeeName: selectedEmployee.name,
                            employeeEmail: selectedEmployee.email,
                            employeeDepartment: selectedEmployee.department
                          }));
                        }
                      }}
                    >
                      {employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.department}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Employee Name"
                    value={formData.employeeName}
                    disabled
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Employee Email"
                    value={formData.employeeEmail}
                    disabled
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Department"
                    value={formData.employeeDepartment}
                    disabled
                    sx={{ mb: 2 }}
                  />
                </Box>

                <Box sx={{ gridColumn: 'span 1' }}>
                  <TextField
                    fullWidth
                    label="Exit Date"
                    type="date"
                    value={formData.exitDate && formData.exitDate instanceof Date && !isNaN(formData.exitDate.getTime()) 
                      ? formData.exitDate.toISOString().split('T')[0] 
                      : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, exitDate: new Date(e.target.value) }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />

                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority || 'medium'}
                      label="Priority"
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Reason for Exit *"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                    required
                  />

                  <TextField
                    fullWidth
                    label="Additional Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />
                </Box>

                <Box sx={{ gridColumn: 'span 2' }}>
                  <Typography variant="h6" gutterBottom>
                    Default Checklist Items
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    The following checklist items will be automatically created for this exit process:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox checked disabled color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Return company equipment (IT Department)"
                        secondary="Laptop, phone, access cards, etc. - Due in 7 days"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox checked disabled color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Complete exit interview (HR Department)"
                        secondary="Final exit interview with HR - Due in 3 days"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox checked disabled color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Return access badges (Security Department)"
                        secondary="Building access, parking, etc. - Due in 1 day"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox checked disabled color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Final salary and benefits processing (Finance Department)"
                        secondary="Final paycheck, benefits termination - Due in 14 days"
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button 
              onClick={async () => {
                if (!formData.employeeId || !formData.employeeName || !formData.reason) {
                  setSnackbar({
                    open: true,
                    message: 'Please fill in all required fields (Employee, Reason)',
                    severity: 'error'
                  });
                  return;
                }

                try {
                  if (isCreateMode) {
                    // Create new process - remove the id field to let Firebase generate it
                    const processData = {
                      employeeId: formData.employeeId,
                      employeeName: formData.employeeName,
                      employeeEmail: formData.employeeEmail || '',
                      employeeDepartment: formData.employeeDepartment || '',
                      exitDate: formData.exitDate || new Date(),
                      reason: formData.reason,
                      status: 'pending' as const,
                      priority: formData.priority || 'medium',
                      checklist: formData.checklist && formData.checklist.length > 0 ? formData.checklist : [
                        {
                          id: Date.now().toString() + '_1',
                          task: 'Return company equipment',
                          category: 'it' as const,
                          status: 'pending' as const,
                          assignedTo: 'IT Department',
                          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                          notes: 'Laptop, phone, access cards, etc.'
                        },
                        {
                          id: Date.now().toString() + '_2',
                          task: 'Complete exit interview',
                          category: 'hr' as const,
                          status: 'pending' as const,
                          assignedTo: 'HR Department',
                          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                          notes: 'Final exit interview with HR'
                        },
                        {
                          id: Date.now().toString() + '_3',
                          task: 'Return access badges',
                          category: 'security' as const,
                          status: 'pending' as const,
                          assignedTo: 'Security Department',
                          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                          notes: 'Building access, parking, etc.'
                        },
                        {
                          id: Date.now().toString() + '_4',
                          task: 'Final salary and benefits processing',
                          category: 'finance' as const,
                          status: 'pending' as const,
                          assignedTo: 'Finance Department',
                          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                          notes: 'Final paycheck, benefits termination'
                        }
                      ],
                      notes: formData.notes || '',
                      initiatedBy: 'Current User',
                      initiatedAt: new Date(),
                      lastUpdated: new Date()
                    };

                    const response = await firebaseService.addDocument('exitProcesses', processData);
                    console.log('Firebase response:', response);
                    if (response.success && response.data) {
                      const createdProcess = response.data as ExitProcessData;
                      console.log('Created process with ID:', createdProcess.id);
                      
                      setExitProcesses(prev => [createdProcess, ...prev]);
                      setSnackbar({
                        open: true,
                        message: 'Exit process created successfully',
                        severity: 'success'
                      });
                      setIsDialogOpen(false);
                    } else {
                      throw new Error(response.error || 'Failed to create exit process');
                    }
                  } else {
                    // Update existing process
                    if (selectedProcess) {
                      const updateData = {
                        employeeId: formData.employeeId || selectedProcess.employeeId,
                        employeeName: formData.employeeName || selectedProcess.employeeName,
                        employeeEmail: formData.employeeEmail || selectedProcess.employeeEmail,
                        employeeDepartment: formData.employeeDepartment || selectedProcess.employeeDepartment,
                        exitDate: formData.exitDate || selectedProcess.exitDate,
                        reason: formData.reason || selectedProcess.reason,
                        priority: formData.priority || selectedProcess.priority,
                        notes: formData.notes || selectedProcess.notes || '',
                        lastUpdated: new Date()
                      };
                      
                      const response = await firebaseService.updateDocument('exitProcesses', selectedProcess.id, updateData);
                      
                      if (response.success) {
                        setExitProcesses(prev => prev.map(process =>
                          process.id === selectedProcess.id
                            ? { ...process, ...updateData }
                            : process
                        ));
                        setSnackbar({
                          open: true,
                          message: 'Exit process updated successfully',
                          severity: 'success'
                        });
                        setIsDialogOpen(false);
                      } else {
                        throw new Error(response.error || 'Failed to update exit process');
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error saving exit process:', error);
                  setSnackbar({
                    open: true,
                    message: 'Error saving exit process: ' + (error instanceof Error ? error.message : 'Unknown error'),
                    severity: 'error'
                  });
                }
              }}
              variant="contained" 
              color="primary"
              disabled={!formData.employeeId || !formData.employeeName || !formData.reason}
            >
              {isCreateMode ? 'Create Process' : 'Update Process'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Are you sure you want to delete the exit process for <strong>{deleteConfirm.processName}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This action cannot be undone. All process data and checklist items will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (deleteConfirm.processId) {
                handleDeleteProcess(deleteConfirm.processId);
                setDeleteConfirm(prev => ({ ...prev, open: false }));
              }
            }}
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete Process
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExitProcess;
