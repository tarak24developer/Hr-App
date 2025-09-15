import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Upload,
  FileText,
  Shield,
  Clock,
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import documentService from '../services/documentService';
import { Document } from '../types';
import { showNotification } from '../utils/notification';
import DashboardCard from '../components/DashboardCard';

const DocumentManagement: React.FC = () => {
  // State management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccessLevel, setFilterAccessLevel] = useState('');
  const [sortBy] = useState('uploadedAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCache, setFileCache] = useState<Map<string, File>>(new Map());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
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
        const documentsArray = Array.isArray(result.data) ? result.data as Document[] : [];
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
        setFormData((prev: any) => ({ ...prev, type: typeMap[extension] }));
      }
    }
  };

  // Form submission
  const handleFormSubmit = async () => {
    // Only require file for new documents, not for updates
    if (!editingDocument && !selectedFile) {
      showNotification('Please select a file to upload', 'error');
      return;
    }

    if (!formData.title.trim()) {
      showNotification('Please enter a title', 'error');
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
          showNotification('Document updated successfully!', 'success');
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
        
        if (result.success && result.data?.['id']) {
          // Cache the file for download
          if (selectedFile) {
            setFileCache(prev => new Map(prev).set(result.data!['id'], selectedFile));
          }
          showNotification('Document uploaded successfully!', 'success');
          loadDocuments();
          loadStats();
          handleCloseUploadDialog();
        } else {
          throw new Error(result.message || 'Failed to upload document');
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to process document', 'error');
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
        showNotification(`Downloaded ${doc.title}`, 'success');
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
        showNotification(`Downloaded ${doc.title}`, 'success');
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
        showNotification(`Downloaded ${doc.title} information`, 'info');
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      showNotification('Failed to download document', 'error');
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
        showNotification(`Document "${documentToDelete.title}" permanently deleted`, 'success');

        // Reload both documents and stats
        console.log('Reloading documents and stats...');
        await Promise.all([loadDocuments(), loadStats()]);
      } else {
        throw new Error(result.message || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to delete document', 'error');
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
                {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Upload, organize, and manage your documents</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
          onClick={() => setUploadDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
          {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
          )}

          {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          name="Total Documents"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <DashboardCard
          name="Active Documents"
          value={stats.active}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          name="Restricted Access"
          value={stats.restricted}
          icon={Shield}
          color="yellow"
        />
        <DashboardCard
          name="Expired Documents"
          value={stats.expired}
          icon={Clock}
          color="red"
        />
      </div>

      {/* Search and Filters */}
      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="PDF">PDF</option>
                  <option value="Word Document">Word Document</option>
                  <option value="Excel Spreadsheet">Excel Spreadsheet</option>
                  <option value="PowerPoint Presentation">PowerPoint Presentation</option>
                  <option value="Image">Image</option>
                  <option value="Text Document">Text Document</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="HR Policies">HR Policies</option>
                  <option value="Training Materials">Training Materials</option>
                  <option value="Forms">Forms</option>
                  <option value="Reports">Reports</option>
                  <option value="Legal">Legal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                <select
              value={filterAccessLevel}
              onChange={(e) => setFilterAccessLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="public">Public</option>
                  <option value="restricted">Restricted</option>
                  <option value="confidential">Confidential</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                        {doc.title}
                          </div>
                      {doc.description && (
                            <div className="text-sm text-gray-500">{doc.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                        doc.accessLevel === 'public' ? 'bg-green-100 text-green-800' : 
                        doc.accessLevel === 'restricted' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      )}>
                        {doc.accessLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(doc.uploadedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                      {doc.expiryDate ? formatDate(doc.expiryDate) : 'No expiry'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(doc)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(doc)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredDocuments.length === 0 && documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500">Try adjusting your search or filter parameters</p>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Documents Yet</h3>
          <p className="text-gray-500 mb-6">Start by uploading your first document to get started with document management</p>
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Document</span>
          </button>
        </div>
      )}

        {/* Pagination */}
      {filteredDocuments.length > rowsPerPage && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg",
                  pageNum === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                )}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Upload/Edit Dialog */}
      {uploadDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseUploadDialog}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>{editingDocument ? 'Edit Document' : 'Upload New Document'}</span>
              </h3>
              <button
                onClick={handleCloseUploadDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                  <input
                    type="text"
                  value={formData.title}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                    value={formData.type}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PDF">PDF</option>
                      <option value="Word Document">Word Document</option>
                      <option value="Excel Spreadsheet">Excel Spreadsheet</option>
                      <option value="PowerPoint Presentation">PowerPoint Presentation</option>
                      <option value="Image">Image</option>
                      <option value="Text Document">Text Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                  value={formData.category}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="HR Policies">HR Policies</option>
                      <option value="Training Materials">Training Materials</option>
                      <option value="Forms">Forms</option>
                      <option value="Reports">Reports</option>
                      <option value="Legal">Legal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                  value={formData.description}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                    <select
                    value={formData.accessLevel}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, accessLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="public">Public</option>
                      <option value="restricted">Restricted</option>
                      <option value="confidential">Confidential</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                  type="date"
                  value={formData.expiryDate}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, expiryDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>{selectedFile ? selectedFile.name : editingDocument ? 'Select New File (optional)' : 'Select File'}</span>
                <input
                            id="file-upload"
                            name="file-upload"
                  type="file"
                            className="sr-only"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PDF, DOC, XLS, PPT, JPG, PNG, TXT up to 10MB</p>
                    </div>
                  </div>
              {editingDocument && !selectedFile && (
                    <p className="mt-1 text-sm text-gray-500 text-center">
                  Current file will be kept if no new file is selected
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCloseUploadDialog}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
            onClick={handleFormSubmit} 
            disabled={(!editingDocument && !selectedFile) || !formData.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingDocument ? 'Update Document' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}

                {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancelDelete}></div>
          <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <span>Permanently Delete Document</span>
              </h3>
              <button
                onClick={handleCancelDelete}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to permanently delete <strong>"{documentToDelete.title}"</strong>? 
            This action will remove the document from the database completely and cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      );
    };

    export default DocumentManagement;