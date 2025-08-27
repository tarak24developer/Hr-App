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
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Chat as ChatIcon,
  Download as DownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import firebaseService from '@/services/firebaseService';
import { showNotification } from '@/utils/notification';

interface Request {
  id: string;
  title: string;
  description: string;
  type: 'leave' | 'expense' | 'equipment' | 'support' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  attachments: string[];
  comments: RequestComment[];
  approvalWorkflow: ApprovalStep[];
}

interface RequestComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isInternal: boolean;
}

interface ApprovalStep {
  id: string;
  step: number;
  approverName: string;
  approverId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  processedAt?: string;
}

interface RequestFilters {
  search: string;
  type: string;
  status: string;
  priority: string;
  requester: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

const initialFilters: RequestFilters = {
  search: '',
  type: '',
  status: '',
  priority: '',
  requester: '',
  dateRange: {
    start: null,
    end: null
  }
};

const statusColors = {
  pending: '#ff9800',
  approved: '#4caf50',
  rejected: '#f44336',
  in_review: '#2196f3'
};

const priorityColors = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  urgent: '#9c27b0'
};

const typeColors = {
  leave: '#2196f3',
  expense: '#4caf50',
  equipment: '#ff9800',
  support: '#9c27b0',
  other: '#795548'
};

const RequestPortal: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [filters, setFilters] = useState<RequestFilters>(initialFilters);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Form state for creating/editing requests
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    type: 'leave' as 'leave' | 'expense' | 'equipment' | 'support' | 'other',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: '',
    assignedTo: '',
    attachments: [] as string[]
  });

  // Comment form state
  const [commentForm, setCommentForm] = useState({
    content: '',
    isInternal: false
  });

  // Fetch requests from Firebase
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await firebaseService.getCollection('requests');
      
      if (result.success && result.data) {
        const requestsData = result.data.map((request: any) => ({
          id: request.id,
          title: request.title || '',
          description: request.description || '',
          type: request.type || 'other',
          status: request.status || 'pending',
          priority: request.priority || 'medium',
          requesterId: request.requesterId || '',
          requesterName: request.requesterName || '',
          requesterEmail: request.requesterEmail || '',
          assignedTo: request.assignedTo || '',
          createdAt: request.createdAt || '',
          updatedAt: request.updatedAt || '',
          dueDate: request.dueDate || '',
          completedAt: request.completedAt || '',
          attachments: request.attachments || [],
          comments: request.comments || [],
          approvalWorkflow: request.approvalWorkflow || []
        }));
        setRequests(requestsData);
      } else {
        setError('Failed to load requests');
        showNotification('Error loading requests', 'error');
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
      showNotification('Error loading requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Request form handlers
  const handleRequestFormChange = (field: string, value: any) => {
    setRequestForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveRequest = async () => {
    try {
      if (!requestForm.title || !requestForm.description) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      const requestData = {
        ...requestForm,
        requesterId: 'current-user-id', // TODO: Get from auth context
        requesterName: 'Current User', // TODO: Get from auth context
        requesterEmail: 'current.user@company.com', // TODO: Get from auth context
        status: 'pending' as const,
        createdAt: isCreateMode ? new Date().toISOString() : selectedRequest?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [],
        approvalWorkflow: []
      };

      if (isCreateMode) {
        const result = await firebaseService.addDocument('requests', requestData);
        if (result.success) {
          showNotification('Request submitted successfully!', 'success');
          setIsDialogOpen(false);
          resetRequestForm();
          fetchRequests();
        } else {
          showNotification('Failed to submit request', 'error');
        }
      } else if (selectedRequest) {
        const result = await firebaseService.updateDocument('requests', selectedRequest.id, requestData);
        if (result.success) {
          showNotification('Request updated successfully!', 'success');
          setIsDialogOpen(false);
          resetRequestForm();
          fetchRequests();
        } else {
          showNotification('Failed to update request', 'error');
        }
      }
    } catch (err) {
      console.error('Error saving request:', err);
      showNotification('Error saving request', 'error');
    }
  };

  const resetRequestForm = () => {
    setRequestForm({
      title: '',
      description: '',
      type: 'leave',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
      attachments: []
    });
    setCommentForm({
      content: '',
      isInternal: false
    });
  };

  // Comment management
  const handleAddComment = async (requestId: string) => {
    try {
      if (!commentForm.content.trim()) {
        showNotification('Please enter a comment', 'error');
        return;
      }

      const newComment: RequestComment = {
        id: Date.now().toString(),
        content: commentForm.content,
        authorId: 'current-user-id', // TODO: Get from auth context
        authorName: 'Current User', // TODO: Get from auth context
        createdAt: new Date().toISOString(),
        isInternal: commentForm.isInternal
      };

      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const updatedRequest = {
        ...request,
        comments: [...request.comments, newComment],
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('requests', requestId, updatedRequest);
      if (result.success) {
        setCommentForm({ content: '', isInternal: false });
        fetchRequests();
        showNotification('Comment added successfully!', 'success');
      } else {
        showNotification('Failed to add comment', 'error');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      showNotification('Error adding comment', 'error');
    }
  };

  // Request actions
  const handleApproveRequest = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const updatedRequest = {
        ...request,
        status: 'approved',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('requests', requestId, updatedRequest);
      if (result.success) {
        fetchRequests();
        showNotification('Request approved successfully!', 'success');
      } else {
        showNotification('Failed to approve request', 'error');
      }
    } catch (err) {
      console.error('Error approving request:', err);
      showNotification('Error approving request', 'error');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const updatedRequest = {
        ...request,
        status: 'rejected',
        updatedAt: new Date().toISOString()
      };

      const result = await firebaseService.updateDocument('requests', requestId, updatedRequest);
      if (result.success) {
        fetchRequests();
        showNotification('Request rejected', 'info');
      } else {
        showNotification('Failed to reject request', 'error');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      showNotification('Error rejecting request', 'error');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const result = await firebaseService.deleteDocument('requests', requestId);
      
      if (result.success) {
        setRequests(prev => prev.filter(req => req.id !== requestId));
        setSnackbar({
          open: true,
          message: 'Request deleted successfully',
          severity: 'success'
        });
        showNotification('Request deleted successfully!', 'success');
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to delete request',
          severity: 'error'
        });
        showNotification('Failed to delete request', 'error');
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      setSnackbar({
        open: true,
        message: 'Error deleting request',
        severity: 'error'
      });
      showNotification('Error deleting request', 'error');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filters]);

  const applyFilters = useCallback(() => {
    let filtered = [...requests];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower) ||
        request.requesterName.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(request => request.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(request => request.priority === filters.priority);
    }

    if (filters.requester) {
      filtered = filtered.filter(request => request.requesterName === filters.requester);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter(request => request.createdAt >= filters.dateRange.start!);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter(request => request.createdAt <= filters.dateRange.end!);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [requests, filters]);

  const handleFilterChange = (field: keyof RequestFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateRequest = () => {
    resetRequestForm();
    setSelectedRequest(null);
    setIsViewMode(false);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleEditRequest = (request: Request) => {
    setRequestForm({
      title: request.title,
      description: request.description,
      type: request.type,
      priority: request.priority,
      dueDate: request.dueDate || '',
      assignedTo: request.assignedTo || '',
      attachments: request.attachments
    });
    setSelectedRequest(request);
    setIsViewMode(false);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setIsViewMode(true);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      case 'in_review':
        return <ChatIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'leave':
        return 'Leave Request';
      case 'expense':
        return 'Expense Reimbursement';
      case 'equipment':
        return 'Equipment Request';
      case 'support':
        return 'IT Support';
      case 'other':
        return 'Other Request';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchRequests} variant="contained">
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Request Portal
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {}}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRequest}
            sx={{ bgcolor: 'primary.main' }}
          >
            Submit Request
          </Button>
        </Box>
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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ p: 1, bgcolor: 'primary.100', borderRadius: 1, mr: 2 }}>
                <DescriptionIcon color="primary" />
              </Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Requests
                </Typography>
                <Typography variant="h4" component="div">
                  {requests.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ p: 1, bgcolor: 'warning.100', borderRadius: 1, mr: 2 }}>
                <ScheduleIcon color="warning" />
              </Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Pending Approval
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {requests.filter(req => req.status === 'pending').length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ p: 1, bgcolor: 'success.100', borderRadius: 1, mr: 2 }}>
                <CheckCircleIcon color="success" />
              </Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Approved
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {requests.filter(req => req.status === 'approved').length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ p: 1, bgcolor: 'info.100', borderRadius: 1, mr: 2 }}>
                <ChatIcon color="info" />
              </Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  In Review
                </Typography>
                <Typography variant="h4" component="div" color="info.main">
                  {requests.filter(req => req.status === 'in_review').length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* No Data State */}
      {requests.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No requests available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by submitting your first request.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRequest}
          >
            Submit First Request
          </Button>
        </Box>
      )}

      {/* Filters */}
      {requests.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Filters</Typography>
          </Box>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2 
          }}>
            <TextField
              fullWidth
              label="Search Requests"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon />
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Request Type</InputLabel>
              <Select
                value={filters.type}
                label="Request Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="leave">Leave Request</MenuItem>
                <MenuItem value="expense">Expense Reimbursement</MenuItem>
                <MenuItem value="equipment">Equipment Request</MenuItem>
                <MenuItem value="support">IT Support</MenuItem>
                <MenuItem value="other">Other Request</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="in_review">In Review</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      {/* Requests Table */}
      {requests.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Request</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Requester</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRequests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {request.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 200 }}>
                          {request.description}
                        </Typography>
                        {request.dueDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="caption" color="textSecondary">
                              Due: {formatDate(request.dueDate)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRequestTypeLabel(request.type)}
                        size="small"
                        sx={{
                          bgcolor: typeColors[request.type],
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {request.requesterName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {request.requesterEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(request.status)}
                        <Chip
                          label={request.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            bgcolor: statusColors[request.status],
                            color: 'white',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority}
                        size="small"
                        sx={{
                          bgcolor: priorityColors[request.priority],
                          color: 'white',
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(request.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewRequest(request)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Request">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRequest(request)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                onClick={() => handleApproveRequest(request.id)}
                                color="success"
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                onClick={() => handleRejectRequest(request.id)}
                                color="error"
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Delete Request">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRequest(request.id)}
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
      )}

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

      {/* Request Details Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon />
            <Typography variant="h6">
              {isViewMode ? 'Request Details' : isCreateMode ? 'Submit New Request' : 'Edit Request'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isViewMode && selectedRequest ? (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 3 
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom>Request Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Title"
                        secondary={selectedRequest.title}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Type"
                        secondary={getRequestTypeLabel(selectedRequest.type)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Description"
                        secondary={selectedRequest.description}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={selectedRequest.status.replace('_', ' ')}
                            size="small"
                            sx={{
                              bgcolor: statusColors[selectedRequest.status],
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Priority"
                        secondary={
                          <Chip
                            label={selectedRequest.priority}
                            size="small"
                            sx={{
                              bgcolor: priorityColors[selectedRequest.priority],
                              color: 'white',
                              textTransform: 'capitalize'
                            }}
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Approval Workflow</Typography>
                  <List dense>
                    {selectedRequest.approvalWorkflow.map((step, index) => (
                      <ListItem key={step.id}>
                        <ListItemIcon>
                          <Box sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'medium',
                            bgcolor: step.status === 'approved' 
                              ? 'success.100' 
                              : step.status === 'rejected'
                              ? 'error.100'
                              : 'grey.100',
                            color: step.status === 'approved' 
                              ? 'success.800' 
                              : step.status === 'rejected'
                              ? 'error.800'
                              : 'grey.800'
                          }}>
                            {index + 1}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={step.approverName}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {step.status === 'pending' ? 'Pending' : 
                                 step.status === 'approved' ? 'Approved' : 'Rejected'}
                              </Typography>
                              {step.comments && (
                                <Typography variant="caption" display="block">
                                  {step.comments}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>

              {/* Comments Section */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Comments</Typography>
                
                {/* Add Comment Form */}
                <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Add Comment</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter your comment..."
                    value={commentForm.content}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={commentForm.isInternal}
                          onChange={(e) => setCommentForm(prev => ({ ...prev, isInternal: e.target.checked }))}
                        />
                      }
                      label="Internal Comment"
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleAddComment(selectedRequest.id)}
                      disabled={!commentForm.content.trim()}
                    >
                      Add Comment
                    </Button>
                  </Box>
                </Box>

                {/* Comments List */}
                {selectedRequest.comments.length > 0 ? (
                  <List>
                    {selectedRequest.comments.map((comment) => (
                      <ListItem key={comment.id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {comment.authorName}
                              </Typography>
                              {comment.isInternal && (
                                <Chip label="Internal" size="small" color="warning" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {comment.content}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                {formatDate(comment.createdAt)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      No comments yet
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* Request Form */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Request Title"
                  value={requestForm.title}
                  onChange={(e) => handleRequestFormChange('title', e.target.value)}
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Request Type</InputLabel>
                  <Select
                    value={requestForm.type}
                    label="Request Type"
                    onChange={(e) => handleRequestFormChange('type', e.target.value)}
                  >
                    <MenuItem value="leave">Leave Request</MenuItem>
                    <MenuItem value="expense">Expense Reimbursement</MenuItem>
                    <MenuItem value="equipment">Equipment Request</MenuItem>
                    <MenuItem value="support">IT Support</MenuItem>
                    <MenuItem value="other">Other Request</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={requestForm.priority}
                    label="Priority"
                    onChange={(e) => handleRequestFormChange('priority', e.target.value)}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Due Date (Optional)"
                  type="date"
                  value={requestForm.dueDate}
                  onChange={(e) => handleRequestFormChange('dueDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Description"
                value={requestForm.description}
                onChange={(e) => handleRequestFormChange('description', e.target.value)}
                multiline
                rows={4}
                required
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Assign To (Optional)"
                value={requestForm.assignedTo}
                onChange={(e) => handleRequestFormChange('assignedTo', e.target.value)}
                placeholder="Enter assignee name or department"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isViewMode ? (
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          ) : (
            <>
              <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleSaveRequest}
              >
                {isCreateMode ? 'Submit Request' : 'Update Request'}
              </Button>
            </>
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
  );
};

export default RequestPortal;
