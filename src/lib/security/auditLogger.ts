/**
 * Audit Logger
 * Comprehensive audit logging for security and compliance
 */

import type {
  AuditLog,
  AuditAction,
  AuditChange,
  GeoLocation
} from '@/types/security';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

class AuditLogger {
  private logQueue: AuditLog[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 100;

  constructor() {
    // Start periodic flush
    this.startPeriodicFlush();
  }

  /**
   * Log an audit event
   */
  public async log(params: {
    tenantId: string;
    userId: string;
    userEmail: string;
    userName: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    description: string;
    metadata?: Record<string, any>;
    changes?: AuditChange[];
    severity?: 'info' | 'warning' | 'error' | 'critical';
    success?: boolean;
    errorMessage?: string;
    duration?: number;
  }): Promise<void> {
    try {
      const log: AuditLog = {
        id: this.generateId(),
        tenantId: params.tenantId,
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName,
        action: params.action,
        resource: params.resource,
        description: params.description,
        severity: params.severity || 'info',
        ipAddress: await this.getIpAddress(),
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
        success: params.success !== false,
        timestamp: new Date().toISOString()
      };
      
      if (params.resourceId) log.resourceId = params.resourceId;
      if (params.metadata) log.metadata = params.metadata;
      if (params.changes) log.changes = params.changes;
      if (params.errorMessage) log.errorMessage = params.errorMessage;
      if (params.duration) log.duration = params.duration;
      const location = await this.getLocation();
      if (location) log.location = location;

      // Add to queue
      this.logQueue.push(log);

      // Flush if queue is full
      if (this.logQueue.length >= this.maxQueueSize) {
        await this.flush();
      }

      // For critical events, flush immediately
      if (log.severity === 'critical') {
        await this.flush();
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw - audit logging should not break app functionality
    }
  }

  /**
   * Log login event
   */
  public async logLogin(userId: string, userEmail: string, userName: string, success: boolean, errorMessage?: string): Promise<void> {
    const logParams: any = {
      tenantId: 'default',
      userId,
      userEmail,
      userName,
      action: success ? 'login' as const : 'login_failed' as const,
      resource: 'auth',
      description: success ? 'User logged in successfully' : `Login failed: ${errorMessage || 'Unknown error'}`,
      severity: success ? 'info' as const : 'warning' as const,
      success
    };
    
    if (errorMessage) logParams.errorMessage = errorMessage;
    
    await this.log(logParams);
  }

  /**
   * Log logout event
   */
  public async logLogout(userId: string, userEmail: string, userName: string): Promise<void> {
    await this.log({
      tenantId: 'default',
      userId,
      userEmail,
      userName,
      action: 'logout',
      resource: 'auth',
      description: 'User logged out',
      severity: 'info'
    });
  }

  /**
   * Log password change
   */
  public async logPasswordChange(userId: string, userEmail: string, userName: string, success: boolean): Promise<void> {
    await this.log({
      tenantId: 'default',
      userId,
      userEmail,
      userName,
      action: 'password_change',
      resource: 'auth',
      description: success ? 'Password changed successfully' : 'Password change failed',
      severity: success ? 'info' : 'warning',
      success
    });
  }

  /**
   * Log sensitive data access
   */
  public async logSensitiveDataAccess(
    userId: string,
    userEmail: string,
    userName: string,
    resource: string,
    resourceId: string,
    description: string
  ): Promise<void> {
    await this.log({
      tenantId: 'default',
      userId,
      userEmail,
      userName,
      action: 'sensitive_data_access',
      resource,
      resourceId,
      description,
      severity: 'warning'
    });
  }

  /**
   * Log data modification with changes
   */
  public async logDataModification(
    userId: string,
    userEmail: string,
    userName: string,
    resource: string,
    resourceId: string,
    action: AuditAction,
    changes: AuditChange[],
    description: string
  ): Promise<void> {
    await this.log({
      tenantId: 'default',
      userId,
      userEmail,
      userName,
      action,
      resource,
      resourceId,
      description,
      changes,
      severity: 'info'
    });
  }

  /**
   * Log security violation
   */
  public async logSecurityViolation(
    userId: string,
    userEmail: string,
    userName: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const logParams: any = {
      tenantId: 'default',
      userId,
      userEmail,
      userName,
      action: 'security_violation' as const,
      resource: 'security',
      description,
      severity: 'critical' as const
    };
    
    if (metadata) logParams.metadata = metadata;
    
    await this.log(logParams);
  }

  /**
   * Flush queue to persistent storage
   */
  private async flush(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logsToFlush = [...this.logQueue];
    this.logQueue = [];

    try {
      if (db) {
        // Batch write to Firestore
        const promises = logsToFlush.map(log =>
          addDoc(collection(db!, 'audit_logs'), {
            ...log,
            timestamp: Timestamp.fromDate(new Date(log.timestamp))
          })
        );
        await Promise.all(promises);
      } else {
        // Fallback to localStorage if Firestore not available
        const existing = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        localStorage.setItem('audit_logs', JSON.stringify([...existing, ...logsToFlush].slice(-1000)));
      }
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Re-add logs to queue for retry
      this.logQueue.unshift(...logsToFlush);
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Query audit logs
   */
  public async queryLogs(params: {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limitCount?: number;
  }): Promise<AuditLog[]> {
    try {
      if (!db) {
        // Fallback to localStorage
        const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        return logs.filter((log: AuditLog) => {
          if (params.userId && log.userId !== params.userId) return false;
          if (params.action && log.action !== params.action) return false;
          if (params.resource && log.resource !== params.resource) return false;
          if (params.severity && log.severity !== params.severity) return false;
          if (params.startDate && new Date(log.timestamp) < params.startDate) return false;
          if (params.endDate && new Date(log.timestamp) > params.endDate) return false;
          return true;
        }).slice(0, params.limitCount || 100);
      }

      // Query Firestore
      let q = query(collection(db, 'audit_logs'));

      if (params.userId) {
        q = query(q, where('userId', '==', params.userId));
      }
      if (params.action) {
        q = query(q, where('action', '==', params.action));
      }
      if (params.resource) {
        q = query(q, where('resource', '==', params.resource));
      }
      if (params.severity) {
        q = query(q, where('severity', '==', params.severity));
      }

      q = query(q, orderBy('timestamp', 'desc'), limit(params.limitCount || 100));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data()['timestamp'].toDate().toISOString()
      } as AuditLog));
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }

  /**
   * Get recent logs for user
   */
  public async getUserRecentLogs(userId: string, limitCount: number = 50): Promise<AuditLog[]> {
    return this.queryLogs({ userId, limitCount });
  }

  /**
   * Helper: Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Get IP address
   */
  private async getIpAddress(): Promise<string> {
    try {
      // In production, this would be handled by the backend
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Helper: Get geolocation
   */
  private async getLocation(): Promise<GeoLocation | undefined> {
    try {
      // This is a simplified version - in production, use a proper geolocation API
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Helper: Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

export default auditLogger;


