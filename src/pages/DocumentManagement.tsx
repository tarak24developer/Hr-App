import React, { useState, useEffect } from 'react';
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
  IconButton,
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
  Divider,
  Container,
  Fade,
  Tabs,
  Tab,
  TablePagination,
  Switch,
  FormControlLabel,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Description as DocumentIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

// Types
interface Document {
  id: string;
  title: string;
  type: DocumentType;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: number;
  fileType: string;
  url: string;
  tags: string[];
  accessLevel: 'public' | 'private' | 'restricted';
  expiryDate?: string;
  description?: string;
  version: number;
  isActive: boolean;
}

type DocumentType = 'policy' | 'contract' | 'certificate' | 'report' | 'form' | 'other';

interface DocumentFormData {
  title: string;
  type: DocumentType;
  category: string;
  description: string;
  tags: string[];
  accessLevel: 'public' | 'private' | 'restricted';
  expiryDate: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`document-tabpanel-${index}`}
      aria-labelledby={`document-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DocumentManagement: React.FC = () => {
  const theme = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'public' | 'private' | 'restricted'>('all');
  const [tabValue, setTabValue] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    type: 'other',
    category: '',
    description: '',
    tags: [],
    accessLevel: 'private',
    expiryDate: ''
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sample data
  const sampleDocuments: Document[] = [
    {
      id: '1',
      title: 'Employee Handbook 2024',
      type: 'policy',
      category: 'HR Policies',
      uploadedBy: 'John Doe',
      uploadedAt: '2024-01-15T10:30:00Z',
      fileSize: 2048576,
      fileType: 'pdf',
      url: '/documents/handbook-2024.pdf',
      tags: ['handbook', 'policy', 'employees'],
      accessLevel: 'public',
      description: 'Updated employee handbook for 2024',
      version: 2,
      isActive: true
    },
    {
      id: '2',
      title: 'Q4 Financial Report',
      type: 'report',
      category: 'Finance',
      uploadedBy: 'Jane Smith',
      uploadedAt: '2024-01-10T14:20:00Z',
      fileSize: 1536000,
      fileType: 'pdf',
      url: '/documents/q4-report.pdf',
      tags: ['finance', 'quarterly', 'report'],
      accessLevel: 'restricted',
      description: 'Quarterly financial performance report',
      version: 1,
      isActive: true
    },
    {
      id: '3',
      title: 'Safety Training Certificate',
      type: 'certificate',
      category: 'Training',
      uploadedBy: 'Mike Johnson',
      uploadedAt: '2024-01-08T09:15:00Z',
      fileSize: 512000,
      fileType: 'pdf',
      url: '/documents/safety-cert.pdf',
      tags: ['safety', 'training', 'certificate'],
      accessLevel: 'private',
      expiryDate: '2024-12-31T23:59:59Z',
      description: 'Annual safety training certification',
      version: 1,
      isActive: true
    }
  ];

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDocuments(sampleDocuments);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesAccess = accessFilter === 'all' || doc.accessLevel === accessFilter;
    return matchesSearch && matchesType && matchesAccess;
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUploadClick = () => {
    setFormData({
      title: '',
      type: 'other',
      category: '',
      description: '',
      tags: [],
      accessLevel: 'private',
      expiryDate: ''
    });
    setUploadFile(null);
    setShowUploadDialog(true);
  };

  const handleEditClick = (document: Document) => {
    setSelectedDocument(document);
    setFormData({
      title: document.title,
      type: document.type,
      category: document.category,
      description: document.description || '',
      tags: document.tags,
      accessLevel: document.accessLevel,
      expiryDate: document.expiryDate || ''
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (document: Document) => {
    setSelectedDocument(document);
    setShowDeleteDialog(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.split('.')[0] }));
      }
    }
  };

  const handleFormSubmit = async () => {
    try {
      if (showUploadDialog) {
        if (!uploadFile) {
          setSnackbar({ open: true, message: 'Please select a file to upload', severity: 'error' });
          return;
        }
        
        // Simulate upload
        const newDocument: Document = {
          id: Date.now().toString(),
          title: formData.title,
          type: formData.type,
          category: formData.category,
          uploadedBy: 'Current User',
          uploadedAt: new Date().toISOString(),
          fileSize: uploadFile.size,
          fileType: uploadFile.name.split('.').pop() || 'unknown',
          url: `/documents/${uploadFile.name}`,
          tags: formData.tags,
          accessLevel: formData.accessLevel,
          expiryDate: formData.expiryDate || undefined,
          description: formData.description,
          version: 1,
          isActive: true
        };
        
        setDocuments(prev => [newDocument, ...prev]);
        setSnackbar({ open: true, message: 'Document uploaded successfully', severity: 'success' });
        setShowUploadDialog(false);
      } else if (showEditDialog && selectedDocument) {
        // Simulate update
        setDocuments(prev => prev.map(doc => 
          doc.id === selectedDocument.id 
            ? { ...doc, ...formData, version: doc.version + 1 }
            : doc
        ));
        setSnackbar({ open: true, message: 'Document updated successfully', severity: 'success' });
        setShowEditDialog(false);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Operation failed', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedDocument) {
        setDocuments(prev => prev.filter(doc => doc.id !== selectedDocument.id));
        setSnackbar({ open: true, message: 'Document deleted successfully', severity: 'success' });
        setShowDeleteDialog(false);
        setSelectedDocument(null);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete document', severity: 'error' });
    }
  };

  const handleDownload = (document: Document) => {
    // Simulate download
    setSnackbar({ open: true, message: `Downloading ${document.title}...`, severity: 'success' });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'policy': return <AssignmentIcon />;
      case 'contract': return <DocumentIcon />;
      case 'certificate': return <SecurityIcon />;
      case 'report': return <DocumentIcon />;
      case 'form': return <DocumentIcon />;
      default: return <DocumentIcon />;
    }
  };

  const getAccessColor = (level: string) => {
    switch (level) {
      case 'public': return 'success';
      case 'private': return 'warning';
      case 'restricted': return 'error';
      default: return 'default';
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in timeout={300}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Document Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleUploadClick}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              Upload Document
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DocumentIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {documents.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Documents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FolderIcon sx={{ mr: 2, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {new Set(documents.map(d => d.category)).size}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Categories
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 2, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {documents.filter(d => d.accessLevel === 'restricted').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Restricted
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 2, color: 'error.main' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expired
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
                sx={{ minWidth: 300 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value as DocumentType | 'all')}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="policy">Policy</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="certificate">Certificate</MenuItem>
                  <MenuItem value="report">Report</MenuItem>
                  <MenuItem value="form">Form</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Access Level</InputLabel>
                <Select
                  value={accessFilter}
                  label="Access Level"
                  onChange={(e) => setAccessFilter(e.target.value as 'all' | 'public' | 'private' | 'restricted')}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="restricted">Restricted</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Document Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Access Level</TableCell>
                    <TableCell>Uploaded By</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((document) => (
                      <TableRow key={document.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getDocumentIcon(document.type)}
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {document.title}
                              </Typography>
                              {document.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {document.description}
                                </Typography>
                              )}
                              <Box sx={{ mt: 0.5 }}>
                                {document.tags.map((tag, index) => (
                                  <Chip
                                    key={index}
                                    label={tag}
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={document.type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{document.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={document.accessLevel}
                            size="small"
                            color={getAccessColor(document.accessLevel) as any}
                          />
                        </TableCell>
                        <TableCell>{document.uploadedBy}</TableCell>
                        <TableCell>
                          {new Date(document.uploadedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => handleDownload(document)}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton size="small" onClick={() => handleDownload(document)}>
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditClick(document)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDeleteClick(document)}>
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
              count={filteredDocuments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>

          {/* Upload Dialog */}
          <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box sx={{ 
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.02)
                }}>
                  <input
                    accept="*/*"
                    style={{ display: 'none' }}
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      sx={{ mb: 2 }}
                    >
                      Choose File
                    </Button>
                  </label>
                  {uploadFile && (
                    <Typography variant="body2" color="text.secondary">
                      Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                    </Typography>
                  )}
                </Box>

                <TextField
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                />

                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                  >
                    <MenuItem value="policy">Policy</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="certificate">Certificate</MenuItem>
                    <MenuItem value="report">Report</MenuItem>
                    <MenuItem value="form">Form</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  fullWidth
                />

                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel>Access Level</InputLabel>
                  <Select
                    value={formData.accessLevel}
                    label="Access Level"
                    onChange={(e) => setFormData(prev => ({ ...prev, accessLevel: e.target.value as 'public' | 'private' | 'restricted' }))}
                  >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="restricted">Restricted</MenuItem>
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
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowUploadDialog(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleFormSubmit}>Upload</Button>
            </DialogActions>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                />

                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                  >
                    <MenuItem value="policy">Policy</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="certificate">Certificate</MenuItem>
                    <MenuItem value="report">Report</MenuItem>
                    <MenuItem value="form">Form</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  fullWidth
                />

                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel>Access Level</InputLabel>
                  <Select
                    value={formData.accessLevel}
                    label="Access Level"
                    onChange={(e) => setFormData(prev => ({ ...prev, accessLevel: e.target.value as 'public' | 'private' | 'restricted' }))}
                  >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="restricted">Restricted</MenuItem>
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
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleFormSubmit}>Update</Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete "{selectedDocument?.title}"? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="contained" color="error" onClick={handleDelete}>
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
            <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default DocumentManagement;