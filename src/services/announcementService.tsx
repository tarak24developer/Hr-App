import firebaseService from './firebaseService';
import { Announcement, AnnouncementCategory, AnnouncementFormData, AnnouncementStats, ApiResponse } from '../types';

class AnnouncementService {
  private collection = 'announcements';
  private categoriesCollection = 'announcementCategories';

  // Get all announcements with optional filtering
  async getAnnouncements(filters: any = {}): Promise<ApiResponse<Announcement[]>> {
    try {
      const options: any = {};
      const whereConditions: any[] = [];

      // Filter for active announcements by default
      if (filters.isActive === true) {
        whereConditions.push({ field: 'isActive', operator: '==', value: true });
      } else if (filters.isActive === false) {
        whereConditions.push({ field: 'isActive', operator: '==', value: false });
      } else if (filters.isActive === undefined && !filters.includeInactive) {
        whereConditions.push({ field: 'isActive', operator: '==', value: true });
      }

      // Filter by type
      if (filters.type) {
        whereConditions.push({ field: 'type', operator: '==', value: filters.type });
      }

      // Filter by priority
      if (filters.priority) {
        whereConditions.push({ field: 'priority', operator: '==', value: filters.priority });
      }

      // Filter by category
      if (filters.category) {
        whereConditions.push({ field: 'category', operator: '==', value: filters.category });
      }

      // Filter by status
      if (filters.status === 'published') {
        whereConditions.push({ field: 'isPublished', operator: '==', value: true });
      } else if (filters.status === 'draft') {
        whereConditions.push({ field: 'isPublished', operator: '==', value: false });
      } else if (filters.status === 'archived') {
        whereConditions.push({ field: 'isArchived', operator: '==', value: true });
      } else if (filters.status === 'pinned') {
        whereConditions.push({ field: 'isPinned', operator: '==', value: true });
      }

      // Filter by author
      if (filters.authorId) {
        whereConditions.push({ field: 'authorId', operator: '==', value: filters.authorId });
      }

      if (whereConditions.length > 0) {
        options.where = whereConditions;
      }

      const result = await firebaseService.getCollection(this.collection, options);
      
      if (result.success && result.data) {
        let announcements = result.data;
        
        // Apply sorting in memory
        if (filters.sortBy) {
          announcements = announcements.sort((a: any, b: any) => {
            const aValue = a[filters.sortBy];
            const bValue = b[filters.sortBy];
            
            if (filters.sortOrder === 'desc') {
              return bValue > aValue ? 1 : -1;
            }
            return aValue > bValue ? 1 : -1;
          });
        } else {
          // Default sort by publishDate descending
          announcements = announcements.sort((a: any, b: any) => {
            return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
          });
        }

        return { ...result, data: announcements };
      }
      
      return result;
    } catch (error: any) {
      console.error('Error getting announcements:', error);
      return { success: false, error: error.message };
    }
  }

