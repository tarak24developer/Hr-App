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
  Fade,
  TablePagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Description as DocumentIcon,
  Folder as FolderIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudUploadIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import firebaseService from '../services/firebaseService';

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



const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'public' | 'private' | 'restricted'>('all');
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
  const [processing, setProcessing] = useState(false);



  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await firebaseService.getCollection('documents');
      
      if (result?.success && result.data) {
        // Transform Firebase data to match Document interface
        const transformedDocuments: Document[] = result.data.map((doc: any) => ({
          id: doc.id,
          title: doc.title || '',
          type: doc.type || 'other',
          category: doc.category || '',
          uploadedBy: doc.uploadedBy || doc.uploadedBy || 'Unknown',
          uploadedAt: doc.uploadedAt || doc.createdAt || new Date().toISOString(),
          fileSize: doc.fileSize || 0,
          fileType: doc.fileType || doc.fileExtension || 'unknown',
          url: doc.url || doc.downloadUrl || '',
          tags: doc.tags || [],
          accessLevel: doc.accessLevel || 'private',
          expiryDate: doc.expiryDate || undefined,
          description: doc.description || '',
          version: doc.version || 1,
          isActive: doc.isActive !== false
        }));
        
        setDocuments(transformedDocuments);
      } else {
        setDocuments([]);
      }
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesAccess = accessFilter === 'all' || doc.accessLevel === accessFilter;
    return matchesSearch && matchesType && matchesAccess;
  });



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
        const fileName = file.name.split('.')[0];
        setFormData(prev => ({ ...prev, title: fileName || 'Untitled Document' }));
      }
    }
  };

  const handleFormSubmit = async () => {
    try {
      setProcessing(true);
      
      if (showUploadDialog) {
        if (!uploadFile) {
          setSnackbar({ open: true, message: 'Please select a file to upload', severity: 'error' });
          return;
        }
        
        const documentData = {
          title: formData.title,
          type: formData.type,
          category: formData.category,
          uploadedBy: 'Current User', // TODO: Get from auth context
          uploadedAt: new Date().toISOString(),
          fileSize: uploadFile.size,
          fileType: uploadFile.name.split('.').pop() || 'unknown',
          url: `/documents/${uploadFile.name}`, // TODO: Implement actual file upload
          tags: formData.tags,
          accessLevel: formData.accessLevel,
          expiryDate: formData.expiryDate || undefined,
          description: formData.description,
          version: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const result = await firebaseService.addDocument('documents', documentData);
        
        if (result?.success) {
        setSnackbar({ open: true, message: 'Document uploaded successfully', severity: 'success' });
        setShowUploadDialog(false);
          loadDocuments(); // Reload documents from Firebase
        } else {
          throw new Error(result?.error || 'Failed to upload document');
        }
      } else if (showEditDialog && selectedDocument) {
        const documentData = {
          title: formData.title,
          type: formData.type,
          category: formData.category,
          tags: formData.tags,
          accessLevel: formData.accessLevel,
          expiryDate: formData.expiryDate || undefined,
          description: formData.description,
          version: selectedDocument.version + 1,
          updatedAt: new Date().toISOString()
        };
        
        const result = await firebaseService.updateDocument('documents', selectedDocument.id, documentData);
        
        if (result?.success) {
        setSnackbar({ open: true, message: 'Document updated successfully', severity: 'success' });
        setShowEditDialog(false);
          loadDocuments(); // Reload documents from Firebase
        } else {
          throw new Error(result?.error || 'Failed to update document');
        }
      }
    } catch (err: any) {
      console.error('Error in form submission:', err);
      setSnackbar({ open: true, message: err.message || 'Operation failed', severity: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedDocument) {
        const result = await firebaseService.deleteDocument('documents', selectedDocument.id);
        
        if (result?.success) {
        setSnackbar({ open: true, message: 'Document deleted successfully', severity: 'success' });
        setShowDeleteDialog(false);
        setSelectedDocument(null);
          loadDocuments(); // Reload documents from Firebase
        } else {
          throw new Error(result?.error || 'Failed to delete document');
        }
      }
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to delete document', severity: 'error' });
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
            Loading Documents...
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
              Document Management
            </Typography>
              <Typography variant="body1" color="textSecondary">
                Manage and organize your documents securely
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleUploadClick}
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
              Upload Document
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
                      Total Documents
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
                      {documents.length}
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
                    <DocumentIcon sx={{ fontSize: 24 }} />
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
                      Categories
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
                      {new Set(documents.map(d => d.category)).size}
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
                    <FolderIcon sx={{ fontSize: 24 }} />
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
                      Restricted
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
                      {documents.filter(d => d.accessLevel === 'restricted').length}
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
                    <SecurityIcon sx={{ fontSize: 24 }} />
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
                      Expired
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
                      {documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length}
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
                    <ScheduleIcon sx={{ fontSize: 24 }} />
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
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value as DocumentType | 'all')}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
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

                <FormControl size="medium">
                <InputLabel>Access Level</InputLabel>
                <Select
                  value={accessFilter}
                  label="Access Level"
                  onChange={(e) => setAccessFilter(e.target.value as 'all' | 'public' | 'private' | 'restricted')}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300'
                      }
                    }}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="restricted">Restricted</MenuItem>
                </Select>
              </FormControl>
            </Box>
            </CardContent>
          </Card>

          {/* Document Table */}
          <Card sx={{ 
            bgcolor: 'white', 
            boxShadow: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Document</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Access Level</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Uploaded By</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Upload Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Size</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocuments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((document) => (
                      <TableRow 
                        key={document.id} 
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
                              <IconButton 
                                size="small" 
                                onClick={() => handleDownload(document)}
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
                            <Tooltip title="Download">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDownload(document)}
                                sx={{ 
                                  color: 'success.main',
                                  '&:hover': { 
                                    bgcolor: 'success.50',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditClick(document)}
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
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteClick(document)}
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
              count={filteredDocuments.length}
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

          {/* Upload Dialog */}
          <Dialog 
            open={showUploadDialog} 
            onClose={() => setShowUploadDialog(false)} 
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
              bgcolor: 'primary.main', 
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              Upload Document
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box sx={{ 
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'primary.50'
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
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={() => setShowUploadDialog(false)}
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
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleFormSubmit}
                disabled={processing || !uploadFile || !formData.title}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: '600',
                  bgcolor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease',
                  '&:disabled': {
                    bgcolor: 'grey.400',
                    boxShadow: 'none'
                  }
                }}
              >
                {processing ? <CircularProgress size={20} /> : 'Upload'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog 
            open={showEditDialog} 
            onClose={() => setShowEditDialog(false)} 
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
              bgcolor: 'primary.main', 
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              Edit Document
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
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
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={() => setShowEditDialog(false)}
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
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleFormSubmit}
                disabled={processing || !formData.title}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: '600',
                  bgcolor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                  },
                  transition: 'all 0.3s ease',
                  '&:disabled': {
                    bgcolor: 'grey.400',
                    boxShadow: 'none'
                  }
                }}
              >
                {processing ? <CircularProgress size={20} /> : 'Update'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog 
            open={showDeleteDialog} 
            onClose={() => setShowDeleteDialog(false)}
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
              bgcolor: 'error.main', 
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              Delete Document
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                Are you sure you want to delete <strong>&quot;{selectedDocument?.title}&quot;</strong>? 
                <br />
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  This action cannot be undone.
                </Typography>
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={() => setShowDeleteDialog(false)}
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
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDelete}
                sx={{ 
                  px: 3, 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(211, 47, 47, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
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
    </Box>
  );
};

export default DocumentManagement;