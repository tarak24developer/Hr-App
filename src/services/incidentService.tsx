import firebaseService from './firebaseService';
import { ApiResponse, QueryOptions } from '../types';

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reporterId: string;
  assigneeId?: string;
  location: string;
  reportedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  attachments: string[];
  tags: string[];
  notes: IncidentNote[];
  isActive?: boolean;
  createdAt?: string;
}

export interface IncidentNote {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  isInternal: boolean;
}

export interface IncidentCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IncidentFormData {
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId: string;
  location: string;
  tags: string[];
}

export interface IncidentStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  urgent: number;
  resolvedToday: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

class IncidentService {
  private collection = 'incidents';
  private categoriesCollection = 'incidentCategories';

  // Get all incidents with optional filtering
  async getIncidents(options: QueryOptions = {}): Promise<ApiResponse<Incident[]>> {
    try {
      const result = await firebaseService.getCollection(this.collection, {
        ...options,
        orderBy: options.orderBy || [{ field: 'reportedAt', direction: 'desc' }]
      });

      if (result.success && result.data) {
        // Filter for active incidents by default
        const incidents = Array.isArray(result.data) ? result.data : [];
        const activeIncidents = incidents.filter((incident: any) => incident.isActive !== false);
        
        // Client-side sorting to avoid Firebase index issues
        if (options.sortBy) {
          activeIncidents.sort((a: any, b: any) => {
            const aValue = a[options.sortBy!];
            const bValue = b[options.sortBy!];
            
            if (aValue < bValue) return options.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return options.sortOrder === 'asc' ? 1 : -1;
            return 0;
          });
        }

        return {
          success: true,
          data: activeIncidents
        };
      }

      return result;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      throw error;
    }
  }

  // Get incident by ID
  async getIncidentById(id: string): Promise<ApiResponse<Incident>> {
    try {
      return await firebaseService.getDocument(this.collection, id);
    } catch (error) {
      console.error('Error fetching incident:', error);
      throw error;
    }
  }

  // Create new incident
  async createIncident(incidentData: IncidentFormData): Promise<ApiResponse<Incident>> {
    try {
      const now = new Date().toISOString();
      const incident: Omit<Incident, 'id'> = {
        ...incidentData,
        reporterId: 'current-user-id', // This should be replaced with actual current user ID
        reportedAt: now,
        updatedAt: now,
        attachments: [],
        notes: [],
        isActive: true,
        createdAt: now
      };

      return await firebaseService.addDocument(this.collection, incident);
    } catch (error) {
      console.error('Error creating incident:', error);
      throw error;
    }
  }

  // Update incident
  async updateIncident(id: string, incidentData: Partial<IncidentFormData>): Promise<ApiResponse<Incident>> {
    try {
      const updateData = {
        ...incidentData,
        updatedAt: new Date().toISOString()
      };

      return await firebaseService.updateDocument(this.collection, id, updateData);
    } catch (error) {
      console.error('Error updating incident:', error);
      throw error;
    }
  }

  // Delete incident (soft delete)
  async deleteIncident(id: string): Promise<ApiResponse<boolean>> {
    try {
      const updateData = {
        isActive: false,
        updatedAt: new Date().toISOString()
      };

      return await firebaseService.updateDocument(this.collection, id, updateData);
    } catch (error) {
      console.error('Error deleting incident:', error);
      throw error;
    }
  }

  // Permanently delete incident
  async permanentDeleteIncident(id: string): Promise<ApiResponse<boolean>> {
    try {
      return await firebaseService.deleteDocument(this.collection, id);
    } catch (error) {
      console.error('Error permanently deleting incident:', error);
      throw error;
    }
  }

  // Get incident categories
  async getCategories(): Promise<ApiResponse<IncidentCategory[]>> {
    try {
      const result = await firebaseService.getCollection(this.categoriesCollection);
      
      if (result.success && result.data) {
        const categories = Array.isArray(result.data) ? result.data : [];
        const activeCategories = categories.filter((category: any) => category.isActive !== false);
        return {
          success: true,
          data: activeCategories
        };
      }

      return result;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Create incident category
  async createCategory(categoryData: Omit<IncidentCategory, 'id'>): Promise<ApiResponse<IncidentCategory>> {
    try {
      const now = new Date().toISOString();
      const category = {
        ...categoryData,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      return await firebaseService.addDocument(this.categoriesCollection, category);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Get incident statistics
  async getIncidentStats(): Promise<ApiResponse<IncidentStats>> {
    try {
      const result = await this.getIncidents();
      if (!result.success) {
        throw new Error('Failed to fetch incidents for stats');
      }

      const incidents = result.data || [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const stats: IncidentStats = {
        total: incidents.length,
        open: incidents.filter((incident: any) => incident.status === 'open').length,
        investigating: incidents.filter((incident: any) => incident.status === 'investigating').length,
        resolved: incidents.filter((incident: any) => incident.status === 'resolved').length,
        closed: incidents.filter((incident: any) => incident.status === 'closed').length,
        critical: incidents.filter((incident: any) => incident.severity === 'critical').length,
        high: incidents.filter((incident: any) => incident.severity === 'high').length,
        medium: incidents.filter((incident: any) => incident.severity === 'medium').length,
        low: incidents.filter((incident: any) => incident.severity === 'low').length,
        urgent: incidents.filter((incident: any) => incident.priority === 'urgent').length,
        resolvedToday: incidents.filter((incident: any) => 
          incident.status === 'resolved' && 
          incident.resolvedAt && 
          new Date(incident.resolvedAt) >= today
        ).length,
        byCategory: {},
        bySeverity: {},
        byStatus: {},
        byPriority: {}
      };

      // Count by category, severity, status, and priority
      incidents.forEach((incident: any) => {
        stats.byCategory[incident.category] = (stats.byCategory[incident.category] || 0) + 1;
        stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
        stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
        stats.byPriority[incident.priority] = (stats.byPriority[incident.priority] || 0) + 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching incident stats:', error);
      throw error;
    }
  }

  // Add note to incident
  async addIncidentNote(incidentId: string, note: Omit<IncidentNote, 'id'>): Promise<ApiResponse<IncidentNote>> {
    try {
      const noteId = Date.now().toString();
      const newNote: IncidentNote = {
        ...note,
        id: noteId,
        createdAt: new Date().toISOString()
      };

      // Get current incident
      const incidentResult = await this.getIncidentById(incidentId);
      if (!incidentResult.success || !incidentResult.data) {
        throw new Error('Incident not found');
      }

      const updatedIncident = {
        ...incidentResult.data,
        notes: [...incidentResult.data.notes, newNote],
        updatedAt: new Date().toISOString()
      };

      const updateResult = await firebaseService.updateDocument(this.collection, incidentId, updatedIncident);
      if (updateResult.success) {
        return { success: true, data: newNote };
      }

      return updateResult;
    } catch (error) {
      console.error('Error adding incident note:', error);
      throw error;
    }
  }

  // Update incident status
  async updateIncidentStatus(id: string, status: Incident['status'], resolution?: string): Promise<ApiResponse<Incident>> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date().toISOString();
        if (resolution) {
          updateData.resolution = resolution;
        }
      }

      return await firebaseService.updateDocument(this.collection, id, updateData);
    } catch (error) {
      console.error('Error updating incident status:', error);
      throw error;
    }
  }
}

export default new IncidentService();
