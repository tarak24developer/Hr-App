import firebaseService from './firebaseService';
import { Notification, NotificationCategory, NotificationFormData, NotificationStats, User } from '../types';

interface QueryOptions {
  where?: Array<{ field: string; operator: string; value: any }>;
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  startAfter?: any;
}

class NotificationService {
  private collection = 'notifications';
  private categoriesCollection = 'notificationCategories';

  // Get all notifications with optional filtering
  async getNotifications(options: QueryOptions = {}): Promise<any> {
    try {
      const result = await firebaseService.getCollection(this.collection, {
        ...options,
        orderBy: options.orderBy || [{ field: 'createdAt', direction: 'desc' }]
      });

      if (result.success && result.data) {
        // Filter for active notifications by default
        const notifications = Array.isArray(result.data) ? result.data : [];
        const activeNotifications = notifications.filter((notification: any) => notification.isActive !== false);

        // Apply additional filters
        let filteredNotifications = activeNotifications;

        if (options.where) {
          options.where.forEach(({ field, operator, value }) => {
            filteredNotifications = filteredNotifications.filter((notification: any) => {
              switch (operator) {
                case '==':
                  return notification[field] === value;
                case '!=':
                  return notification[field] !== value;
                case '>':
                  return notification[field] > value;
                case '>=':
                  return notification[field] >= value;
                case '<':
                  return notification[field] < value;
                case '<=':
                  return notification[field] <= value;
                case 'in':
                  return Array.isArray(value) && value.includes(notification[field]);
                case 'not-in':
                  return Array.isArray(value) && !value.includes(notification[field]);
                case 'array-contains':
                  return Array.isArray(notification[field]) && notification[field].includes(value);
                default:
                  return true;
              }
            });
          });
        }

        // Apply sorting
        if (options.orderBy && options.orderBy.length > 0) {
          filteredNotifications.sort((a: any, b: any) => {
            for (const order of options.orderBy!) {
              const aValue = a[order.field];
              const bValue = b[order.field];
              
              if (aValue < bValue) return order.direction === 'asc' ? -1 : 1;
              if (aValue > bValue) return order.direction === 'asc' ? 1 : -1;
            }
            return 0;
          });
        }

        return { ...result, data: filteredNotifications };
      }
      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get a single notification by ID
  async getNotification(id: string): Promise<any> {
    try {
      return await firebaseService.getDocument(this.collection, id);
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  }

  // Create a new notification
  async createNotification(notificationData: NotificationFormData): Promise<any> {
    try {
      const firestoreData = {
        ...notificationData,
        senderId: 'current-user-id', // This should come from auth context
        isRead: false,
        isPinned: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        metadata: notificationData.metadata || {},
        actions: notificationData.actions || []
      };

      // Remove undefined fields
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key as keyof typeof firestoreData] === undefined) {
          delete firestoreData[key as keyof typeof firestoreData];
        }
      });

      return await firebaseService.addDocument(this.collection, firestoreData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Update an existing notification
  async updateNotification(id: string, updateData: Partial<NotificationFormData>): Promise<any> {
    try {
      const firestoreData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key as keyof typeof firestoreData] === undefined) {
          delete firestoreData[key as keyof typeof firestoreData];
        }
      });

