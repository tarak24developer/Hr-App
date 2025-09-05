import firebaseService from './firebaseService';
import { DocumentType } from '../types';

class DocumentService {
  private collection: string;

  constructor() {
    this.collection = 'documents';
  }

  // Get all documents
  async getDocuments(filters: any = {}) {
    try {
      const options: any = {};
      
      // Build where conditions
      const whereConditions: any[] = [];
      
      // Filter for active documents by default, but allow override
      if (filters.isActive === true) {
        whereConditions.push({ field: 'isActive', operator: '==', value: true });
      } else if (filters.isActive === false) {
        whereConditions.push({ field: 'isActive', operator: '==', value: false });
      } else if (filters.isActive === undefined && !filters.includeInactive) {
        // Default behavior: only active documents
        whereConditions.push({ field: 'isActive', operator: '==', value: true });
      }
      
      if (filters.type) {
        whereConditions.push({ field: 'type', operator: '==', value: filters.type });
      }
      
      if (filters.category) {
        whereConditions.push({ field: 'category', operator: '==', value: filters.category });
      }
      
      if (filters.accessLevel) {
        whereConditions.push({ field: 'accessLevel', operator: '==', value: filters.accessLevel });
      }

      if (filters.uploadedBy) {
        whereConditions.push({ field: 'uploadedBy', operator: '==', value: filters.uploadedBy });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      // Apply limit
      if (filters.limit) {
        options.limit = filters.limit;
      }

      // Get documents without ordering to avoid index requirement
      const result = await firebaseService.getCollection(this.collection, options);
      
      // Sort in memory if needed
      if (result.success && result.data) {
        let documents = result.data;
        
        // Apply sorting in memory
        if (filters.sortBy) {
          documents = documents.sort((a: any, b: any) => {
            const aVal = a[filters.sortBy];
            const bVal = b[filters.sortBy];
            const direction = filters.sortOrder === 'asc' ? 1 : -1;
            
            if (aVal < bVal) return -1 * direction;
            if (aVal > bVal) return 1 * direction;
            return 0;
          });
        } else {
          // Default sort by uploadedAt
          documents = documents.sort((a: any, b: any) => {
            const aDate = new Date(a.uploadedAt || 0);
            const bDate = new Date(b.uploadedAt || 0);
            return bDate.getTime() - aDate.getTime(); // Descending order
          });
        }
        
        return {
          ...result,
          data: documents
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  // Get document by ID
  async getDocument(id: string) {
    try {
      const result = await firebaseService.getDocument(this.collection, id);
      return result;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  // Create document
  async createDocument(documentData: any) {
    try {
      // Extract file from documentData if present
      const { file, ...documentFields } = documentData;
      
      // Prepare document data for Firestore
      const firestoreData: any = {
        ...documentFields,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        // Store file metadata instead of the actual file
        fileName: file?.name || '',
        fileSize: file?.size || 0,
        fileType: file?.type || ''
      };

      // Only add fileData if file exists
      if (file) {
        firestoreData.fileData = await this.fileToBase64(file);
      } else {
        firestoreData.fileData = '';
      }

      // Remove any undefined values to prevent Firebase errors
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
        }
      });

      console.log('Creating document with data:', firestoreData);
      const result = await firebaseService.addDocument(this.collection, firestoreData);
      return result;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  // Convert file to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Update document
  async updateDocument(id: string, updateData: any) {
    try {
      // Extract file from updateData if present
      const { file, ...documentFields } = updateData;
      
      // Prepare update data for Firestore
      const firestoreData: any = {
        ...documentFields,
        updatedAt: new Date().toISOString()
      };

      // Update file metadata if file is provided
      if (file) {
        firestoreData.fileName = file.name || '';
        firestoreData.fileSize = file.size || 0;
        firestoreData.fileType = file.type || '';
        firestoreData.fileData = await this.fileToBase64(file);
      }

      // Remove any undefined values to prevent Firebase errors
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
        }
      });

      console.log('Updating document with data:', firestoreData);
      const result = await firebaseService.updateDocument(this.collection, id, firestoreData);
      return result;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete document (soft delete)
  async deleteDocument(id: string) {
    try {
      console.log('Soft deleting document with ID:', id);
      const updateData = { 
        isActive: false,
        updatedAt: new Date().toISOString()
      };
      console.log('Update data for soft delete:', updateData);
      
      const result = await firebaseService.updateDocument(this.collection, id, updateData);
      console.log('Soft delete result:', result);
      return result;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Permanently delete document
  async permanentDeleteDocument(id: string) {
    try {
      const result = await firebaseService.deleteDocument(this.collection, id);
      return result;
    } catch (error) {
      console.error('Error permanently deleting document:', error);
      throw error;
    }
  }

  // Search documents
  async searchDocuments(searchTerm: string) {
    try {
      // Since Firestore doesn't support full-text search,
      // we'll implement a simple prefix search
      
      // Search by title (prefix)
      const titleResults = await firebaseService.queryDocuments(
        this.collection,
        'title',
        '>=',
        searchTerm
      );

      // Search by category (prefix)
      const categoryResults = await firebaseService.queryDocuments(
        this.collection,
        'category',
        '>=',
        searchTerm
      );

      // Combine and deduplicate results
      const allResults = [
        ...(titleResults.success ? titleResults.data || [] : []),
        ...(categoryResults.success ? categoryResults.data || [] : [])
      ];
      const uniqueResults = allResults.filter((document: any, index: number, self: any[]) => 
        index === self.findIndex((d: any) => d.id === document.id)
      );

      return uniqueResults;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  // Get documents by type
  async getDocumentsByType(type: DocumentType) {
    try {
      const result = await firebaseService.queryDocuments(
        this.collection,
        'type',
        '==',
        type
      );
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Error fetching documents by type:', error);
      throw error;
    }
  }

  // Get documents by category
  async getDocumentsByCategory(category: string) {
    try {
      const result = await firebaseService.queryDocuments(
        this.collection,
        'category',
        '==',
        category
      );
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Error fetching documents by category:', error);
      throw error;
    }
  }

  // Get document statistics
  async getDocumentStats() {
    try {
      // Get only active documents for stats (same as what's displayed on the page)
      const activeDocumentsResult = await this.getDocuments();
      if (!activeDocumentsResult.success) {
        throw new Error('Failed to fetch documents for stats');
      }
      
      const activeDocuments = activeDocumentsResult.data || [];
      
      const now = new Date();
      
      const stats = {
        total: activeDocuments.length,
        active: activeDocuments.length,
        inactive: 0, // We're only counting active documents
        expired: activeDocuments.filter((doc: any) => {
          if (!doc.expiryDate) return false;
          return new Date(doc.expiryDate) < now;
        }).length,
        types: {} as Record<string, number>,
        categories: {} as Record<string, number>,
        accessLevels: {
          public: 0,
          restricted: 0,
          confidential: 0
        }
      };

      // Count by type, category, and access level
      activeDocuments.forEach((doc: any) => {
        stats.types[doc.type] = (stats.types[doc.type] || 0) + 1;
        stats.categories[doc.category] = (stats.categories[doc.category] || 0) + 1;
        
        // Count access levels
        if (doc.accessLevel === 'public') {
          stats.accessLevels.public++;
        } else if (doc.accessLevel === 'restricted') {
          stats.accessLevels.restricted++;
        } else if (doc.accessLevel === 'confidential') {
          stats.accessLevels.confidential++;
        }
      });

      console.log('Document stats calculated:', stats);
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  }

  // Get paginated documents
  async getPaginatedDocuments(pageSize = 10, _lastDoc: any = null, filters: any = {}) {
    try {
      const options: any = {};
      
      // Build where conditions
      const whereConditions: any[] = [];
      
      if (filters.type) {
        whereConditions.push({ field: 'type', operator: '==', value: filters.type });
      }
      
      if (filters.category) {
        whereConditions.push({ field: 'category', operator: '==', value: filters.category });
      }
      
      if (filters.accessLevel) {
        whereConditions.push({ field: 'accessLevel', operator: '==', value: filters.accessLevel });
      }

      if (filters.isActive !== undefined) {
        whereConditions.push({ field: 'isActive', operator: '==', value: filters.isActive });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      // Apply ordering
      options.orderBy = [{ field: 'uploadedAt', direction: 'desc' }];

      // Apply limit
      options.limit = pageSize;

      const result = await firebaseService.getCollection(this.collection, options);
      return result;
    } catch (error) {
      console.error('Error fetching paginated documents:', error);
      throw error;
    }
  }

  // Get categories (unique values)
  async getCategories() {
    try {
      const documentsResult = await this.getDocuments();
      if (!documentsResult.success) {
        console.warn('Failed to fetch documents for categories, returning empty array');
        return [];
      }
      
      const documents = documentsResult.data || [];
      const categories = [...new Set(documents.map((doc: any) => doc.category))];
      return categories.filter(cat => cat && cat.trim() !== '').sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // Get document types (unique values)
  async getDocumentTypes() {
    try {
      const documentsResult = await this.getDocuments();
      if (!documentsResult.success) {
        console.warn('Failed to fetch documents for types, returning default types');
        return ['policy', 'contract', 'certificate', 'report', 'form', 'other'];
      }
      
      const documents = documentsResult.data || [];
      const types = [...new Set(documents.map((doc: any) => doc.type))];
      const filteredTypes = types.filter(type => type && type.trim() !== '');
      
      // Ensure we always have the basic types
      const defaultTypes = ['policy', 'contract', 'certificate', 'report', 'form', 'other'];
      const allTypes = [...new Set([...filteredTypes, ...defaultTypes])];
      
      return allTypes.sort();
    } catch (error) {
      console.error('Error fetching document types:', error);
      // Return default types instead of throwing to prevent UI crashes
      return ['policy', 'contract', 'certificate', 'report', 'form', 'other'];
    }
  }

  // Get expired documents
  async getExpiredDocuments() {
    try {
      const allDocumentsResult = await this.getDocuments();
      if (!allDocumentsResult.success) {
        return [];
      }
      
      const documents = allDocumentsResult.data || [];
      const now = new Date();
      
      return documents.filter((doc: any) => 
        doc.expiryDate && 
        new Date(doc.expiryDate) < now &&
        doc.isActive !== false
      );
    } catch (error) {
      console.error('Error fetching expired documents:', error);
      return [];
    }
  }

  // Update document access level
  async updateDocumentAccessLevel(id: string, accessLevel: 'public' | 'private' | 'restricted') {
    try {
      const result = await firebaseService.updateDocument(this.collection, id, { 
        accessLevel,
        updatedAt: new Date().toISOString()
      });
      return result;
    } catch (error) {
      console.error('Error updating document access level:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const documentService = new DocumentService();
export default documentService;
