import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Firebase Collections Schema for User Tracking
export const TRACKING_COLLECTIONS = {
  USER_TRACKING: 'userTracking',
  USER_CONSENT: 'userTrackingConsent',
  LOCATION_HISTORY: 'locationHistory',
  DEVICE_SESSIONS: 'deviceSessions',
  TRACKING_ANALYTICS: 'trackingAnalytics'
};

// User Tracking Record Interface
export interface UserTrackingRecord {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    deviceType: string;
    screenResolution: string;
    deviceId: string;
  };
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  lastSeen: Date;
  isOnline: boolean;
  status: 'online' | 'offline' | 'idle' | 'away';
  totalDistance?: number;
  lastActivity?: Date;
  loginTime?: Date;
  sessionId: string;
  createdAt?: any;
  updatedAt?: any;
}

// User Consent Record Interface
export interface UserConsentRecord {
  id?: string;
  userId: string;
  hasConsent: boolean;
  consentDate: Date;
  deviceInfo: any;
  ipAddress?: string;
  userAgent?: string;
  consentVersion: string;
  createdAt?: any;
  updatedAt?: any;
}

// Location History Record Interface
export interface LocationHistoryRecord {
  id?: string;
  userId: string;
  sessionId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    address?: string;
  };
  activity: 'login' | 'logout' | 'move' | 'idle' | 'active';
  createdAt?: any;
}

// Device Session Record Interface
export interface DeviceSessionRecord {
  id?: string;
  userId: string;
  sessionId: string;
  deviceInfo: any;
  loginTime: Date;
  logoutTime?: Date;
  isActive: boolean;
  totalDistance: number;
  locationsCount: number;
  createdAt?: any;
  updatedAt?: any;
}