      return await firebaseService.updateDocument(this.collection, id, firestoreData);
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  // Delete a notification (soft delete)
  async deleteNotification(id: string): Promise<any> {
    try {
      return await firebaseService.updateDocument(this.collection, id, {
        isActive: false,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Permanently delete a notification
  async permanentDeleteNotification(id: string): Promise<any> {
    try {
      return await firebaseService.deleteDocument(this.collection, id);
    } catch (error) {
      console.error('Error permanently deleting notification:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<any> {
    try {
      return await firebaseService.updateDocument(this.collection, id, {
        isRead: true,
        readAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark notification as unread
  async markAsUnread(id: string): Promise<any> {
    try {
      return await firebaseService.updateDocument(this.collection, id, {
        isRead: false,
        readAt: null,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw error;
    }
  }

  // Pin/unpin notification
  async togglePin(id: string, isPinned: boolean): Promise<any> {
    try {
      return await firebaseService.updateDocument(this.collection, id, {
        isPinned,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling pin status:', error);
      throw error;
    }
  }

  // Archive notification
  async archiveNotification(id: string): Promise<any> {
    try {
      return await firebaseService.updateDocument(this.collection, id, {
        isArchived: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  // Get notification categories
  async getCategories(): Promise<any> {
    try {
      const result = await firebaseService.getCollection(this.categoriesCollection, {
        orderBy: [{ field: 'name', direction: 'asc' }]
      });

      if (result.success && result.data) {
        const categories = Array.isArray(result.data) ? result.data : [];
        return { ...result, data: categories.filter((cat: any) => cat.isActive !== false) };
      }
      return result;
    } catch (error) {
      console.error('Error fetching notification categories:', error);
      return { success: false, data: [], error: 'Failed to fetch categories' };
    }
  }

  // Get notification statistics
  async getNotificationStats(): Promise<any> {
    try {
      const result = await this.getNotifications({});
      
      if (!result.success || !result.data) {
        throw new Error('Failed to fetch notifications for stats');
      }

      const notifications = result.data;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter((n: any) => !n.isRead).length,
        pinned: notifications.filter((n: any) => n.isPinned).length,
        today: notifications.filter((n: any) => {
          const createdAt = new Date(n.createdAt);
          return createdAt >= today;
        }).length,
        byType: {},
        byPriority: {},
        byCategory: {},
        byStatus: {}
      };

      // Calculate breakdowns
      notifications.forEach((notification: any) => {
        // By type
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        
        // By priority
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
        
        // By category
        stats.byCategory[notification.category] = (stats.byCategory[notification.category] || 0) + 1;
        
        // By status
        const status = notification.isRead ? 'read' : 'unread';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  // Search notifications
  async searchNotifications(searchTerm: string, filters: any = {}): Promise<any> {
    try {
      const result = await this.getNotifications(filters);
      
      if (!result.success || !result.data) {
        return result;
      }

      const notifications = result.data;
      const searchLower = searchTerm.toLowerCase();
      
      const filtered = notifications.filter((notification: any) =>
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.category.toLowerCase().includes(searchLower)
      );

      return { ...result, data: filtered };
    } catch (error) {
      console.error('Error searching notifications:', error);
      throw error;
    }
  }

  // Get users for recipient selection
  async getUsers(): Promise<any> {
    try {
      const result = await firebaseService.getCollection('users', {
        orderBy: [{ field: 'firstName', direction: 'asc' }]
      });

      if (result.success && result.data) {
        const users = Array.isArray(result.data) ? result.data : [];
        return { ...result, data: users.filter((user: any) => user.isActive !== false) };
      }
      return result;
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, data: [], error: 'Failed to fetch users' };
    }
  }

  // Bulk operations
  async markAllAsRead(): Promise<any> {
    try {
      const result = await this.getNotifications({});
      
      if (!result.success || !result.data) {
        throw new Error('Failed to fetch notifications');
      }

      const unreadNotifications = result.data.filter((n: any) => !n.isRead);
      const updatePromises = unreadNotifications.map((notification: any) =>
        this.markAsRead(notification.id)
      );

      await Promise.all(updatePromises);
      return { success: true, message: 'All notifications marked as read' };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  async archiveAll(): Promise<any> {
    try {
      const result = await this.getNotifications({});
      
      if (!result.success || !result.data) {
        throw new Error('Failed to fetch notifications');
      }

      const activeNotifications = result.data.filter((n: any) => !n.isArchived);
      const archivePromises = activeNotifications.map((notification: any) =>
        this.archiveNotification(notification.id)
      );

      await Promise.all(archivePromises);
      return { success: true, message: 'All notifications archived' };
    } catch (error) {
      console.error('Error archiving all notifications:', error);
      throw error;
    }
  }
}

export default new NotificationService();