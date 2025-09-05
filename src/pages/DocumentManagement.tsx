import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Tooltip,
  Stack,
  Container,
  Fade,
  Pagination,
  Avatar,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as FileUploadIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import documentService from '../services/documentService';
import { Document, DocumentFormData } from '../types';

const DocumentManagement: React.FC = () => {
  // State management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccessLevel, setFilterAccessLevel] = useState('');
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCache, setFileCache] = useState<Map<string, File>>(new Map());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    type: '',
    category: '',
    description: '',
    accessLevel: 'public',
    expiryDate: ''
  });

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    restricted: 0,
    expired: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadDocuments(), loadStats()]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      console.log('Loading documents...');
      const result = await documentService.getDocuments({
        sortBy,
        sortOrder,
        limit: rowsPerPage * 10 // Load more for pagination
      });
      
      console.log('Documents loaded:', result);
      
      if (result.success && result.data) {
        const documentsArray = Array.isArray(result.data) ? result.data : [];
        console.log('Setting documents to:', documentsArray.length, 'documents');
        setDocuments(documentsArray);
        setError('');
      } else {
        console.warn('Failed to load documents:', result);
        setDocuments([]);
        setError('Failed to load documents');
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      setDocuments([]);
      setError('Failed to load documents');
    }
  };

  const loadStats = async () => {
    try {
      console.log('Loading document stats...');
      const result = await documentService.getDocumentStats();
      console.log('Stats result:', result);
      
      if (result.success) {
        const statsData = {
          total: result.data?.total || 0,
          active: result.data?.active || 0,
          restricted: result.data?.accessLevels?.restricted || 0,
          expired: result.data?.expired || 0
        };
        console.log('Setting stats to:', statsData);
        setStats(statsData);
      } else {
        console.warn('Stats loading failed:', result);
        setStats({ total: 0, active: 0, restricted: 0, expired: 0 });
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setStats({ total: 0, active: 0, restricted: 0, expired: 0 });
    }
  };

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || doc.type === filterType;
    const matchesCategory = !filterCategory || doc.category === filterCategory;
    const matchesAccessLevel = !filterAccessLevel || doc.accessLevel === filterAccessLevel;
    
    return matchesSearch && matchesType && matchesCategory && matchesAccessLevel;
  });

  // Pagination
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      const typeMap: { [key: string]: string } = {
        'pdf': 'PDF',
        'doc': 'Word Document',
        'docx': 'Word Document',
        'xls': 'Excel Spreadsheet',
        'xlsx': 'Excel Spreadsheet',
        'ppt': 'PowerPoint Presentation',
        'pptx': 'PowerPoint Presentation',
        'jpg': 'Image',
        'jpeg': 'Image',
        'png': 'Image',
        'gif': 'Image',
        'txt': 'Text Document'
      };
      if (extension && typeMap[extension]) {
        setFormData(prev => ({ ...prev, type: typeMap[extension] }));
      }
    }
  };

  // Form submission
  const handleFormSubmit = async () => {
    // Only require file for new documents, not for updates
    if (!editingDocument && !selectedFile) {
      setSnackbar({ open: true, message: 'Please select a file to upload', severity: 'error' });
      return;
    }

    if (!formData.title.trim()) {
      setSnackbar({ open: true, message: 'Please enter a title', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      if (editingDocument) {
        // Update existing document
        const updateData: any = {
          title: formData.title.trim(),
          type: formData.type || 'Other',
          category: formData.category || 'Other',
          description: formData.description?.trim() || '',
          accessLevel: formData.accessLevel || 'public',
          expiryDate: formData.expiryDate || ''
        };
        
        // Only include file if a new one is selected
        if (selectedFile) {
          updateData.file = selectedFile;
        }
        
        console.log('Updating document with data:', updateData);
        const result = await documentService.updateDocument(editingDocument.id, updateData);
        
        if (result.success) {
          setSnackbar({ open: true, message: 'Document updated successfully!', severity: 'success' });
          loadDocuments();
          loadStats();
          handleCloseUploadDialog();
        } else {
          throw new Error(result.message || 'Failed to update document');
        }
      } else {
        // Create new document
        const documentData = {
          title: formData.title.trim(),
          type: formData.type || 'Other',
          category: formData.category || 'Other',
          description: formData.description?.trim() || '',
          accessLevel: formData.accessLevel || 'public',
          expiryDate: formData.expiryDate || '',
          file: selectedFile
        };
        
        console.log('Submitting document data:', documentData);
        const result = await documentService.createDocument(documentData);
        
        if (result.success && result.data?.id) {
          // Cache the file for download
          setFileCache(prev => new Map(prev).set(result.data.id, selectedFile));
          setSnackbar({ open: true, message: 'Document uploaded successfully!', severity: 'success' });
          loadDocuments();
          loadStats();
          handleCloseUploadDialog();
        } else {
          throw new Error(result.message || 'Failed to upload document');
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setSnackbar({ 
        open: true, 
        message: err instanceof Error ? err.message : 'Failed to process document', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Close upload dialog
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setEditingDocument(null);
    setSelectedFile(null);
    setFormData({
      title: '',
      type: '',
      category: '',
      description: '',
      accessLevel: 'public',
      expiryDate: ''
    });
  };

  // Download document
  const handleDownload = (doc: Document) => {
    try {
      const cachedFile = fileCache.get(doc.id);
      
      if (cachedFile) {
        // Download the actual cached file
        const url = window.URL.createObjectURL(cachedFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = cachedFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSnackbar({ open: true, message: `Downloaded ${doc.title}`, severity: 'success' });
      } else if ((doc as any).fileData && (doc as any).fileData.trim() !== '') {
        // Download from base64 data stored in Firestore
        const base64Data = (doc as any).fileData;
        const fileName = (doc as any).fileName || `${doc.title}.${doc.type.toLowerCase()}`;
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: (doc as any).fileType || 'application/octet-stream' });
        
        // Download the file
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSnackbar({ open: true, message: `Downloaded ${doc.title}`, severity: 'success' });
      } else if (doc.url && doc.url.trim() !== '' && !doc.url.includes('dashboard')) {
        // Open URL in new tab
        window.open(doc.url, '_blank');
      } else {
        // Fallback: Create metadata file
        const content = `DOCUMENT INFORMATION
====================
Title: ${doc.title}
Type: ${doc.type}
Category: ${doc.category}
Description: ${doc.description || 'No description'}
Access Level: ${doc.accessLevel}
Uploaded: ${new Date(doc.uploadedAt).toLocaleString()}
Expiry: ${doc.expiryDate ? new Date(doc.expiryDate).toLocaleString() : 'No expiry'}

Note: Original file not available for download.`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSnackbar({ open: true, message: `Downloaded ${doc.title} information`, severity: 'info' });
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      setSnackbar({ open: true, message: 'Failed to download document', severity: 'error' });
    }
  };

  // Edit document
  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setFormData({
      title: doc.title,
      type: doc.type,
      category: doc.category,
      description: doc.description || '',
      accessLevel: doc.accessLevel,
      expiryDate: doc.expiryDate || ''
    });
    setUploadDialogOpen(true);
  };

  // Show delete confirmation dialog
  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  // Confirm delete - now does permanent deletion
  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      console.log('Permanently deleting document:', documentToDelete.title, 'ID:', documentToDelete.id);
      const result = await documentService.permanentDeleteDocument(documentToDelete.id);
      console.log('Permanent delete result:', result);

      if (result.success) {
        // Remove from file cache
        setFileCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(documentToDelete.id);
          return newCache;
        });
        setSnackbar({ open: true, message: `Document "${documentToDelete.title}" permanently deleted`, severity: 'success' });

        // Reload both documents and stats
        console.log('Reloading documents and stats...');
        await Promise.all([loadDocuments(), loadStats()]);
      } else {
        throw new Error(result.message || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to delete document',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };


  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date: string | number) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
                {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Document Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Upload Document
        </Button>
      </Box>

      {/* Error Alert */}
          {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} mb={4}>
            <Card>
              <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                <Typography color="textSecondary" gutterBottom>
                      Total Documents
                    </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.total}
                </Typography>
                  </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <DescriptionIcon />
              </Avatar>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                <Typography color="textSecondary" gutterBottom>
                  Active Documents
                    </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {stats.active}
                    </Typography>
                  </Box>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <CloudUploadIcon />
              </Avatar>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                <Typography color="textSecondary" gutterBottom>
                  Restricted Access
                    </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {stats.restricted}
                    </Typography>
                  </Box>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <SecurityIcon />
              </Avatar>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                <Typography color="textSecondary" gutterBottom>
                  Expired Documents
                    </Typography>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {stats.expired}
                    </Typography>
                  </Box>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <ScheduleIcon />
              </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <TextField
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
                  label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="Word Document">Word Document</MenuItem>
              <MenuItem value="Excel Spreadsheet">Excel Spreadsheet</MenuItem>
              <MenuItem value="PowerPoint Presentation">PowerPoint Presentation</MenuItem>
              <MenuItem value="Image">Image</MenuItem>
              <MenuItem value="Text Document">Text Document</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="HR Policies">HR Policies</MenuItem>
              <MenuItem value="Training Materials">Training Materials</MenuItem>
              <MenuItem value="Forms">Forms</MenuItem>
              <MenuItem value="Reports">Reports</MenuItem>
              <MenuItem value="Legal">Legal</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Access Level</InputLabel>
                <Select
              value={filterAccessLevel}
              onChange={(e) => setFilterAccessLevel(e.target.value)}
                  label="Access Level"
                >
              <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="restricted">Restricted</MenuItem>
              <MenuItem value="confidential">Confidential</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

      {/* Documents Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Access Level</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Expiry</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
              {paginatedDocuments.map((doc) => (
                <TableRow key={doc.id} hover>
                                          <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {doc.title}
                      </Typography>
                      {doc.description && (
                        <Typography variant="body2" color="textSecondary" noWrap>
                          {doc.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                        <TableCell>
                    <Chip label={doc.type} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Chip label={doc.category} size="small" color="secondary" />
                        </TableCell>
                        <TableCell>
                          <Chip
                      label={doc.accessLevel} 
                            size="small"
                      color={doc.accessLevel === 'public' ? 'success' : 'warning'} 
                          />
                        </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(doc.uploadedAt)}
                    </Typography>
                  </TableCell>
                        <TableCell>
                    <Typography variant="body2">
                      {doc.expiryDate ? formatDate(doc.expiryDate) : 'No expiry'}
                    </Typography>
                        </TableCell>
                                          <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Download">
                        <IconButton onClick={() => handleDownload(doc)} size="small">
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(doc)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteClick(doc)} size="small" color="error">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
          </Paper>

      {/* Upload/Edit Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDocument ? 'Edit Document' : 'Upload New Document'}
        </DialogTitle>
            <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
                <TextField
              label="Document Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                />

            <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    label="Type"
                >
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="Word Document">Word Document</MenuItem>
                  <MenuItem value="Excel Spreadsheet">Excel Spreadsheet</MenuItem>
                  <MenuItem value="PowerPoint Presentation">PowerPoint Presentation</MenuItem>
                  <MenuItem value="Image">Image</MenuItem>
                  <MenuItem value="Text Document">Text Document</MenuItem>
                  </Select>
                </FormControl>

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  label="Category"
                >
                  <MenuItem value="HR Policies">HR Policies</MenuItem>
                  <MenuItem value="Training Materials">Training Materials</MenuItem>
                  <MenuItem value="Forms">Forms</MenuItem>
                  <MenuItem value="Reports">Reports</MenuItem>
                  <MenuItem value="Legal">Legal</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>

                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
                  multiline
                  rows={3}
                />

            <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Access Level</InputLabel>
                  <Select
                    value={formData.accessLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, accessLevel: e.target.value }))}
                    label="Access Level"
                  >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="restricted">Restricted</MenuItem>
                  <MenuItem value="confidential">Confidential</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
            </Box>

            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<FileUploadIcon />}
                  fullWidth
                sx={{ py: 2 }}
              >
                {selectedFile 
                  ? selectedFile.name 
                  : editingDocument 
                    ? 'Select New File (optional)' 
                    : 'Select File'
                }
                <input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                />
              </Button>
              {editingDocument && !selectedFile && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Current file will be kept if no new file is selected
              </Typography>
              )}
            </Box>
          </Box>
            </DialogContent>
            <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button 
            onClick={handleFormSubmit} 
            variant="contained"
            disabled={(!editingDocument && !selectedFile) || !formData.title.trim()}
          >
            {editingDocument ? 'Update Document' : 'Upload Document'}
              </Button>
            </DialogActions>
          </Dialog>

                {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Permanently Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete "{documentToDelete?.title}"?
            This action will remove the document from the database completely and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
              severity={snackbar.severity}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      );
    };

    export default DocumentManagement;