class TrackingDataService {
  // Initialize tracking collections with sample data
  async initializeTrackingCollections() {
    try {
      console.log('Initializing tracking collections...');
      
      // Initialize user tracking consent collection
      await this.initializeUserConsentCollection();
      
      // Initialize tracking analytics collection
      await this.initializeTrackingAnalyticsCollection();
      
      console.log('✅ Tracking collections initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('Error initializing tracking collections:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Initialize user consent collection
  private async initializeUserConsentCollection() {
    try {
      if (!db) throw new Error('Firestore not initialized');
      const consentCollection = collection(db, TRACKING_COLLECTIONS.USER_CONSENT);
      const existingConsent = await getDocs(consentCollection);
      
      if (existingConsent.empty) {
        console.log('User consent collection is empty - ready for real user data');
      } else {
        console.log(`✅ Found ${existingConsent.size} existing consent records`);
      }
    } catch (error) {
      console.error('Error checking user consent collection:', error);
    }
  }

  // Initialize tracking analytics collection
  private async initializeTrackingAnalyticsCollection() {
    try {
      if (!db) throw new Error('Firestore not initialized');
      const analyticsCollection = collection(db, TRACKING_COLLECTIONS.TRACKING_ANALYTICS);
      const existingAnalytics = await getDocs(analyticsCollection);
      
      if (existingAnalytics.empty) {
        console.log('Tracking analytics collection is empty - ready for real analytics data');
      } else {
        console.log(`✅ Found ${existingAnalytics.size} existing analytics records`);
      }
    } catch (error) {
      console.error('Error checking tracking analytics collection:', error);
    }
  }

  // Save user tracking record
  async saveUserTrackingRecord(record: UserTrackingRecord) {
    try {
      if (!db) {
        console.warn('Firebase not available, saving to localStorage');
        localStorage.setItem('userTrackingRecord', JSON.stringify(record));
        return { success: true, data: record };
      }

      const collectionRef = collection(db, TRACKING_COLLECTIONS.USER_TRACKING);
      
      // Check if record already exists for this user
      const existingQuery = query(
        collectionRef,
        where('userId', '==', record.userId),
        where('sessionId', '==', record.sessionId)
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        // Update existing record
        const docRef = doc(db!, TRACKING_COLLECTIONS.USER_TRACKING, existingDocs.docs[0]!.id);
        await updateDoc(docRef, {
          ...record,
          updatedAt: serverTimestamp()
        });
        
        return { success: true, data: { id: existingDocs.docs[0]!.id, ...record } };
      } else {
        // Create new record
        const docRef = await addDoc(collectionRef, {
          ...record,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { success: true, data: { id: docRef.id, ...record } };
      }
    } catch (error) {
      console.error('Error saving user tracking record:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Save user consent record
  async saveUserConsentRecord(record: UserConsentRecord) {
    try {
      if (!db) {
        console.warn('Firebase not available, saving to localStorage');
        localStorage.setItem('userConsentRecord', JSON.stringify(record));
        return { success: true, data: record };
      }

      const collectionRef = collection(db, TRACKING_COLLECTIONS.USER_CONSENT);
      
      // Check if consent already exists for this user
      const existingQuery = query(
        collectionRef,
        where('userId', '==', record.userId)
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        // Update existing consent
        const docRef = doc(db!, TRACKING_COLLECTIONS.USER_CONSENT, existingDocs.docs[0]!.id);
        await updateDoc(docRef, {
          ...record,
          updatedAt: serverTimestamp()
        });
        
        return { success: true, data: { id: existingDocs.docs[0]!.id, ...record } };
      } else {
        // Create new consent
        const docRef = await addDoc(collectionRef, {
          ...record,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { success: true, data: { id: docRef.id, ...record } };
      }
    } catch (error) {
      console.error('Error saving user consent record:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Save location history record
  async saveLocationHistoryRecord(record: LocationHistoryRecord) {
    try {
      if (!db) {
        console.warn('Firebase not available, saving to localStorage');
        const history = JSON.parse(localStorage.getItem('locationHistory') || '[]');
        history.push(record);
        localStorage.setItem('locationHistory', JSON.stringify(history));
        return { success: true, data: record };
      }

      const collectionRef = collection(db, TRACKING_COLLECTIONS.LOCATION_HISTORY);
      const docRef = await addDoc(collectionRef, {
        ...record,
        createdAt: serverTimestamp()
      });
      
      return { success: true, data: { id: docRef.id, ...record } };
    } catch (error) {
      console.error('Error saving location history record:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Get all user tracking records
  async getAllUserTrackingRecords(): Promise<UserTrackingRecord[]> {
    try {
      if (!db) {
        console.warn('Firebase not available, returning empty array');
        return [];
      }

      const collectionRef = collection(db, TRACKING_COLLECTIONS.USER_TRACKING);
      const q = query(
        collectionRef,
        orderBy('lastSeen', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records: UserTrackingRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          lastSeen: data['lastSeen']?.toDate ? data['lastSeen'].toDate() : new Date(data['lastSeen']),
          lastActivity: data['lastActivity']?.toDate ? data['lastActivity'].toDate() : new Date(data['lastActivity']),
          loginTime: data['loginTime']?.toDate ? data['loginTime'].toDate() : new Date(data['loginTime'])
        } as UserTrackingRecord);
      });
      
      return records;
    } catch (error) {
      console.error('Error getting user tracking records:', error);
      return [];
    }
  }

  // Get user consent by userId
  async getUserConsent(userId: string): Promise<UserConsentRecord | null> {
    try {
      if (!db) {
        console.warn('Firebase not available, checking localStorage');
        const consent = localStorage.getItem('userConsentRecord');
        return consent ? JSON.parse(consent) : null;
      }

      const collectionRef = collection(db, TRACKING_COLLECTIONS.USER_CONSENT);
      const q = query(
        collectionRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0]!.data();
        return {
          id: querySnapshot.docs[0]!.id,
          ...data,
          consentDate: data['consentDate']?.toDate ? data['consentDate'].toDate() : new Date(data['consentDate'])
        } as UserConsentRecord;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user consent:', error);
      return null;
    }
  }

  // Get location history for a user
  async getUserLocationHistory(userId: string, limitCount: number = 100): Promise<LocationHistoryRecord[]> {
    try {
      if (!db) {
        console.warn('Firebase not available, returning empty array');
        return [];
      }

      const collectionRef = collection(db, TRACKING_COLLECTIONS.LOCATION_HISTORY);
      const q = query(
        collectionRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const records: LocationHistoryRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data,
          createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date(data['createdAt'])
        } as LocationHistoryRecord);
      });
      
      return records;
    } catch (error) {
      console.error('Error getting user location history:', error);
      return [];
    }
  }

  // Set up real-time listener for user tracking records
  setupUserTrackingListener(callback: (records: UserTrackingRecord[]) => void) {
    try {
      if (!db) {
        console.warn('Firebase not available for real-time listener');
        return null;
      }

      const collectionRef = collection(db, TRACKING_COLLECTIONS.USER_TRACKING);
      const q = query(
        collectionRef,
        orderBy('lastSeen', 'desc')
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const records: UserTrackingRecord[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          records.push({
            id: doc.id,
            ...data,
            lastSeen: data['lastSeen']?.toDate ? data['lastSeen'].toDate() : new Date(data['lastSeen']),
            lastActivity: data['lastActivity']?.toDate ? data['lastActivity'].toDate() : new Date(data['lastActivity']),
            loginTime: data['loginTime']?.toDate ? data['loginTime'].toDate() : new Date(data['loginTime'])
          } as UserTrackingRecord);
        });
        callback(records);
      }, (error) => {
        console.error('Error in user tracking listener:', error);
      });
    } catch (error) {
      console.error('Error setting up user tracking listener:', error);
      return null;
    }
  }

  // Update tracking analytics
  async updateTrackingAnalytics() {
    try {
      if (!db) {
        console.warn('Firebase not available for analytics update');
        return { success: false, error: 'Firebase not available' };
      }

      const today = new Date().toISOString().split('T')[0];
      const trackingRecords = await this.getAllUserTrackingRecords();
      
      // Calculate analytics
      const totalUsers = trackingRecords.length;
      const onlineUsers = trackingRecords.filter(record => record.isOnline).length;
      const totalDistance = trackingRecords.reduce((sum, record) => sum + (record.totalDistance || 0), 0);
      const averageAccuracy = trackingRecords.reduce((sum, record) => sum + record.currentLocation.accuracy, 0) / totalUsers;
      
      const deviceTypes = trackingRecords.reduce((acc, record) => {
        const type = record.deviceInfo.deviceType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const uniqueLocations = new Set(
        trackingRecords.map(record => 
          `${record.currentLocation.latitude.toFixed(2)},${record.currentLocation.longitude.toFixed(2)}`
        )
      ).size;
      
      const analyticsData = {
        date: today,
        totalUsers,
        onlineUsers,
        totalDistance,
        averageAccuracy: isNaN(averageAccuracy) ? 0 : averageAccuracy,
        deviceTypes: {
          desktop: deviceTypes['desktop'] || 0,
          laptop: deviceTypes['laptop'] || 0,
          mobile: deviceTypes['mobile'] || 0,
          tablet: deviceTypes['tablet'] || 0
        },
        locations: {
          total: trackingRecords.length,
          unique: uniqueLocations
        },
        updatedAt: serverTimestamp()
      };
      
      // Check if analytics record exists for today
      const analyticsCollection = collection(db, TRACKING_COLLECTIONS.TRACKING_ANALYTICS);
      const todayQuery = query(
        analyticsCollection,
        where('date', '==', today)
      );
      
      const existingAnalytics = await getDocs(todayQuery);
      
      if (!existingAnalytics.empty) {
        // Update existing analytics
        const docRef = doc(db!, TRACKING_COLLECTIONS.TRACKING_ANALYTICS, existingAnalytics.docs[0]!.id);
        await updateDoc(docRef, analyticsData);
      } else {
        // Create new analytics record
        await addDoc(analyticsCollection, {
          ...analyticsData,
          createdAt: serverTimestamp()
        });
      }
      
      return { success: true, data: analyticsData };
    } catch (error) {
      console.error('Error updating tracking analytics:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Clean up old tracking data
  async cleanupOldTrackingData(daysToKeep: number = 30) {
    try {
      if (!db) {
        console.warn('Firebase not available for cleanup');
        return { success: false, error: 'Firebase not available' };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Clean up old location history
      const historyCollection = collection(db, TRACKING_COLLECTIONS.LOCATION_HISTORY);
      const oldHistoryQuery = query(
        historyCollection,
        where('createdAt', '<', cutoffDate)
      );
      
      const oldHistoryDocs = await getDocs(oldHistoryQuery);
      const batch = writeBatch(db);
      
      oldHistoryDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`✅ Cleaned up ${oldHistoryDocs.size} old location history records`);
      return { success: true, cleaned: oldHistoryDocs.size };
    } catch (error) {
      console.error('Error cleaning up old tracking data:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Create and export a single instance
const trackingDataService = new TrackingDataService();
export default trackingDataService;
