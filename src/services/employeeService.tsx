import firebaseService from './firebaseService';

class EmployeeService {
  constructor() {
    this.collection = 'employees';
  }

  // Get all employees
  async getEmployees(filters = {}) {
    try {
      const options = {};
      
      // Build where conditions
      const whereConditions = [];
      
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

      return await firebaseService.getAll(this.collection, options);
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  // Get employee by ID
  async getEmployee(id) {
    try {
      return await firebaseService.getById(this.collection, id);
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  // Get employee by employee ID (not document ID)
  async getEmployeeByEmployeeId(employeeId) {
    try {
      const employees = await firebaseService.query(
        this.collection,
        [{ field: 'id', operator: '==', value: employeeId }]
      );
      return employees.length > 0 ? employees[0] : null;
    } catch (error) {
      console.error('Error fetching employee by employee ID:', error);
      throw error;
    }
  }

  // Create employee
  async createEmployee(employeeData) {
    try {
      const id = await firebaseService.create(this.collection, employeeData);
      return await this.getEmployee(id);
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Update employee
  async updateEmployee(id, updateData) {
    try {
      await firebaseService.update(this.collection, id, updateData);
      return await this.getEmployee(id);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Delete employee (soft delete)
  async deleteEmployee(id) {
    try {
      return await firebaseService.update(this.collection, id, { 
        resigned: true,
        resignedAt: new Date()
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Permanently delete employee
  async permanentDeleteEmployee(id) {
    try {
      return await firebaseService.delete(this.collection, id);
    } catch (error) {
      console.error('Error permanently deleting employee:', error);
      throw error;
    }
  }

  // Search employees
  async searchEmployees(searchTerm) {
    try {
      // Since Firestore doesn't support full-text search,
      // we'll implement a simple prefix search
      const searchUpper = searchTerm.toUpperCase();
      
      // Search by name (prefix)
      const nameResults = await firebaseService.query(
        this.collection,
        [
          { field: 'employeeName', operator: '>=', value: searchTerm },
          { field: 'employeeName', operator: '<=', value: searchTerm + '\uf8ff' }
        ]
      );

      // Search by employee ID (prefix)
      const idResults = await firebaseService.query(
        this.collection,
        [
          { field: 'id', operator: '>=', value: searchTerm },
          { field: 'id', operator: '<=', value: searchTerm + '\uf8ff' }
        ]
      );

      // Combine and deduplicate results
      const allResults = [...nameResults, ...idResults];
      const uniqueResults = allResults.filter((employee, index, self) => 
        index === self.findIndex(e => e.id === employee.id)
      );

      return uniqueResults;
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }

  // Get employees by department
  async getEmployeesByDepartment(department) {
    try {
      return await firebaseService.query(
        this.collection,
        [{ field: 'department', operator: '==', value: department }],
        { field: 'employeeName', direction: 'asc' }
      );
    } catch (error) {
      console.error('Error fetching employees by department:', error);
      throw error;
    }
  }

  // Get employee statistics
  async getEmployeeStats() {
    try {
      const allEmployees = await this.getEmployees();
      const activeEmployees = allEmployees.filter(emp => !emp.resigned);
      
      const stats = {
        total: allEmployees.length,
        active: activeEmployees.length,
        resigned: allEmployees.length - activeEmployees.length,
        departments: {},
        designations: {}
      };

      // Count by department and designation
      activeEmployees.forEach(emp => {
        stats.departments[emp.department] = (stats.departments[emp.department] || 0) + 1;
        stats.designations[emp.designation] = (stats.designations[emp.designation] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      throw error;
    }
  }

  // Get paginated employees
  async getPaginatedEmployees(pageSize = 10, lastDoc = null, filters = {}) {
    try {
      const options = {};
      
      // Build where conditions
      const whereConditions = [];
      
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

      return await firebaseService.getPaginated(this.collection, pageSize, lastDoc, options);
    } catch (error) {
      console.error('Error fetching paginated employees:', error);
      throw error;
    }
  }

  // Real-time employee updates
  onEmployeesSnapshot(callback, filters = {}) {
    try {
      const options = {};
      
      // Build where conditions
      const whereConditions = [];
      
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

      return firebaseService.onSnapshot(this.collection, callback, options);
    } catch (error) {
      console.error('Error setting up employees snapshot:', error);
      throw error;
    }
  }

  // Update employee contact information
  async updateEmployeeContact(id, contactData) {
    try {
      const updateData = {};
      
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
      const employees = await this.getEmployees({ resigned: false });
      const departments = [...new Set(employees.map(emp => emp.department))];
      return departments.filter(dept => dept).sort();
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  // Get designations (unique values)
  async getDesignations() {
    try {
      const employees = await this.getEmployees({ resigned: false });
      const designations = [...new Set(employees.map(emp => emp.designation))];
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