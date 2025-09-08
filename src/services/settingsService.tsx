import firebaseService from './firebaseService';
import { UserSettings, NotificationSettings, PrivacySettings, Theme } from '../types';

export class SettingsService {
  private collection = 'settings';

  // Get user settings
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const settings = await firebaseService.getDocument(this.collection, userId);
      return settings as UserSettings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  // Create or update user settings
  async saveUserSettings(userId: string, settings: Partial<UserSettings>): Promise<boolean> {
    try {
      const existingSettings = await this.getUserSettings(userId);
      
      const settingsData = {
        ...existingSettings,
        ...settings,
        updatedAt: new Date().toISOString()
      };

      // If no existing settings, add createdAt
      if (!existingSettings) {
        settingsData.createdAt = new Date().toISOString();
      }

      // Use setDoc with merge to create or update
      await firebaseService.setDocument(this.collection, userId, settingsData);
      return true;
    } catch (error) {
      console.error('Error saving user settings:', error);
      return false;
    }
  }

  // Update theme settings
  async updateTheme(userId: string, theme: Theme): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId) || this.getDefaultSettings();
      return await this.saveUserSettings(userId, {
        ...settings,
        theme
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      return false;
    }
  }

  // Update notification settings
  async updateNotificationSettings(userId: string, notifications: NotificationSettings): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId) || this.getDefaultSettings();
      return await this.saveUserSettings(userId, {
        ...settings,
        notifications
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  // Update privacy settings
  async updatePrivacySettings(userId: string, privacy: PrivacySettings): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId) || this.getDefaultSettings();
      return await this.saveUserSettings(userId, {
        ...settings,
        privacy
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return false;
    }
  }

  // Update language and timezone
  async updateLanguageAndTimezone(userId: string, language: string, timezone: string): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId) || this.getDefaultSettings();
      return await this.saveUserSettings(userId, {
        ...settings,
        language,
        timezone
      });
    } catch (error) {
      console.error('Error updating language and timezone:', error);
      return false;
    }
  }

  // Get default settings
  getDefaultSettings(): UserSettings {
    return {
      theme: {
        mode: 'auto',
        primaryColor: '#3B82F6',
        accentColor: '#10B981',
        borderRadius: 8,
        fontSize: 'medium'
      },
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        sms: false,
        types: ['info', 'success', 'warning', 'error', 'system']
      },
      privacy: {
        profileVisibility: 'team-only',
        locationSharing: false,
        activityTracking: true
      }
    };
  }

  // Reset settings to default
  async resetToDefault(userId: string): Promise<boolean> {
    try {
      const defaultSettings = this.getDefaultSettings();
      return await this.saveUserSettings(userId, defaultSettings);
    } catch (error) {
      console.error('Error resetting settings to default:', error);
      return false;
    }
  }
}

export const settingsService = new SettingsService();

