import firebaseService from './firebaseService';
import { User, UserRole } from '../types';

class UserService {
  constructor() {
    this.collection = 'users';
  }

  // Get all users
  async getUsers(filters = {}) {
    try {
      const options = {};
      
      // Build where conditions
      const whereConditions = [];
      
      if (filters.role) {
        whereConditions.push({ field: 'role', operator: '==', value: filters.role });
      }
      
      if (filters.department) {
        whereConditions.push({ field: 'department', operator: '==', value: filters.department });
      }
      
      if (filters.status) {
        whereConditions.push({ field: 'status', operator: '==', value: filters.status });
      }

      if (filters.isActive !== undefined) {
        whereConditions.push({ field: 'isActive', operator: '==', value: filters.isActive });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      // Apply ordering
      if (filters.sortBy) {
        options.orderBy = [{ 
          field: filters.sortBy, 
          direction: filters.sortOrder || 'asc' 
        }];
      } else {
        options.orderBy = [{ field: 'firstName', direction: 'asc' }];
      }

      // Apply limit
      if (filters.limit) {
        options.limit = filters.limit;
      }

      const result = await firebaseService.getCollection(this.collection, options);
      return result;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUser(id: string) {
    try {
      const result = await firebaseService.getDocument(this.collection, id);
      return result;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email: string) {
    try {
      const result = await firebaseService.queryDocuments(
        this.collection,
        'email',
        '==',
        email
      );
      return result.success && result.data && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  // Create user
  async createUser(userData: Omit<User, 'id'>) {
    try {
      const result = await firebaseService.addDocument(this.collection, userData);
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, updateData: Partial<User>) {
    try {
      const result = await firebaseService.updateDocument(this.collection, id, updateData);
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user (soft delete by setting isActive to false)
  async deleteUser(id: string) {
    try {
      const result = await firebaseService.updateDocument(this.collection, id, { 
        isActive: false,
        status: 'inactive',
        updatedAt: new Date().toISOString()
      });
      return result;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Permanently delete user
  async permanentDeleteUser(id: string) {
    try {
      const result = await firebaseService.deleteDocument(this.collection, id);
      return result;
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(searchTerm: string) {
    try {
      // Since Firestore doesn't support full-text search,
      // we'll implement a simple prefix search
      const searchUpper = searchTerm.toUpperCase();
      
      // Search by name (prefix)
      const nameResults = await firebaseService.queryDocuments(
        this.collection,
        'firstName',
        '>=',
        searchTerm
      );

      // Search by email (prefix)
      const emailResults = await firebaseService.queryDocuments(
        this.collection,
        'email',
        '>=',
        searchTerm
      );

      // Combine and deduplicate results
      const allResults = [
        ...(nameResults.success ? nameResults.data || [] : []),
        ...(emailResults.success ? emailResults.data || [] : [])
      ];
      const uniqueResults = allResults.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );

      return uniqueResults;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(role: UserRole) {
    try {
      const result = await firebaseService.queryDocuments(
        this.collection,
        'role',
        '==',
        role
      );
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  // Get users by department
  async getUsersByDepartment(department: string) {
    try {
      const result = await firebaseService.queryDocuments(
        this.collection,
        'department',
        '==',
        department
      );
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('Error fetching users by department:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const allUsersResult = await this.getUsers();
      if (!allUsersResult.success) {
        throw new Error('Failed to fetch users for stats');
      }
      
      const allUsers = allUsersResult.data || [];
      const activeUsers = allUsers.filter(user => user.isActive !== false);
      
      const stats = {
        total: allUsers.length,
        active: activeUsers.length,
        inactive: allUsers.length - activeUsers.length,
        roles: {},
        departments: {}
      };

      // Count by role and department
      activeUsers.forEach(user => {
        stats.roles[user.role] = (stats.roles[user.role] || 0) + 1;
        stats.departments[user.department] = (stats.departments[user.department] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  // Get paginated users
  async getPaginatedUsers(pageSize = 10, lastDoc = null, filters = {}) {
    try {
      const options = {};
      
      // Build where conditions
      const whereConditions = [];
      
      if (filters.role) {
        whereConditions.push({ field: 'role', operator: '==', value: filters.role });
      }
      
      if (filters.department) {
        whereConditions.push({ field: 'department', operator: '==', value: filters.department });
      }
      
      if (filters.status) {
        whereConditions.push({ field: 'status', operator: '==', value: filters.status });
      }

      if (filters.isActive !== undefined) {
        whereConditions.push({ field: 'isActive', operator: '==', value: filters.isActive });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      // Apply ordering
      options.orderBy = [{ field: 'firstName', direction: 'asc' }];

      // Apply limit
      options.limit = pageSize;

      const result = await firebaseService.getCollection(this.collection, options);
      return result;
    } catch (error) {
      console.error('Error fetching paginated users:', error);
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(id: string, isActive: boolean) {
    try {
      const result = await firebaseService.updateDocument(this.collection, id, { 
        isActive,
        status: isActive ? 'active' : 'inactive',
        updatedAt: new Date().toISOString()
      });
      return result;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Get departments (unique values)
  async getDepartments() {
    try {
      const usersResult = await this.getUsers();
      if (!usersResult.success) {
        console.warn('Failed to fetch users for departments, returning empty array');
        return [];
      }
      
      const users = usersResult.data || [];
      const departments = [...new Set(users.map(user => user.department))];
      return departments.filter(dept => dept && dept.trim() !== '').sort();
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // Get roles (unique values)
  async getRoles() {
    try {
      const usersResult = await this.getUsers();
      if (!usersResult.success) {
        console.warn('Failed to fetch users for roles, returning default roles');
        return ['admin', 'hr', 'manager', 'employee'];
      }
      
      const users = usersResult.data || [];
      const roles = [...new Set(users.map(user => user.role))];
      const filteredRoles = roles.filter(role => role && role.trim() !== '');
      
      // Ensure we always have the basic roles
      const defaultRoles = ['admin', 'hr', 'manager', 'employee'];
      const allRoles = [...new Set([...filteredRoles, ...defaultRoles])];
      
      return allRoles.sort();
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Return default roles instead of throwing to prevent UI crashes
      return ['admin', 'hr', 'manager', 'employee'];
    }
  }
}

// Create and export a singleton instance
const userService = new UserService();
export default userService;
