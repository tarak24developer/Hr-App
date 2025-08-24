import { useState, useEffect, useCallback } from 'react';
import dataService from '../services/dataService';
import React from 'react'; // Added missing import for React

export const useDataService = (endpoint, options = {}) => {
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
  const cleanFilters = React.useMemo(() => {
    if (!filters || typeof filters !== 'object') {
      return {};
    }
    
    const cleaned = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [source, setSource] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await dataService.fetchData(endpoint, {
        filters: cleanFilters,
        orderBy,
        limit
      });

      if (result.success) {
        setData(result.data);
        setSource(result.source);
        setMessage(result.message || '');
        
        if (onSuccess) {
          onSuccess(result.data, result.source);
        }
      } else {
        setError(result.error);
        setData([]);
        
        if (onError) {
          onError(result.error);
        }
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch data';
      setError(errorMessage);
      setData([]);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, cleanFilters, orderBy, limit, onSuccess, onError, ...dependencies]);

  const createItem = useCallback(async (itemData) => {
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
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetchData]);

  const updateItem = useCallback(async (itemId, updateData) => {
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
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [endpoint, fetchData]);

  const deleteItem = useCallback(async (itemId) => {
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
      return { success: false, error: err.message };
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
export const useEmployees = (filters = {}) => {
  // Ensure filters are valid objects
  const validFilters = React.useMemo(() => {
    if (!filters || typeof filters !== 'object') return {};
    const cleaned = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);
  
  return useDataService('/employees', { filters: validFilters });
};

export const useDepartments = () => {
  return useDataService('/departments');
};

export const useUsers = () => {
  return useDataService('/users');
};

export const useAttendance = (filters = {}) => {
  // Ensure filters are valid objects
  const validFilters = React.useMemo(() => {
    if (!filters || typeof filters !== 'object') return {};
    const cleaned = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);
  
  return useDataService('/attendance', { filters: validFilters });
};

export const useLeaves = (filters = {}) => {
  // Ensure filters are valid objects
  const validFilters = React.useMemo(() => {
    if (!filters || typeof filters !== 'object') return {};
    const cleaned = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);
  
  return useDataService('/leaves', { filters: validFilters });
};

export const useAssets = () => {
  return useDataService('/assets');
};

export const useInventory = () => {
  return useDataService('/inventory');
};

export const useTraining = () => {
  return useDataService('/training');
};

export const useIncidents = () => {
  return useDataService('/incidents');
};

export const useExpenses = () => {
  return useDataService('/expense-management');
};

export const useHolidays = () => {
  return useDataService('/holidays');
};

export const useAnnouncements = () => {
  return useDataService('/announcements');
};

export const useDocuments = (filters = {}) => {
  // Ensure filters are valid objects
  const validFilters = React.useMemo(() => {
    if (!filters || typeof filters !== 'object') return {};
    const cleaned = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }, [filters]);
  
  return useDataService('/documents', { filters: validFilters });
};

export const usePermissions = () => {
  return useDataService('/access-control/permissions');
};

export const useRoleTemplates = () => {
  return useDataService('/access-control/role-templates');
};

export const usePerformanceOverview = (period = 'month', department = 'all') => {
  // Ensure parameters are valid
  const validPeriod = period && typeof period === 'string' ? period : 'month';
  const validDepartment = department && typeof department === 'string' ? department : 'all';
  
  return useDataService(`/performance/overview?period=${validPeriod}&department=${validDepartment}`);
};

export const usePerformanceTrends = (period = 'month', months = 6) => {
  // Ensure parameters are valid
  const validPeriod = period && typeof period === 'string' ? period : 'month';
  const validMonths = typeof months === 'number' && months > 0 ? months : 6;
  
  return useDataService(`/performance/trends?period=${validPeriod}&months=${validMonths}`);
};

export const usePerformanceStats = (period = 'month') => {
  // Ensure parameter is valid
  const validPeriod = period && typeof period === 'string' ? period : 'month';
  
  return useDataService(`/performance/stats?period=${validPeriod}`);
};

export const useGoals = () => {
  return useDataService('/performance/goals');
};

export const useKPIs = () => {
  return useDataService('/performance/kpis');
};
