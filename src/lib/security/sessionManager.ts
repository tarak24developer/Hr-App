/**
 * Session Manager
 * Manages user sessions with timeout, concurrent session limits, and device tracking
 */

import type { UserSession, SessionSettings, DeviceInfo } from '@/types/security';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  maxConcurrentSessions: 3,
  sessionTimeout: 30, // 30 minutes
  absoluteTimeout: 8, // 8 hours
  refreshTokenExpiry: 7, // 7 days
  requireReauthForSensitive: true,
  logoutOnPasswordChange: true,
  secureCookies: true,
  sameSiteCookies: 'strict'
};

class SessionManager {
  private settings: SessionSettings = DEFAULT_SESSION_SETTINGS;
  private currentSession: UserSession | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private absoluteTimer: ReturnType<typeof setTimeout> | null = null;
  private activityListeners: (() => void)[] = [];

  constructor() {
    this.initializeActivityTracking();
  }

  /**
   * Create new session
   */
  public async createSession(userId: string): Promise<UserSession> {
    try {
      // Check existing sessions
      await this.enforceMaxSessions(userId);

      // Get device info
      const deviceInfo = this.getDeviceInfo();
      const fingerprint = await this.generateFingerprint(deviceInfo);

      const session: UserSession = {
        id: this.generateId(),
        userId,
        deviceId: fingerprint,
        deviceInfo,
        ipAddress: await this.getIpAddress(),
        userAgent: navigator.userAgent,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        expiresAt: this.calculateExpiry(),
        mfaVerified: false,
        fingerprint
      };

      // Save to storage
      if (db) {
        const docRef = await addDoc(collection(db, 'sessions'), {
          ...session,
          createdAt: Timestamp.fromDate(new Date(session.createdAt)),
          lastActivity: Timestamp.fromDate(new Date(session.lastActivity)),
          expiresAt: Timestamp.fromDate(new Date(session.expiresAt))
        });
        session.id = docRef.id;
      }

      this.currentSession = session;
      this.startSessionTimers();
      this.saveSessionToStorage(session);

      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Update session activity
   */
  public async updateActivity(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const now = new Date().toISOString();
      this.currentSession.lastActivity = now;

      if (db) {
        await updateDoc(doc(db, 'sessions', this.currentSession.id), {
          lastActivity: Timestamp.fromDate(new Date(now))
        });
      }

      this.saveSessionToStorage(this.currentSession);
      this.resetIdleTimer();
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  /**
   * End session
   */
  public async endSession(sessionId?: string): Promise<void> {
    try {
      const targetSessionId = sessionId || this.currentSession?.id;
      if (!targetSessionId) return;

      if (db) {
        await updateDoc(doc(db, 'sessions', targetSessionId), {
          isActive: false
        });
      }

      if (this.currentSession?.id === targetSessionId) {
        this.currentSession = null;
        this.clearSessionTimers();
        this.clearSessionFromStorage();
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * End all sessions for user
   */
  public async endAllSessions(userId: string): Promise<void> {
    try {
      if (!db) return;

      const q = query(collection(db, 'sessions'), where('userId', '==', userId), where('isActive', '==', true));
      const snapshot = await getDocs(q);

      const promises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { isActive: false })
      );
      await Promise.all(promises);

      if (this.currentSession?.userId === userId) {
        this.currentSession = null;
        this.clearSessionTimers();
        this.clearSessionFromStorage();
      }
    } catch (error) {
      console.error('Failed to end all sessions:', error);
    }
  }

  /**
   * Get user sessions
   */
  public async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      if (!db) {
        return this.currentSession?.userId === userId ? [this.currentSession] : [];
      }

      const q = query(collection(db, 'sessions'), where('userId', '==', userId), where('isActive', '==', true));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data()['createdAt'].toDate().toISOString(),
        lastActivity: doc.data()['lastActivity'].toDate().toISOString(),
        expiresAt: doc.data()['expiresAt'].toDate().toISOString()
      } as UserSession));
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Validate session
   */
  public async validateSession(sessionId: string): Promise<boolean> {
    try {
      if (!db) {
        return this.currentSession?.id === sessionId && this.currentSession.isActive;
      }

      const sessionDoc = await getDocs(query(collection(db, 'sessions'), where('id', '==', sessionId)));
      if (sessionDoc.empty) return false;

      const firstDoc = sessionDoc.docs[0];
      if (!firstDoc) return false;
      
      const session = firstDoc.data() as UserSession;
      if (!session.isActive) return false;

      // Check if expired
      if (new Date(session.expiresAt) < new Date()) {
        await this.endSession(sessionId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to validate session:', error);
      return false;
    }
  }

  /**
   * Enforce maximum concurrent sessions
   */
  private async enforceMaxSessions(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      if (sessions.length >= this.settings.maxConcurrentSessions) {
        // Sort by last activity (oldest first)
        sessions.sort((a, b) => 
          new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()
        );

        // End oldest sessions to make room
        const sessionsToEnd = sessions.slice(0, sessions.length - this.settings.maxConcurrentSessions + 1);
        await Promise.all(sessionsToEnd.map(s => this.endSession(s.id)));
      }
    } catch (error) {
      console.error('Failed to enforce max sessions:', error);
    }
  }

  /**
   * Start session timers
   */
  private startSessionTimers(): void {
    this.clearSessionTimers();

    // Idle timeout
    this.resetIdleTimer();

    // Absolute timeout
    const absoluteTimeoutMs = this.settings.absoluteTimeout * 60 * 60 * 1000;
    this.absoluteTimer = setTimeout(() => {
      this.handleSessionTimeout('absolute');
    }, absoluteTimeoutMs);
  }

  /**
   * Reset idle timer
   */
  private resetIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    const idleTimeoutMs = this.settings.sessionTimeout * 60 * 1000;
    this.idleTimer = setTimeout(() => {
      this.handleSessionTimeout('idle');
    }, idleTimeoutMs);
  }

  /**
   * Clear session timers
   */
  private clearSessionTimers(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.absoluteTimer) {
      clearTimeout(this.absoluteTimer);
      this.absoluteTimer = null;
    }
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(type: 'idle' | 'absolute'): void {
    console.log(`Session timeout (${type})`);
    if (this.currentSession) {
      this.endSession(this.currentSession.id);
    }
    
    // Notify listeners
    this.activityListeners.forEach(listener => listener());
    
    // Redirect to login
    window.location.href = '/login?reason=session_timeout';
  }

  /**
   * Initialize activity tracking
   */
  private initializeActivityTracking(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true });
    });
  }

  /**
   * Calculate session expiry
   */
  private calculateExpiry(): string {
    const now = new Date();
    now.setHours(now.getHours() + this.settings.absoluteTimeout);
    return now.toISOString();
  }

  /**
   * Get device info
   */
  private getDeviceInfo(): DeviceInfo {
    return {
      type: this.detectDeviceType(),
      os: this.detectOS(),
      osVersion: 'unknown',
      browser: this.detectBrowser(),
      browserVersion: 'unknown',
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Detect OS
   */
  private detectOS(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') !== -1) return 'Windows';
    if (ua.indexOf('Mac') !== -1) return 'MacOS';
    if (ua.indexOf('Linux') !== -1) return 'Linux';
    if (ua.indexOf('Android') !== -1) return 'Android';
    if (ua.indexOf('iOS') !== -1) return 'iOS';
    return 'Unknown';
  }

  /**
   * Detect browser
   */
  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Chrome') !== -1) return 'Chrome';
    if (ua.indexOf('Safari') !== -1) return 'Safari';
    if (ua.indexOf('Firefox') !== -1) return 'Firefox';
    if (ua.indexOf('Edge') !== -1) return 'Edge';
    return 'Unknown';
  }

  /**
   * Generate device fingerprint
   */
  private async generateFingerprint(deviceInfo: DeviceInfo): Promise<string> {
    const data = JSON.stringify({
      ...deviceInfo,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: new Date().getTimezoneOffset(),
      plugins: Array.from(navigator.plugins || []).map(p => p.name).join(',')
    });

    // Simple hash - in production, use a proper fingerprinting library
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get IP address
   */
  private async getIpAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Save session to storage
   */
  private saveSessionToStorage(session: UserSession): void {
    try {
      sessionStorage.setItem('current_session', JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session to storage:', error);
    }
  }

  /**
   * Clear session from storage
   */
  private clearSessionFromStorage(): void {
    try {
      sessionStorage.removeItem('current_session');
    } catch (error) {
      console.error('Failed to clear session from storage:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<SessionSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Restart timers with new settings
    if (this.currentSession) {
      this.startSessionTimers();
    }
  }

  /**
   * Subscribe to activity events
   */
  public onActivity(callback: () => void): () => void {
    this.activityListeners.push(callback);
    return () => {
      const index = this.activityListeners.indexOf(callback);
      if (index > -1) {
        this.activityListeners.splice(index, 1);
      }
    };
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

export default sessionManager;


