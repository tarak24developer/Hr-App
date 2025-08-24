import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  writeBatch,
  Timestamp,
  FieldValue,
  Firestore
} from 'firebase/firestore';
import { db } from './firebase';

interface FilterOption {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
  value: any;
}

interface QueryOptions {
  filters?: FilterOption[];
  orderBy?: {
    field: string;
    direction?: 'asc' | 'desc';
  };
  limit?: number;
  startAfter?: any;
}

interface CrudResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class FirebaseAdminService {
  private db: Firestore | null;

  constructor() {
    this.db = db;
  }

  // Generic CRUD operations
  async create(collectionName: string, data: any): Promise<CrudResult> {
    try {
      if (!this.db) {
        return { success: false, error: 'Firebase not initialized' };
      }

      const docRef = await addDoc(collection(this.db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        data: { id: docRef.id, ...data },
        message: 'Document created successfully' 
      };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getById(collectionName: string, id: string): Promise<CrudResult> {
    try {
      if (!this.db) {
        return { success: false, error: 'Firebase not initialized' };
      }

      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { 
          success: true, 
          data: { id: docSnap.id, ...docSnap.data() } 
        };
      } else {
        return { 
          success: false, 
          error: 'Document not found' 
        };
      }
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAll(collectionName: string, options: QueryOptions = {}): Promise<CrudResult> {
    try {
      if (!this.db) {
        return { success: false, error: 'Firebase not initialized' };
      }

      let q: any = collection(this.db, collectionName);
      
      // Apply filters
      if (options.filters && Array.isArray(options.filters)) {
        options.filters.forEach(filter => {
          if (filter.field && filter.operator && filter.value !== undefined) {
            q = query(q, where(filter.field, filter.operator, filter.value));
          }
        });
      }
      
      // Apply ordering
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'));
      }
      
      // Apply limit
      if (options.limit) {
        q = query(q, limit(options.limit));
      }
      
      // Apply pagination
      if (options.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }

      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });

      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async update(collectionName: string, id: string, data: any): Promise<CrudResult> {
    try {
      if (!this.db) {
        return { success: false, error: 'Firebase not initialized' };
      }

      const docRef = doc(this.db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      return { 
        success: true, 
        message: 'Document updated successfully' 
      };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async delete(collectionName: string, id: string): Promise<CrudResult> {
    try {
      if (!this.db) {
        return { success: false, error: 'Firebase not initialized' };
      }

      await deleteDoc(doc(this.db, collectionName, id));
      
      return { 
        success: true, 
        message: 'Document deleted successfully' 
      };
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Batch operations
  async batchWrite(operations: any[]): Promise<CrudResult> {
    try {
      if (!this.db) {
        return { success: false, error: 'Firebase not initialized' };
      }

      const batch = writeBatch(this.db);
      
      operations.forEach(op => {
        const docRef = doc(this.db, op.collection, op.id);
        
        switch (op.type) {
          case 'set':
            batch.set(docRef, op.data);
            break;
          case 'update':
            batch.update(docRef, op.data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });
      
      await batch.commit();
      return { success: true, message: 'Batch operation completed successfully' };
    } catch (error) {
      console.error('Error in batch write:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Specialized methods for common operations
  async getEmployees(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('employees', { filters, ...options });
  }

  async getEmployeeById(id: string): Promise<CrudResult> {
    return this.getById('employees', id);
  }

  async createEmployee(data: any): Promise<CrudResult> {
    return this.create('employees', data);
  }

  async updateEmployee(id: string, data: any): Promise<CrudResult> {
    return this.update('employees', id, data);
  }

  async deleteEmployee(id: string): Promise<CrudResult> {
    return this.delete('employees', id);
  }

  async getUsers(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('users', { filters, ...options });
  }

  async getUserById(id: string): Promise<CrudResult> {
    return this.getById('users', id);
  }

  async createUser(data: any): Promise<CrudResult> {
    return this.create('users', data);
  }

  async updateUser(id: string, data: any): Promise<CrudResult> {
    return this.update('users', id, data);
  }

  async deleteUser(id: string): Promise<CrudResult> {
    return this.delete('users', id);
  }

  async getAttendance(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('attendance', { filters, ...options });
  }

  async getAttendanceById(id: string): Promise<CrudResult> {
    return this.getById('attendance', id);
  }

  async createAttendance(data: any): Promise<CrudResult> {
    return this.create('attendance', data);
  }

  async updateAttendance(id: string, data: any): Promise<CrudResult> {
    return this.update('attendance', id, data);
  }

  async deleteAttendance(id: string): Promise<CrudResult> {
    return this.delete('attendance', id);
  }

  async getLeaves(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('leaves', { filters, ...options });
  }

  async getLeaveById(id: string): Promise<CrudResult> {
    return this.getById('leaves', id);
  }

  async createLeave(data: any): Promise<CrudResult> {
    return this.create('leaves', data);
  }

  async updateLeave(id: string, data: any): Promise<CrudResult> {
    return this.update('leaves', id, data);
  }

  async deleteLeave(id: string): Promise<CrudResult> {
    return this.delete('leaves', id);
  }

  async getPayrolls(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('payrolls', { filters, ...options });
  }

  async getPayrollById(id: string): Promise<CrudResult> {
    return this.getById('payrolls', id);
  }

  async createPayroll(data: any): Promise<CrudResult> {
    return this.create('payrolls', data);
  }

  async updatePayroll(id: string, data: any): Promise<CrudResult> {
    return this.update('payrolls', id, data);
  }

  async deletePayroll(id: string): Promise<CrudResult> {
    return this.delete('payrolls', id);
  }

  async getAssets(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('assets', { filters, ...options });
  }

  async getAssetById(id: string): Promise<CrudResult> {
    return this.getById('assets', id);
  }

  async createAsset(data: any): Promise<CrudResult> {
    return this.create('assets', data);
  }

  async updateAsset(id: string, data: any): Promise<CrudResult> {
    return this.update('assets', id, data);
  }

  async deleteAsset(id: string): Promise<CrudResult> {
    return this.delete('assets', id);
  }

  async getInventory(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('inventory', { filters, ...options });
  }

  async getInventoryItemById(id: string): Promise<CrudResult> {
    return this.getById('inventory', id);
  }

  async createInventoryItem(data: any): Promise<CrudResult> {
    return this.create('inventory', data);
  }

  async updateInventoryItem(id: string, data: any): Promise<CrudResult> {
    return this.update('inventory', id, data);
  }

  async deleteInventoryItem(id: string): Promise<CrudResult> {
    return this.delete('inventory', id);
  }

  async getTraining(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('training', { filters, ...options });
  }

  async getTrainingById(id: string): Promise<CrudResult> {
    return this.getById('training', id);
  }

  async createTraining(data: any): Promise<CrudResult> {
    return this.create('training', data);
  }

  async updateTraining(id: string, data: any): Promise<CrudResult> {
    return this.update('training', id, data);
  }

  async deleteTraining(id: string): Promise<CrudResult> {
    return this.delete('training', id);
  }

  async getIncidents(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('incidents', { filters, ...options });
  }

  async getIncidentById(id: string): Promise<CrudResult> {
    return this.getById('incidents', id);
  }

  async createIncident(data: any): Promise<CrudResult> {
    return this.create('incidents', data);
  }

  async updateIncident(id: string, data: any): Promise<CrudResult> {
    return this.update('incidents', id, data);
  }

  async deleteIncident(id: string): Promise<CrudResult> {
    return this.delete('incidents', id);
  }

  async getExpenses(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('expenses', { filters, ...options });
  }

  async getExpenseById(id: string): Promise<CrudResult> {
    return this.getById('expenses', id);
  }

  async createExpense(data: any): Promise<CrudResult> {
    return this.create('expenses', data);
  }

  async updateExpense(id: string, data: any): Promise<CrudResult> {
    return this.update('expenses', id, data);
  }

  async deleteExpense(id: string): Promise<CrudResult> {
    return this.delete('expenses', id);
  }

  async getHolidays(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('holidays', { filters, ...options });
  }

  async getHolidayById(id: string): Promise<CrudResult> {
    return this.getById('holidays', id);
  }

  async createHoliday(data: any): Promise<CrudResult> {
    return this.create('holidays', data);
  }

  async updateHoliday(id: string, data: any): Promise<CrudResult> {
    return this.update('holidays', id, data);
  }

  async deleteHoliday(id: string): Promise<CrudResult> {
    return this.delete('holidays', id);
  }

  async getAnnouncements(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('announcements', { filters, ...options });
  }

  async getAnnouncementById(id: string): Promise<CrudResult> {
    return this.getById('announcements', id);
  }

  async createAnnouncement(data: any): Promise<CrudResult> {
    return this.create('announcements', data);
  }

  async updateAnnouncement(id: string, data: any): Promise<CrudResult> {
    return this.update('announcements', id, data);
  }

  async deleteAnnouncement(id: string): Promise<CrudResult> {
    return this.delete('announcements', id);
  }

  async getDocuments(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('documents', { filters, ...options });
  }

  async getDocumentById(id: string): Promise<CrudResult> {
    return this.getById('documents', id);
  }

  async createDocument(data: any): Promise<CrudResult> {
    return this.create('documents', data);
  }

  async updateDocument(id: string, data: any): Promise<CrudResult> {
    return this.update('documents', id, data);
  }

  async deleteDocument(id: string): Promise<CrudResult> {
    return this.delete('documents', id);
  }

  async getDepartments(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('departments', { filters, ...options });
  }

  async getDepartmentById(id: string): Promise<CrudResult> {
    return this.getById('departments', id);
  }

  async createDepartment(data: any): Promise<CrudResult> {
    return this.create('departments', data);
  }

  async updateDepartment(id: string, data: any): Promise<CrudResult> {
    return this.update('departments', id, data);
  }

  async deleteDepartment(id: string): Promise<CrudResult> {
    return this.delete('departments', id);
  }

  async getDesignations(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('designations', { filters, ...options });
  }

  async getDesignationById(id: string): Promise<CrudResult> {
    return this.getById('designations', id);
  }

  async createDesignation(data: any): Promise<CrudResult> {
    return this.create('designations', data);
  }

  async updateDesignation(id: string, data: any): Promise<CrudResult> {
    return this.update('designations', id, data);
  }

  async deleteDesignation(id: string): Promise<CrudResult> {
    return this.delete('designations', id);
  }

  // Performance and analytics methods
  async getPerformanceOverview(period: string = 'month', department: string = 'all'): Promise<CrudResult> {
    const filters: FilterOption[] = [];
    if (department !== 'all') {
      filters.push({ field: 'department', operator: '==', value: department });
    }
    
    return this.getAll('performance', { 
      filters,
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 100
    });
  }

  async getPerformanceTrends(period: string = 'month', months: number = 6): Promise<CrudResult> {
    const filters: FilterOption[] = [];
    if (period !== 'all') {
      filters.push({ field: 'period', operator: '==', value: period });
    }
    
    return this.getAll('performance', { 
      filters,
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: months * 30 // Approximate days
    });
  }

  async getPerformanceStats(period: string = 'month'): Promise<CrudResult> {
    const filters: FilterOption[] = [];
    if (period !== 'all') {
      filters.push({ field: 'period', operator: '==', value: period });
    }
    
    return this.getAll('performance', { 
      filters,
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 100
    });
  }

  async getGoals(): Promise<CrudResult> {
    return this.getAll('goals', {
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async getKPIs(): Promise<CrudResult> {
    return this.getAll('kpis', {
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  // Access control methods
  async getPermissions(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('permissions', { filters, ...options });
  }

  async getRoleTemplates(filters: FilterOption[] = [], options: QueryOptions = {}): Promise<CrudResult> {
    return this.getAll('roleTemplates', { filters, ...options });
  }

  // Employer methods
  async getEmployerInfo(): Promise<CrudResult> {
    const result = await this.getAll('employer', { limit: 1 });
    if (result.success && result.data && result.data.length > 0) {
      return { success: true, data: result.data[0] };
    }
    return { success: false, error: 'No employer information found' };
  }

  async getCompanyDepartments(): Promise<CrudResult> {
    return this.getAll('departments', {
      orderBy: { field: 'name', direction: 'asc' }
    });
  }

  async getCompanyBranches(): Promise<CrudResult> {
    return this.getAll('branches', {
      orderBy: { field: 'name', direction: 'asc' }
    });
  }

  async getCompanyShifts(): Promise<CrudResult> {
    return this.getAll('shifts', {
      orderBy: { field: 'name', direction: 'asc' }
    });
  }

  // Utility methods
  async getCollectionStats(collectionName: string): Promise<CrudResult & { total?: number; collection?: string }> {
    try {
      const result = await this.getAll(collectionName);
      if (result.success) {
        return {
          success: true,
          total: Array.isArray(result.data) ? result.data.length : 0,
          collection: collectionName
        };
      }
      return { success: false, error: 'Failed to get collection data' };
    } catch (error) {
      console.error(`Error getting stats for ${collectionName}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async searchDocuments(collectionName: string, searchTerm: string, searchFields: string[] = ['name', 'title', 'description']): Promise<CrudResult> {
    try {
      if (!this.db) {
        return { success: false, error: 'Firebase not initialized' };
      }

      // Firestore doesn't support full-text search, so we'll search by field values
      const results: any[] = [];
      
      // For demo purposes, return empty results
      // In a real implementation, you might use Algolia or similar search service
      console.log(`Searching for "${searchTerm}" in ${collectionName} fields:`, searchFields);
      
      return {
        success: true,
        data: results,
        message: 'Search completed (demo mode)'
      };
    } catch (error) {
      console.error(`Error searching in ${collectionName}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Create and export a single instance
const firebaseAdminService = new FirebaseAdminService();
export default firebaseAdminService;
