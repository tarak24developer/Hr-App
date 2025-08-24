import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import firebaseService from '@/services/firebaseService';
import type { ApiResponse } from '@/types';

interface UseDataServiceOptions<T> {
  collectionName: string;
  docId?: string;
  queryKey?: string[];
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

interface UseDataServiceReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  create: (data: Omit<T, 'id'>) => Promise<ApiResponse<T>>;
  update: (data: Partial<T>) => Promise<ApiResponse<T>>;
  remove: () => Promise<ApiResponse<boolean>>;
}

export function useDataService<T = any>({
  collectionName,
  docId,
  queryKey = [collectionName],
  enabled = true,
  onSuccess,
  onError
}: UseDataServiceOptions<T>): UseDataServiceReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query key for React Query
  const fullQueryKey = docId ? [...queryKey, docId] : queryKey;

  // Fetch data
  const {
    data: queryData,
    isLoading: queryLoading,
    error: queryError,
    refetch: queryRefetch
  } = useQuery({
    queryKey: fullQueryKey,
    queryFn: async () => {
      if (docId) {
        const result = await firebaseService.getDocument<T>(collectionName, docId);
        if (result.success && result.data) {
          return result.data;
        }
        throw new Error(result.error || 'Failed to fetch document');
      } else {
        const result = await firebaseService.getCollection<T>(collectionName);
        if (result.success && result.data) {
          return result.data;
        }
        throw new Error(result.error || 'Failed to fetch collection');
      }
    },
    enabled: enabled && !!collectionName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update local state when query data changes
  useEffect(() => {
    if (queryData) {
      setData(queryData);
      setError(null);
      onSuccess?.(queryData);
    }
  }, [queryData, onSuccess]);

  // Update error state
  useEffect(() => {
    if (queryError) {
      const errorMessage = queryError instanceof Error ? queryError.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [queryError, onError]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newData: Omit<T, 'id'>) => {
      const result = await firebaseService.addDocument<T>(collectionName, newData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create document');
      }
      return result;
    },
    onSuccess: (result) => {
      if (result.data) {
        setData(result.data);
        setError(null);
        // Invalidate and refetch queries
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.(result.data);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
      onError?.(error.message);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: Partial<T>) => {
      if (!docId) {
        throw new Error('Document ID is required for updates');
      }
      const result = await firebaseService.updateDocument<T>(collectionName, docId, updateData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update document');
      }
      return result;
    },
    onSuccess: (result) => {
      if (result.data) {
        setData(result.data);
        setError(null);
        // Invalidate and refetch queries
        queryClient.invalidateQueries({ queryKey });
        onSuccess?.(result.data);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
      onError?.(error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!docId) {
        throw new Error('Document ID is required for deletion');
      }
      const result = await firebaseService.deleteDocument(collectionName, docId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document');
      }
      return result;
    },
    onSuccess: () => {
      setData(null);
      setError(null);
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      setError(error.message);
      onError?.(error.message);
    }
  });

  // Wrapper functions
  const create = useCallback(async (newData: Omit<T, 'id'>) => {
    setLoading(true);
    try {
      const result = await createMutation.mutateAsync(newData);
      return result;
    } finally {
      setLoading(false);
    }
  }, [createMutation]);

  const update = useCallback(async (updateData: Partial<T>) => {
    setLoading(true);
    try {
      const result = await updateMutation.mutateAsync(updateData);
      return result;
    } finally {
      setLoading(false);
    }
  }, [updateMutation]);

  const remove = useCallback(async () => {
    setLoading(true);
    try {
      const result = await deleteMutation.mutateAsync();
      return result;
    } finally {
      setLoading(false);
    }
  }, [deleteMutation]);

  const refetch = useCallback(() => {
    queryRefetch();
  }, [queryRefetch]);

  return {
    data,
    loading: loading || queryLoading,
    error,
    refetch,
    create,
    update,
    remove
  };
}