  // Get a single announcement by ID
  async getAnnouncement(id: string): Promise<ApiResponse<Announcement>> {
    try {
      const result = await firebaseService.getDocument(this.collection, id);
      return result;
    } catch (error: any) {
      console.error('Error getting announcement:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a new announcement
  async createAnnouncement(announcementData: AnnouncementFormData): Promise<ApiResponse<Announcement>> {
    try {
      const firestoreData = {
        ...announcementData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        readCount: 0,
        likeCount: 0,
        commentCount: 0,
        isArchived: false
      };

      // Remove undefined values
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key as keyof typeof firestoreData] === undefined) {
          delete firestoreData[key as keyof typeof firestoreData];
        }
      });

      const result = await firebaseService.addDocument(this.collection, firestoreData);
      return result;
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      return { success: false, error: error.message };
    }
  }

  // Update an existing announcement
  async updateAnnouncement(id: string, updateData: Partial<AnnouncementFormData>): Promise<ApiResponse<Announcement>> {
    try {
      const firestoreData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key as keyof typeof firestoreData] === undefined) {
          delete firestoreData[key as keyof typeof firestoreData];
        }
      });

      const result = await firebaseService.updateDocument(this.collection, id, firestoreData);
      return result;
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      return { success: false, error: error.message };
    }
  }

  // Soft delete an announcement (mark as inactive)
  async deleteAnnouncement(id: string): Promise<ApiResponse<void>> {
    try {
      const result = await firebaseService.updateDocument(this.collection, id, {
        isActive: false,
        updatedAt: new Date().toISOString()
      });
      return result;
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      return { success: false, error: error.message };
    }
  }

  // Permanently delete an announcement
  async permanentDeleteAnnouncement(id: string): Promise<ApiResponse<void>> {
    try {
      const result = await firebaseService.deleteDocument(this.collection, id);
      return result;
    } catch (error: any) {
      console.error('Error permanently deleting announcement:', error);
      return { success: false, error: error.message };
    }
  }

  // Toggle pin status
  async togglePinAnnouncement(id: string, isPinned: boolean): Promise<ApiResponse<Announcement>> {
    try {
      const result = await firebaseService.updateDocument(this.collection, id, {
        isPinned,
        updatedAt: new Date().toISOString()
      });
      return result;
    } catch (error: any) {
      console.error('Error toggling pin status:', error);
      return { success: false, error: error.message };
    }
  }

  // Toggle publish status
  async togglePublishAnnouncement(id: string, isPublished: boolean): Promise<ApiResponse<Announcement>> {
    try {
      const updateData: any = {
        isPublished,
        updatedAt: new Date().toISOString()
      };

      if (isPublished) {
        updateData.publishDate = new Date().toISOString();
      }

      const result = await firebaseService.updateDocument(this.collection, id, updateData);
      return result;
    } catch (error: any) {
      console.error('Error toggling publish status:', error);
      return { success: false, error: error.message };
    }
  }

  // Archive an announcement
  async archiveAnnouncement(id: string): Promise<ApiResponse<Announcement>> {
    try {
      const result = await firebaseService.updateDocument(this.collection, id, {
        isArchived: true,
        updatedAt: new Date().toISOString()
      });
      return result;
    } catch (error: any) {
      console.error('Error archiving announcement:', error);
      return { success: false, error: error.message };
    }
  }

  // Get announcement categories
  async getCategories(): Promise<ApiResponse<AnnouncementCategory[]>> {
    try {
      const result = await firebaseService.getCollection(this.categoriesCollection, {
        where: [{ field: 'isActive', operator: '==', value: true }]
      });
      return result;
    } catch (error: any) {
      console.error('Error getting categories:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a new category
  async createCategory(categoryData: Omit<AnnouncementCategory, 'id'>): Promise<ApiResponse<AnnouncementCategory>> {
    try {
      const firestoreData = {
        ...categoryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      const result = await firebaseService.addDocument(this.categoriesCollection, firestoreData);
      return result;
    } catch (error: any) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message };
    }
  }

  // Get announcement statistics
  async getAnnouncementStats(): Promise<ApiResponse<AnnouncementStats>> {
    try {
      const allAnnouncementsResult = await this.getAnnouncements({ includeInactive: true });
      if (!allAnnouncementsResult.success) {
        throw new Error('Failed to fetch announcements for stats');
      }

      const allAnnouncements = allAnnouncementsResult.data || [];
      const activeAnnouncements = allAnnouncements.filter(ann => ann.isActive !== false);
      const now = new Date();

      const stats: AnnouncementStats = {
        total: activeAnnouncements.length,
        published: activeAnnouncements.filter(ann => ann.isPublished).length,
        drafts: activeAnnouncements.filter(ann => !ann.isPublished).length,
        pinned: activeAnnouncements.filter(ann => ann.isPinned).length,
        archived: activeAnnouncements.filter(ann => ann.isArchived).length,
        today: activeAnnouncements.filter(ann => {
          const createdDate = new Date(ann.createdAt);
          return createdDate.toDateString() === now.toDateString();
        }).length,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byStatus: {} as Record<string, number>
      };

      // Calculate type statistics
      activeAnnouncements.forEach(ann => {
        stats.byType[ann.type] = (stats.byType[ann.type] || 0) + 1;
        stats.byPriority[ann.priority] = (stats.byPriority[ann.priority] || 0) + 1;
        stats.byCategory[ann.category] = (stats.byCategory[ann.category] || 0) + 1;
        
        if (ann.isPublished) {
          stats.byStatus.published = (stats.byStatus.published || 0) + 1;
        } else {
          stats.byStatus.draft = (stats.byStatus.draft || 0) + 1;
        }
        
        if (ann.isPinned) {
          stats.byStatus.pinned = (stats.byStatus.pinned || 0) + 1;
        }
        
        if (ann.isArchived) {
          stats.byStatus.archived = (stats.byStatus.archived || 0) + 1;
        }
      });

      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Error getting announcement stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Increment read count
  async incrementReadCount(id: string): Promise<ApiResponse<void>> {
    try {
      const announcementResult = await this.getAnnouncement(id);
      if (!announcementResult.success || !announcementResult.data) {
        return { success: false, error: 'Announcement not found' };
      }

      const currentReadCount = announcementResult.data.readCount || 0;
      const result = await firebaseService.updateDocument(this.collection, id, {
        readCount: currentReadCount + 1,
        updatedAt: new Date().toISOString()
      });
      return result;
    } catch (error: any) {
      console.error('Error incrementing read count:', error);
      return { success: false, error: error.message };
    }
  }

  // Increment like count
  async incrementLikeCount(id: string): Promise<ApiResponse<void>> {
    try {
      const announcementResult = await this.getAnnouncement(id);
      if (!announcementResult.success || !announcementResult.data) {
        return { success: false, error: 'Announcement not found' };
      }

      const currentLikeCount = announcementResult.data.likeCount || 0;
      const result = await firebaseService.updateDocument(this.collection, id, {
        likeCount: currentLikeCount + 1,
        updatedAt: new Date().toISOString()
      });
      return result;
    } catch (error: any) {
      console.error('Error incrementing like count:', error);
      return { success: false, error: error.message };
    }
  }
}

export const announcementService = new AnnouncementService();
