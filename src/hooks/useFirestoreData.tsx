import { useState, useEffect, useCallback } from 'react';
import firebaseService from '../services/firebaseService';

interface UseFirestoreDataOptions {
  filters?: any[];
  orderBy?: any;
  limit?: number | null;
  autoFetch?: boolean;
  onSuccess?: ((data: any) => void) | null;
  onError?: ((error: any) => void) | null;
}

interface UseFirestoreDataReturn {
  data: any[];
  loading: boolean;
  error: string | null;
  message: string;
  fetchData: () => Promise<void>;
  updateDocument: (updateData: any) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
  addItem: (itemData: any) => Promise<{ success: boolean; data?: any; error?: string | undefined }>;
  updateItem: (itemId: string, updateData: any) => Promise<{ success: boolean; data?: any; error?: string | undefined }>;
  deleteItem: (itemId: string) => Promise<{ success: boolean; error?: string | undefined }>;
}

// Custom hook for fetching Firestore data with fallback
export const useFirestoreData = (collectionName: string, options: UseFirestoreDataOptions = {}): UseFirestoreDataReturn => {
  const {
    filters = [],
    orderBy = null,
    limit = null,
    autoFetch = true,
    onSuccess = null,
    onError = null
  } = options;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage('');

      console.log(`Fetching ${collectionName} from Firebase...`);
      const result = await firebaseService.getCollection(collectionName, {
        where: filters,
        orderBy: orderBy,
        limit: limit
      });

      if (result.success) {
        setData(result.data || []);
        setMessage(result.message || '');
        
        if (onSuccess) {
          onSuccess(result.data);
        }
        
        console.log(`✅ ${collectionName} loaded:`, result.data.length, 'items');
      } else {
        setError(result.error || 'Failed to fetch data');
        setData([]);
        
        if (onError) {
          onError(result.error);
        }
        
        console.error(`❌ Failed to fetch ${collectionName}:`, result.error);
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'An unexpected error occurred';
      setError(errorMessage);
      setData([]);
      
      if (onError) {
        onError(errorMessage);
      }
      
      console.error(`❌ Error fetching ${collectionName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [collectionName, filters, orderBy, limit, onSuccess, onError]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const addItem = useCallback(async (itemData: any) => {
    try {
      const result = await firebaseService.addDocument(collectionName, itemData);
      
      if (result.success) {
        // Refresh the data
        await fetchData();
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error(`Error adding item to ${collectionName}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }, [collectionName, fetchData]);

  const updateItem = useCallback(async (itemId: string, updateData: any) => {
    try {
      const result = await firebaseService.updateDocument(collectionName, itemId, updateData);
      
      if (result.success) {
        // Refresh the data
        await fetchData();
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error(`Error updating item in ${collectionName}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }, [collectionName, fetchData]);

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      const result = await firebaseService.deleteDocument(collectionName, itemId);
      
      if (result.success) {
        // Refresh the data
        await fetchData();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error(`Error deleting item from ${collectionName}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }, [collectionName, fetchData]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    data,
    loading,
    error,
    message,
    fetchData,
    updateDocument: async () => ({ success: false, error: 'Not implemented' }),
    refresh,
    addItem,
    updateItem,
    deleteItem
  };
};

// Hook for fetching a single document
export const useFirestoreDocument = (collectionName: string, documentId: string, options: any = {}) => {
  const { autoFetch = true, onSuccess = null, onError = null } = options;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await firebaseService.getDocument(collectionName, documentId);

      if (result.success) {
        setData(result.data);
        
        if (onSuccess) {
          onSuccess(result.data);
        }
        
        console.log(`✅ Document ${documentId} loaded from ${collectionName}`);
      } else {
        setError(result.error || 'Document not found');
        setData(null);
        
        if (onError) {
          onError(result.error);
        }
        
        console.error(`❌ Failed to fetch document ${documentId}:`, result.error);
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'An unexpected error occurred';
      setError(errorMessage);
      setData(null);
      
      if (onError) {
        onError(errorMessage);
      }
      
      console.error(`❌ Error fetching document ${documentId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [collectionName, documentId, onSuccess, onError]);

  const updateDocument = useCallback(async (updateData: any) => {
    try {
      const result = await firebaseService.updateDocument(collectionName, documentId, updateData);
      
      if (result.success) {
        // Refresh the document
        await fetchDocument();
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error(`Error updating document ${documentId}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }, [collectionName, documentId, fetchDocument]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchDocument();
    }
  }, [autoFetch, fetchDocument]);

  return {
    data,
    loading,
    error,
    fetchDocument,
    updateDocument
  };
};

export default {
  useFirestoreData,
  useFirestoreDocument
};
