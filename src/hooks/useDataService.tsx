import { useState, useEffect, useCallback, useMemo } from 'react';
import dataService from '../services/dataService';

// Type definitions
interface DataServiceOptions {
  autoFetch?: boolean;
  filters?: Record<string, any>;
  orderBy?: string | null;
  limit?: number | null;
  onSuccess?: (data: any[], source: string) => void;
  onError?: (error: string) => void;
  dependencies?: any[];
}

interface DataServiceResult {
  data: any[];
  loading: boolean;
  error: string | null;
  message: string;
  source: string;
  fetchData: () => Promise<void>;
  createItem: (itemData: any) => Promise<{ success: boolean; data?: any; error?: string | undefined }>;
  updateItem: (itemId: string | number, updateData: any) => Promise<{ success: boolean; data?: any; error?: string | undefined }>;
  deleteItem: (itemId: string | number) => Promise<{ success: boolean; data?: any; error?: string | undefined }>;
  refresh: () => void;
}

export const useDataService = (endpoint: string, options: DataServiceOptions = {}): DataServiceResult => {
  // Validate endpoint
  if (!endpoint || typeof endpoint !== 'string') {
    console.error('Invalid endpoint provided to useDataService:', endpoint);
    endpoint = '/users'; // Default fallback
  }
  
  // Ensure endpoint starts with a slash
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  
  const {
    autoFetch = true,
    filters = {},
    orderBy = null,
    limit = null,
    onSuccess = null,
    onError = null,
    dependencies = []
  } = options;

  // Validate and clean filters
  const cleanFilters = useMemo(() => {
    if (!filters || typeof filters !== 'object') {
      return {};
    }
    
    const cleaned: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [source, setSource] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dataService.fetchData(endpoint, {
        filters: cleanFilters,
        orderBy: orderBy ? [{ field: orderBy, direction: 'asc' as const }] : null,
        limit
      });

      if (result.success) {
        setData(result.data || []);
        setSource(result.source || '');
        setMessage(result.message || '');
        
        if (onSuccess) {
          onSuccess(result.data || [], result.source || '');
        }
      } else {
        setError(result.error || 'Unknown error');
        setData([]);
        
        if (onError) {
          onError(result.error || 'Unknown error');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      setData([]);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, cleanFilters, orderBy, limit, onSuccess, onError, ...dependencies]);

  const createItem = useCallback(async (itemData: any) => {
    try {
      setLoading(true);
      const result = await dataService.create(endpoint, itemData);
      
      if (result.success) {
        // Refresh data after successful creation
        await fetchData();
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetchData]);

  const updateItem = useCallback(async (itemId: string | number, updateData: any) => {
    try {
      setLoading(true);
      const updateEndpoint = `${endpoint}/${itemId}`;
      const result = await dataService.update(updateEndpoint, updateData);
      
      if (result.success) {
        // Refresh data after successful update
        await fetchData();
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetchData]);

  const deleteItem = useCallback(async (itemId: string | number) => {
    try {
      setLoading(true);
      const deleteEndpoint = `${endpoint}/${itemId}`;
      const result = await dataService.delete(deleteEndpoint);
      
      if (result.success) {
        // Refresh data after successful deletion
        await fetchData();
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

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
    source,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    refresh
  };
};

// Specialized hooks for common data types
export const useEmployees = (filters: Record<string, any> = {}): DataServiceResult => {
  // Ensure filters are valid objects
  const validFilters = useMemo(() => {
    if (!filters || typeof filters !== 'object') return {};
    const cleaned: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);
  
  return useDataService('/employees', { filters: validFilters });
};

export const useDepartments = (): DataServiceResult => {
  return useDataService('/departments');
};

export const useUsers = (): DataServiceResult => {
  return useDataService('/users');
};

export const useAttendance = (filters: Record<string, any> = {}): DataServiceResult => {
  // Ensure filters are valid objects
  const validFilters = useMemo(() => {
    if (!filters || typeof filters !== 'object') return {};
    const cleaned: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);
  
  return useDataService('/attendance', { filters: validFilters });
};

export const useLeaves = (filters: Record<string, any> = {}): DataServiceResult => {
  // Ensure filters are valid objects
  const validFilters = useMemo(() => {
    if (!filters || typeof filters !== 'object') return {};
    const cleaned: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);
  
  return useDataService('/leaves', { filters: validFilters });
};

export const useAssets = (): DataServiceResult => {
  return useDataService('/assets');
};

export const useInventory = (): DataServiceResult => {
  return useDataService('/inventory');
};

export const useTraining = (): DataServiceResult => {
  return useDataService('/training');
};

export const useIncidents = (): DataServiceResult => {
  return useDataService('/incidents');
};

export const useExpenses = (): DataServiceResult => {
  return useDataService('/expense-management');
};

export const useHolidays = (): DataServiceResult => {
  return useDataService('/holidays');
};

export const useAnnouncements = (): DataServiceResult => {
  return useDataService('/announcements');
};

export const useDocuments = (filters: Record<string, any> = {}): DataServiceResult => {
  // Ensure filters are valid objects
  const validFilters = useMemo(() => {
    if (!filters || typeof filters !== 'object') return {};
    const cleaned: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);
  
  return useDataService('/documents', { filters: validFilters });
};

export const usePermissions = (): DataServiceResult => {
  return useDataService('/access-control/permissions');
};

export const useRoleTemplates = (): DataServiceResult => {
  return useDataService('/access-control/role-templates');
};

export const usePerformanceOverview = (period: string = 'month', department: string = 'all'): DataServiceResult => {
  // Ensure parameters are valid
  const validPeriod = period && typeof period === 'string' ? period : 'month';
  const validDepartment = department && typeof department === 'string' ? department : 'all';
  
  return useDataService(`/performance/overview?period=${validPeriod}&department=${validDepartment}`);
};

export const usePerformanceTrends = (period: string = 'month', months: number = 6): DataServiceResult => {
  // Ensure parameters are valid
  const validPeriod = period && typeof period === 'string' ? period : 'month';
  const validMonths = typeof months === 'number' && months > 0 ? months : 6;
  
  return useDataService(`/performance/trends?period=${validPeriod}&months=${validMonths}`);
};

export const usePerformanceStats = (period: string = 'month'): DataServiceResult => {
  // Ensure parameter is valid
  const validPeriod = period && typeof period === 'string' ? period : 'month';
  
  return useDataService(`/performance/stats?period=${validPeriod}`);
};

export const useGoals = (): DataServiceResult => {
  return useDataService('/performance/goals');
};

export const useKPIs = (): DataServiceResult => {
  return useDataService('/performance/kpis');
};
