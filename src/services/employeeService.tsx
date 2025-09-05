import firebaseService from './firebaseService';

interface EmployeeFilters {
  department?: string;
  designation?: string;
  resigned?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

class EmployeeService {
  private collection: string;

  constructor() {
    this.collection = 'employees';
  }

  // Get all employees
  async getEmployees(filters: EmployeeFilters = {}) {
    try {
      const options: any = {};
      
      // Build where conditions
      const whereConditions: Array<{field: string; operator: string; value: any}> = [];
      
      if (filters.department) {
        whereConditions.push({ field: 'department', operator: '==', value: filters.department });
      }
      
      if (filters.designation) {
        whereConditions.push({ field: 'designation', operator: '==', value: filters.designation });
      }
      
      if (filters.resigned !== undefined) {
        whereConditions.push({ field: 'resigned', operator: '==', value: filters.resigned });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      // Apply ordering
      if (filters.sortBy) {
        options.orderBy = { 
          field: filters.sortBy, 
          direction: filters.sortOrder || 'asc' 
        };
      } else {
        options.orderBy = { field: 'employeeName', direction: 'asc' };
      }

      // Apply limit
      if (filters.limit) {
        options.limit = filters.limit;
      }

      const result = await firebaseService.getCollection(this.collection, options);
      return result;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  // Get employee by ID
  async getEmployee(id: string) {
    try {
      const result = await firebaseService.getDocument(this.collection, id);
      return result;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  // Get employee by employee ID (not document ID)
  async getEmployeeByEmployeeId(employeeId: string) {
    try {
      const result = await firebaseService.queryDocuments(
        this.collection,
        'id',
        '==',
        employeeId
      );
      return result.success && result.data && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error('Error fetching employee by employee ID:', error);
      throw error;
    }
  }

  // Create employee
  async createEmployee(employeeData: any) {
    try {
      const result = await firebaseService.addDocument(this.collection, employeeData);
      return result;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Update employee
  async updateEmployee(id: string, updateData: any) {
    try {
      const result = await firebaseService.updateDocument(this.collection, id, updateData);
      return result;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Delete employee (soft delete)
  async deleteEmployee(id: string) {
    try {
      const result = await firebaseService.updateDocument(this.collection, id, { 
        resigned: true,
        resignedAt: new Date()
      });
      return result;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Permanently delete employee
  async permanentDeleteEmployee(id: string) {
    try {
      const result = await firebaseService.deleteDocument(this.collection, id);
      return result;
    } catch (error) {
      console.error('Error permanently deleting employee:', error);
      throw error;
    }
  }

  // Search employees
  async searchEmployees(searchTerm: string) {
    try {
      // Since Firestore doesn't support full-text search,
      // we'll implement a simple prefix search
      
      // Search by name (prefix)
      const nameResults = await firebaseService.queryDocuments(
        this.collection,
        'employeeName',
        '>=',
        searchTerm
      );

      // Search by employee ID (prefix)
      const idResults = await firebaseService.queryDocuments(
        this.collection,
        'id',
        '>=',
        searchTerm
      );

      // Combine and deduplicate results
      const allResults = [
        ...(nameResults.success ? nameResults.data || [] : []),
        ...(idResults.success ? idResults.data || [] : [])
      ];
      const uniqueResults = allResults.filter((employee, index, self) => 
        index === self.findIndex(e => e['id'] === employee['id'])
      );

      return uniqueResults;
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }

  // Get employees by department
  async getEmployeesByDepartment(department: string) {
    try {
      const result = await firebaseService.queryDocuments(
        this.collection,
        'department',
        '==',
        department
      );
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Error fetching employees by department:', error);
      throw error;
    }
  }

  // Get employee statistics
  async getEmployeeStats() {
    try {
      const allEmployeesResult = await this.getEmployees();
      if (!allEmployeesResult.success) {
        throw new Error('Failed to fetch employees for stats');
      }
      
      const allEmployees = allEmployeesResult.data || [];
      const activeEmployees = allEmployees.filter(emp => !emp['resigned']);
      
      const stats: any = {
        total: allEmployees.length,
        active: activeEmployees.length,
        resigned: allEmployees.length - activeEmployees.length,
        departments: {},
        designations: {}
      };

      // Count by department and designation
      activeEmployees.forEach(emp => {
        stats.departments[emp['department']] = (stats.departments[emp['department']] || 0) + 1;
        stats.designations[emp['designation']] = (stats.designations[emp['designation']] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      throw error;
    }
  }

  // Get paginated employees
  async getPaginatedEmployees(pageSize: number = 10, _lastDoc: any = null, filters: EmployeeFilters = {}) {
    try {
      const options: any = {};
      
      // Build where conditions
      const whereConditions: Array<{field: string; operator: string; value: any}> = [];
      
      if (filters.department) {
        whereConditions.push({ field: 'department', operator: '==', value: filters.department });
      }
      
      if (filters.designation) {
        whereConditions.push({ field: 'designation', operator: '==', value: filters.designation });
      }
      
      if (filters.resigned !== undefined) {
        whereConditions.push({ field: 'resigned', operator: '==', value: filters.resigned });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      // Apply ordering
      options.orderBy = { field: 'employeeName', direction: 'asc' };

      // Apply limit
      options.limit = pageSize;

      const result = await firebaseService.getCollection(this.collection, options);
      return result;
    } catch (error) {
      console.error('Error fetching paginated employees:', error);
      throw error;
    }
  }

  // Real-time employee updates
  onEmployeesSnapshot(_callback: any, filters: EmployeeFilters = {}) {
    try {
      const options: any = {};
      
      // Build where conditions
      const whereConditions: Array<{field: string; operator: string; value: any}> = [];
      
      if (filters.department) {
        whereConditions.push({ field: 'department', operator: '==', value: filters.department });
      }
      
      if (filters.resigned !== undefined) {
        whereConditions.push({ field: 'resigned', operator: '==', value: filters.resigned });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      options.orderBy = { field: 'employeeName', direction: 'asc' };

      // Note: onSnapshot is not implemented in firebaseService yet
      // This would need to be implemented in firebaseService
      console.warn('Real-time updates not implemented yet');
      return null;
    } catch (error) {
      console.error('Error setting up employees snapshot:', error);
      throw error;
    }
  }

  // Update employee contact information
  async updateEmployeeContact(id: string, contactData: any) {
    try {
      const updateData: any = {};
      
      if (contactData.contactInfo) {
        updateData.contactInfo = contactData.contactInfo;
      }
      
      if (contactData.emergencyContacts) {
        updateData.emergencyContacts = contactData.emergencyContacts;
      }

      return await this.updateEmployee(id, updateData);
    } catch (error) {
      console.error('Error updating employee contact:', error);
      throw error;
    }
  }

  // Get departments (unique values)
  async getDepartments() {
    try {
      const employeesResult = await this.getEmployees({ resigned: false });
      if (!employeesResult.success) {
        throw new Error('Failed to fetch employees for departments');
      }
      
      const employees = employeesResult.data || [];
      const departments = Array.from(new Set(employees.map(emp => emp['department'])));
      return departments.filter(dept => dept).sort();
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  // Get designations (unique values)
  async getDesignations() {
    try {
      const employeesResult = await this.getEmployees({ resigned: false });
      if (!employeesResult.success) {
        throw new Error('Failed to fetch employees for designations');
      }
      
      const employees = employeesResult.data || [];
      const designations = Array.from(new Set(employees.map(emp => emp['designation'])));
      return designations.filter(designation => designation).sort();
    } catch (error) {
      console.error('Error fetching designations:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const employeeService = new EmployeeService();
export default employeeService;