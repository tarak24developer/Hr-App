/**
 * Integration Manager
 * Manages third-party integrations for HR systems
 */

import { collection, addDoc, updateDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

export type IntegrationType =
  | 'slack'
  | 'microsoft_teams'
  | 'google_workspace'
  | 'zoom'
  | 'jira'
  | 'salesforce'
  | 'sap'
  | 'workday'
  | 'adp'
  | 'bamboohr'
  | 'gusto'
  | 'zenefits'
  | 'custom_api';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  enabled: boolean;
  config: IntegrationConfig;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSyncAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConfig {
  apiUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookUrl?: string;
  syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  syncDirection?: 'inbound' | 'outbound' | 'bidirectional';
  mappings?: Record<string, string>;
  customFields?: Record<string, any>;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  action: 'sync' | 'push' | 'pull' | 'webhook' | 'error';
  status: 'success' | 'failed' | 'partial';
  recordsProcessed?: number;
  recordsFailed?: number;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

class IntegrationManager {
  /**
   * Create integration
   */
  public async createIntegration(
    integration: Omit<Integration, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      if (!db) throw new Error('Firestore not available');

      const newIntegration: Omit<Integration, 'id'> = {
        ...integration,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'integrations'), {
        ...newIntegration,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }

  /**
   * Get all integrations
   */
  public async getIntegrations(): Promise<Integration[]> {
    try {
      if (!db) throw new Error('Firestore not available');

      const snapshot = await getDocs(collection(db, 'integrations'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString(),
        lastSyncAt: doc.data().lastSyncAt?.toDate().toISOString()
      })) as Integration[];
    } catch (error) {
      console.error('Error fetching integrations:', error);
      return [];
    }
  }

  /**
   * Get integration by ID
   */
  public async getIntegration(integrationId: string): Promise<Integration | null> {
    try {
      if (!db) throw new Error('Firestore not available');

      const snapshot = await getDocs(
        query(collection(db, 'integrations'), where('id', '==', integrationId))
      );

      if (snapshot.empty || !snapshot.docs[0]) return null;

      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();
      return {
        id: firstDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
        lastSyncAt: data.lastSyncAt?.toDate().toISOString()
      } as Integration;
    } catch (error) {
      console.error('Error fetching integration:', error);
      return null;
    }
  }

  /**
   * Update integration
   */
  public async updateIntegration(
    integrationId: string,
    updates: Partial<Integration>
  ): Promise<void> {
    try {
      if (!db) throw new Error('Firestore not available');

      await updateDoc(doc(db, 'integrations', integrationId), {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating integration:', error);
      throw error;
    }
  }

  /**
   * Test integration connection
   */
  public async testConnection(integrationId: string): Promise<boolean> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) throw new Error('Integration not found');

      // Implementation would vary by integration type
      // This is a placeholder that returns true for demo
      await this.logIntegrationAction(integrationId, {
        action: 'sync',
        status: 'success',
        metadata: { type: 'connection_test' }
      });

      return true;
    } catch (error) {
      console.error('Error testing connection:', error);
      await this.logIntegrationAction(integrationId, {
        action: 'error',
        status: 'failed',
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Sync data with integration
   */
  public async syncIntegration(integrationId: string): Promise<{
    success: boolean;
    recordsProcessed: number;
    recordsFailed: number;
  }> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) throw new Error('Integration not found');
      if (!integration.enabled) throw new Error('Integration is disabled');

      const startTime = Date.now();
      
      // Implementation would vary by integration type
      // This is a simplified version
      const result = {
        success: true,
        recordsProcessed: 0,
        recordsFailed: 0
      };

      const duration = Date.now() - startTime;

      await this.logIntegrationAction(integrationId, {
        action: 'sync',
        status: 'success',
        recordsProcessed: result.recordsProcessed,
        recordsFailed: result.recordsFailed,
        duration
      });

      // Update last sync time
      await this.updateIntegration(integrationId, {
        lastSyncAt: new Date().toISOString(),
        status: 'connected'
      });

      return result;
    } catch (error) {
      console.error('Error syncing integration:', error);
      await this.logIntegrationAction(integrationId, {
        action: 'sync',
        status: 'failed',
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Log integration action
   */
  private async logIntegrationAction(
    integrationId: string,
    logData: Omit<IntegrationLog, 'id' | 'integrationId' | 'createdAt'>
  ): Promise<void> {
    try {
      if (!db) return;

      await addDoc(collection(db, 'integration_logs'), {
        integrationId,
        ...logData,
        createdAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error logging integration action:', error);
    }
  }

  /**
   * Get integration logs
   */
  public async getIntegrationLogs(
    integrationId: string,
    limitCount: number = 50
  ): Promise<IntegrationLog[]> {
    try {
      if (!db) throw new Error('Firestore not available');

      const snapshot = await getDocs(
        query(
          collection(db, 'integration_logs'),
          where('integrationId', '==', integrationId)
        )
      );

      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString()
        }))
        .slice(0, limitCount) as IntegrationLog[];
    } catch (error) {
      console.error('Error fetching integration logs:', error);
      return [];
    }
  }

  /**
   * Enable integration
   */
  public async enableIntegration(integrationId: string): Promise<void> {
    await this.updateIntegration(integrationId, { enabled: true });
  }

  /**
   * Disable integration
   */
  public async disableIntegration(integrationId: string): Promise<void> {
    await this.updateIntegration(integrationId, { enabled: false, status: 'disconnected' });
  }
}

export const integrationManager = new IntegrationManager();
export default integrationManager;
