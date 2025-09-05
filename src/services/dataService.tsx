import firebaseService from './firebaseService';
import { getSampleData } from './dataInitializationService';

interface DataServiceOptions {
  filters?: Record<string, any>;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[] | null;
  limit?: number | null;
}

class DataService {
  constructor() {
    // Always use Firestore
  }

  // Generic data fetching - now only uses Firestore
  async fetchData(endpoint: string, options: DataServiceOptions = {}) {
    try {
      // Always use Firestore
      return this.fetchFromFirestore(endpoint, options);
    } catch (error) {
      console.error(`Unexpected error in fetchData for ${endpoint}:`, error);
      return { 
        success: false, 
        error: (error as Error).message, 
        source: 'error' 
      };
    }
  }

  // Convert object filters to Firestore array format
  convertFiltersToFirestoreFormat(filters: Record<string, any>): Array<{field: string; operator: string; value: any}> {
    if (!filters || typeof filters !== 'object') {
      return [];
    }
    
    const firestoreFilters: Array<{field: string; operator: string; value: any}> = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      // Skip undefined, null, or empty string values
      if (value !== undefined && value !== null && value !== '') {
        // Handle different filter types
        if (typeof value === 'string' && value.trim() !== '') {
          firestoreFilters.push({
            field: key,
            operator: '==',
            value: value.trim()
          });
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          firestoreFilters.push({
            field: key,
            operator: '==',
            value: value
          });
        } else if (Array.isArray(value) && value.length > 0) {
          // Handle array values (e.g., for 'in' operator)
          firestoreFilters.push({
            field: key,
            operator: 'in',
            value: value
          });
        }
      }
    });
    
    return firestoreFilters;
  }

  // Fetch data from Firestore based on endpoint
  async fetchFromFirestore(endpoint: string, options: DataServiceOptions = {}) {
    try {
      const collectionName = this.getCollectionNameFromEndpoint(endpoint);
      const sampleData = getSampleData(collectionName) || [];
      
      // Ensure sampleData is an array
      if (!Array.isArray(sampleData)) {
        console.warn(`Sample data for ${collectionName} is not an array:`, sampleData);
        return { 
          success: true, 
          data: [], 
          source: 'firestore',
          message: 'No sample data available' 
        };
      }
      
      // Convert filters to Firestore format
      const firestoreFilters = this.convertFiltersToFirestoreFormat(options.filters || {});
      
      console.log(`Fetching from Firestore: ${collectionName}`, {
        endpoint,
        originalFilters: options.filters,
        convertedFilters: firestoreFilters,
        orderBy: options.orderBy,
        limit: options.limit,
        sampleDataLength: sampleData.length
      });
      
      const queryOptions: any = {
        where: firestoreFilters
      };
      
      if (options.orderBy) {
        queryOptions.orderBy = options.orderBy;
      }
      
      if (options.limit) {
        queryOptions.limit = options.limit;
      }
      
      const result = await firebaseService.getCollection(collectionName, queryOptions);

      return { 
        success: true, 
        data: result.data, 
        source: 'firestore',
        message: result.message 
      };
    } catch (error) {
      console.error(`Firestore fallback failed for ${endpoint}:`, error);
      
      // Log additional context for debugging
      console.error('Error context:', {
        endpoint,
        options,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack
      });
      
      return { 
        success: false, 
        error: (error as Error).message, 
        source: 'firestore' 
      };
    }
  }

  // Get collection name from API endpoint
  getCollectionNameFromEndpoint(endpoint: string): string {
    try {
      // Ensure endpoint is a string
      if (!endpoint || typeof endpoint !== 'string') {
        console.warn('Invalid endpoint provided:', endpoint);
        return 'users'; // Default fallback
      }
      
      // Remove leading slash and query parameters
      const cleanEndpoint = endpoint.split('?')[0]?.replace(/^\//, '') || '';
      
      // Map common endpoints to collection names
      const endpointMap: Record<string, string> = {
        'employees': 'employees',
        'departments': 'departments',
        'users': 'users',
        'attendance': 'attendance',
        'leaves': 'leaves',
        'payrolls': 'payrolls',
        'assets': 'assets',
        'inventory': 'inventory',
        'training': 'training',
        'incidents': 'incidents',
        'expense-management': 'expenses',
        'expenses': 'expenses',
        'holidays': 'holidays',
        'announcements': 'announcements',
        'surveys': 'surveys',
        'documents': 'documents',
        'access-control/permissions': 'permissions',
        'access-control/role-templates': 'roleTemplates',
        'enhanced-payroll/employees': 'employees',
        'enhanced-payroll/bulk': 'payrolls',
        'enhanced-payroll/summary': 'payrolls',
        'exit-processes': 'exitProcesses',
        'performance/overview': 'performance',
        'performance/trends': 'performance',
        'performance/stats': 'performance',
        'performance/goals': 'goals',
        'performance/kpis': 'kpis'
      };

      // Try exact match first
      if (endpointMap[cleanEndpoint]) {
        return endpointMap[cleanEndpoint];
      }

      // Try partial matches
      for (const [key, value] of Object.entries(endpointMap)) {
        if (cleanEndpoint.includes(key)) {
          return value;
        }
      }

      // Default fallback - use first part of endpoint
      const fallback = cleanEndpoint.split('/')[0];
      console.log(`Using fallback collection name: ${fallback} for endpoint: ${endpoint}`);
      return fallback || 'users';
    } catch (error) {
      console.error('Error in getCollectionNameFromEndpoint:', error);
      return 'users'; // Safe fallback
    }
  }

  // Generic CRUD operations - now only use Firestore
  async create(endpoint: string, data: any) {
    try {
      return this.createInFirestore(endpoint, data);
    } catch (error) {
      console.error(`Create operation failed for ${endpoint}:`, error);
      return { success: false, error: (error as Error).message, source: 'firestore' };
    }
  }

  async createInFirestore(endpoint: string, data: any) {
    try {
      const collectionName = this.getCollectionNameFromEndpoint(endpoint);
      const result = await firebaseService.addDocument(collectionName, data);
      return { success: true, data: result.data, source: 'firestore' };
    } catch (error) {
      console.error(`Firestore create failed for ${endpoint}:`, error);
      return { success: false, error: (error as Error).message, source: 'firestore' };
    }
  }

  async update(endpoint: string, data: any) {
    try {
      return this.updateInFirestore(endpoint, data);
    } catch (error) {
      console.error(`Update operation failed for ${endpoint}:`, error);
      return { success: false, error: (error as Error).message, source: 'firestore' };
    }
  }

  async updateInFirestore(endpoint: string, data: any) {
    try {
      const collectionName = this.getCollectionNameFromEndpoint(endpoint);
      const documentId = this.extractDocumentId(endpoint);
      if (!documentId) {
        return { success: false, error: 'Document ID not found in endpoint' };
      }
      
      const result = await firebaseService.updateDocument(collectionName, documentId, data);
      return { success: true, data: result.data, source: 'firestore' };
    } catch (error) {
      console.error(`Firestore update failed for ${endpoint}:`, error);
      return { success: false, error: (error as Error).message, source: 'firestore' };
    }
  }

  async delete(endpoint: string) {
    try {
      return this.deleteFromFirestore(endpoint);
    } catch (error) {
      console.error(`Delete operation failed for ${endpoint}:`, error);
      return { success: false, error: (error as Error).message, source: 'firestore' };
    }
  }

  async deleteFromFirestore(endpoint: string) {
    try {
      const collectionName = this.getCollectionNameFromEndpoint(endpoint);
      const documentId = this.extractDocumentId(endpoint);
      if (!documentId) {
        return { success: false, error: 'Document ID not found in endpoint' };
      }
      
      const result = await firebaseService.deleteDocument(collectionName, documentId);
      return { success: true, data: result.data, source: 'firestore' };
    } catch (error) {
      console.error(`Firestore delete failed for ${endpoint}:`, error);
      return { success: false, error: (error as Error).message, source: 'firestore' };
    }
  }

  // Extract document ID from endpoint
  extractDocumentId(endpoint: string): string {
    const parts = endpoint.split('/');
    return parts[parts.length - 1] || '';
  }

  // Specialized methods for common operations
  async getEmployees(filters: Record<string, any> = {}) {
    return this.fetchData('/employees', { filters });
  }

  async getDepartments() {
    return this.fetchData('/departments');
  }

  async getUsers() {
    return this.fetchData('/users');
  }

  async getAttendance(filters: Record<string, any> = {}) {
    return this.fetchData('/attendance', { filters });
  }

  async getLeaves(filters: Record<string, any> = {}) {
    return this.fetchData('/leaves', { filters });
  }

  async getAssets() {
    return this.fetchData('/assets');
  }

  async getInventory() {
    return this.fetchData('/inventory');
  }

  async getTraining() {
    return this.fetchData('/training');
  }

  async getIncidents() {
    return this.fetchData('/incidents');
  }

  async getExpenses() {
    return this.fetchData('/expense-management');
  }

  async getHolidays() {
    return this.fetchData('/holidays');
  }

  async getAnnouncements() {
    return this.fetchData('/announcements');
  }

  async getDocuments(filters: Record<string, any> = {}) {
    return this.fetchData('/documents', { filters });
  }

  // Performance and analytics data
  async getPerformanceOverview(period: string = 'month', department: string = 'all') {
    return this.fetchData(`/performance/overview?period=${period}&department=${department}`);
  }

  async getPerformanceTrends(period: string = 'month', months: number = 6) {
    return this.fetchData(`/performance/trends?period=${period}&months=${months}`);
  }

  async getPerformanceStats(period: string = 'month') {
    return this.fetchData(`/performance/stats?period=${period}`);
  }

  async getGoals() {
    return this.fetchData('/performance/goals');
  }

  async getKPIs() {
    return this.fetchData('/performance/kpis');
  }

  // Initialize service - no longer needs API client
  async initialize() {
    console.log('DataService initialized - using Firestore only');
    return true;
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;
