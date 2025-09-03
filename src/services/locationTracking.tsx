import { 
  collection, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import trackingDataService, { 
  UserTrackingRecord, 
  UserConsentRecord, 
  LocationHistoryRecord 
} from './trackingDataService';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string | undefined;
}

// DeviceInfo interface is now part of UserTrackingRecord in trackingDataService

// UserTrackingRecord interface is now imported from trackingDataService

class LocationTrackingService {
  private watchId: number | null = null;
  private isTracking: boolean = false;
  private consentGiven: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;

  private currentLocation: LocationData | null = null;
  private eventListeners: Record<string, Function[]> = {};
  private currentUser: any = null;
  private trackingRecordId: string | null = null;
  private sessionId: string = '';
  private lastLocation: LocationData | null = null;
  private totalDistance: number = 0;

  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.consentGiven = false;
    this.updateInterval = null;

    this.currentLocation = null;
    this.eventListeners = {};
    this.currentUser = null;
    this.trackingRecordId = null;
    this.sessionId = this.generateSessionId();
    this.lastLocation = null;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get client IP address (simplified version)
  private async getClientIP(): Promise<string> {
    try {
      // This is a simplified approach - in production you might want to use a service
      return 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // Set current user for tracking
  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  // Check if user has already given consent
  async checkExistingConsent(): Promise<boolean> {
    try {
      console.log('Checking existing consent...');
      
      if (!this.currentUser) {
        console.log('No current user set');
        return false;
      }

      // Use tracking data service to check consent
      const consentRecord = await trackingDataService.getUserConsent(this.currentUser.id);
      
      if (consentRecord) {
        this.consentGiven = consentRecord.hasConsent === true;
        console.log('Existing consent found:', this.consentGiven);
        return this.consentGiven;
      }

      // Fallback to localStorage
      const consent = localStorage.getItem('locationConsent');
      this.consentGiven = consent === 'true';
      console.log('Existing consent found in localStorage:', this.consentGiven);
      return this.consentGiven;
    } catch (error) {
      console.error('Error checking existing consent:', error);
      return false;
    }
  }

  // Request location consent and start tracking
  async requestConsent(): Promise<{ success: boolean; data: { hasConsent: boolean } }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      if (!this.currentUser) {
        reject(new Error('No current user set'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async () => {
          try {
            // Get device info
            const deviceInfo = this.getDeviceInfo();
            
            // Save consent using tracking data service
            try {
              const consentRecord: UserConsentRecord = {
                userId: this.currentUser.id,
                hasConsent: true,
                consentDate: new Date(),
                deviceInfo: deviceInfo,
                ipAddress: await this.getClientIP(),
                userAgent: navigator.userAgent,
                consentVersion: '1.0'
              };
              
              await trackingDataService.saveUserConsentRecord(consentRecord);
              console.log('Consent saved successfully');
            } catch (consentError) {
              console.error('Error saving consent:', consentError);
            }
            
            // Save consent to localStorage as fallback
            localStorage.setItem('locationConsent', 'true');
            localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));

            this.consentGiven = true;
            this.startTracking();
            resolve({ success: true, data: { hasConsent: true } });
          } catch (error: any) {
            console.error('Error saving consent:', error);
            reject(error);
          }
        },
        (error: GeolocationPositionError) => {
          console.error('Geolocation error:', error);
          reject(new Error('Failed to get location permission'));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );
    });
  }

  // Initialize tracking with consent checking
  async initializeTracking() {
    try {
      console.log('Initializing tracking...');
      // Check if user has already given consent
      const hasConsent = await this.checkExistingConsent();
      if (hasConsent) {
        console.log('Starting tracking with existing consent');
        this.startTracking();
        return { success: true, message: 'Tracking resumed with existing consent' };
      }
      console.log('No existing consent found, tracking not started');
      return { success: false, message: 'No existing consent found' };
    } catch (error: any) {
      console.error('Error initializing tracking:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return { success: false, message: 'Failed to initialize tracking' };
    }
  }

  // Start location tracking
  startTracking() {
    if (this.isTracking || !this.consentGiven) {
      return;
    }

    this.isTracking = true;

    // Watch for location changes with improved settings
    this.watchId = navigator.geolocation.watchPosition(
      this.handleLocationUpdate.bind(this),
      this.handleLocationError.bind(this),
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 10000 // Reduced cache time for more frequent updates
      }
    );

    // Also update status periodically
    this.updateInterval = setInterval(() => {
      this.updateStatus('online');
    }, 60000); // Update status every minute

    console.log('Location tracking started');
  }

  // Stop location tracking
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  // Handle location updates
  async handleLocationUpdate(position: GeolocationPosition) {
    try {
      const { latitude, longitude, accuracy } = position.coords;
      
      console.log('📍 Location update received:', {
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
        accuracy: `${accuracy}m`,
        timestamp: new Date().toISOString()
      });
      
      // Get address using reverse geocoding
      let address = undefined;
      try {
        address = await this.reverseGeocode(latitude, longitude);
        if (address) {
          console.log('🏠 Address resolved:', address);
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
      }
      
      // Store current location
      this.currentLocation = {
        latitude,
        longitude,
        accuracy,
        timestamp: Date.now(),
        address
      };
      
      // Calculate distance from last location
      let distance = 0;
      if (this.lastLocation) {
        distance = this.calculateDistance(
          this.lastLocation.latitude,
          this.lastLocation.longitude,
          latitude,
          longitude
        );
      }
      
      // Save location using tracking data service
      if (this.currentUser && this.currentLocation) {
        try {
          const deviceInfo = this.getDeviceInfo();
          const trackingData: UserTrackingRecord = {
            userId: this.currentUser.id,
            userName: this.currentUser.firstName && this.currentUser.lastName 
              ? `${this.currentUser.firstName} ${this.currentUser.lastName}` 
              : this.currentUser.email || 'Unknown User',
            userEmail: this.currentUser.email || '',
            userRole: this.currentUser.role || 'employee',
            userDepartment: this.currentUser.department || '',
            deviceInfo: {
              userAgent: deviceInfo.userAgent,
              platform: deviceInfo.platform || 'unknown',
              language: deviceInfo.language,
              timezone: deviceInfo.timezone,
              browser: deviceInfo.browser,
              browserVersion: deviceInfo.browserVersion || 'unknown',
              os: deviceInfo.os,
              osVersion: deviceInfo.osVersion || 'unknown',
              deviceType: deviceInfo.deviceType,
              screenResolution: deviceInfo.screenResolution,
              deviceId: this.sessionId
            },
            currentLocation: {
              latitude: this.currentLocation.latitude,
              longitude: this.currentLocation.longitude,
              accuracy: this.currentLocation.accuracy,
              timestamp: this.currentLocation.timestamp,
              ...(this.currentLocation.address && { address: this.currentLocation.address })
            },
            lastSeen: new Date(),
            isOnline: true,
            status: 'online',
            lastActivity: new Date(),
            loginTime: new Date(),
            sessionId: this.sessionId,
            totalDistance: (this.totalDistance || 0) + distance
          };

          const result = await trackingDataService.saveUserTrackingRecord(trackingData);
          if (result.success && result.data?.id) {
            this.trackingRecordId = result.data.id;
          }
          
          // Save location history
          const historyRecord: LocationHistoryRecord = {
            userId: this.currentUser.id,
            sessionId: this.sessionId,
            location: {
              latitude: this.currentLocation.latitude,
              longitude: this.currentLocation.longitude,
              accuracy: this.currentLocation.accuracy,
              timestamp: this.currentLocation.timestamp,
              ...(this.currentLocation.address && { address: this.currentLocation.address })
            },
            activity: distance > 0.01 ? 'move' : 'idle' // Consider movement if distance > 10m
          };
          
          await trackingDataService.saveLocationHistoryRecord(historyRecord);
          
          console.log('Location saved successfully');
        } catch (trackingError) {
          console.error('Error saving location:', trackingError);
        }
      }
      
      // Save location to localStorage as fallback
      const locationData = {
        latitude,
        longitude,
        accuracy,
        timestamp: Date.now(),
        userInfo: this.getDeviceInfo()
      };
      
      localStorage.setItem('lastLocation', JSON.stringify(locationData));
      console.log('Location updated:', { latitude, longitude, accuracy });
      
      // Update last location and total distance
      this.lastLocation = this.currentLocation;
      this.totalDistance = (this.totalDistance || 0) + distance;
      
      // Emit location update event
      this.emit('location_update', this.currentLocation);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  // Calculate distance between two coordinates (in kilometers)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  // Convert degrees to radians
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Reverse geocoding to get address from coordinates
  private async reverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
    try {
      // Using a free geocoding service (you can replace with your preferred service)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      // Format the address
      const parts = [];
      if (data.locality) parts.push(data.locality);
      if (data.principalSubdivision) parts.push(data.principalSubdivision);
      if (data.countryName) parts.push(data.countryName);
      
      return parts.length > 0 ? parts.join(', ') : undefined;
    } catch (error) {
      console.warn('Reverse geocoding error:', error);
      return undefined;
    }
  }

  // Handle location errors
  handleLocationError(error: GeolocationPositionError) {
    console.error('Location error:', {
      code: error.code,
      message: error.message,
      PERMISSION_DENIED: error.PERMISSION_DENIED,
      POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
      TIMEOUT: error.TIMEOUT
    });
    this.stopTracking();
  }

  // Update user status
  async updateStatus(status: string) {
    try {
      // Save status to localStorage for demo
      localStorage.setItem('userStatus', status);
      console.log('Status updated:', status);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  // Get device information
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    return {
      userAgent,
      platform: navigator.platform || 'unknown',
      browser: this.getBrowserInfo(),
      browserVersion: this.getBrowserVersion(),
      os: this.getOSInfo(),
      osVersion: this.getOSVersion(),
      deviceType: this.getDeviceType(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  getBrowserVersion() {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(chrome|firefox|safari|edge)\/(\d+)/i);
    return match ? match[2] : 'Unknown';
  }

  getOSInfo() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  getOSVersion() {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/\(([^)]+)\)/);
    return match ? match[1] : 'Unknown';
  }

  getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  // Get tracking status
  async getTrackingStatus() {
    try {
      // For demo purposes, return status from localStorage
      const status = localStorage.getItem('userStatus');
      return status ? { status, timestamp: Date.now() } : null;
    } catch (error) {
      console.error('Error getting tracking status:', error);
      return null;
    }
  }

  // Logout tracking
  async logout() {
    try {
      this.stopTracking();
      
      // Update Firebase record to show user is offline
      if (db && this.trackingRecordId) {
        try {
          await updateDoc(doc(db, 'userTracking', this.trackingRecordId), {
            isOnline: false,
            status: 'offline',
            lastSeen: new Date(),
            updatedAt: serverTimestamp()
          });
          console.log('User marked as offline in Firebase');
        } catch (firebaseError) {
          console.error('Error updating user status in Firebase:', firebaseError);
        }
      }
      
      // Clear localStorage
      localStorage.removeItem('locationConsent');
      localStorage.removeItem('userStatus');
      localStorage.removeItem('lastLocation');
      localStorage.removeItem('deviceInfo');
      
      this.consentGiven = false;
  
      this.currentUser = null;
      this.trackingRecordId = null;
      console.log('Tracking logged out');
    } catch (error) {
      console.error('Error logging out tracking:', error);
    }
  }

  // Check if tracking is supported
  isSupported() {
    return 'geolocation' in navigator;
  }

  // Check if user has given consent
  hasConsent() {
    return this.consentGiven;
  }

  // Check if currently tracking
  isCurrentlyTracking() {
    return this.isTracking;
  }

  // Get current location
  getCurrentLocation() {
    return this.currentLocation;
  }

  // Get current location manually (if not already tracking)
  async getCurrentLocationManual() {
    return new Promise<LocationData>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      console.log('🎯 Requesting high-accuracy location...');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          console.log('📍 Manual location received:', {
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            accuracy: `${accuracy}m`
          });
          
          // Get address
          let address = undefined;
          try {
            address = await this.reverseGeocode(latitude, longitude);
          } catch (geocodeError) {
            console.warn('Reverse geocoding failed:', geocodeError);
          }
          
          const location: LocationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
            address
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('Error getting current location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, // Longer timeout for manual requests
          maximumAge: 0 // Force fresh location
        }
      );
    });
  }

  // Force a high-accuracy location update
  async forceLocationUpdate(): Promise<LocationData | null> {
    try {
      console.log('🔄 Forcing location update...');
      const location = await this.getCurrentLocationManual();
      
      // If we're tracking, also save this location
      if (this.isTracking && this.currentUser) {
        await this.handleLocationUpdate({
          coords: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        } as GeolocationPosition);
      }
      
      return location;
    } catch (error) {
      console.error('Error forcing location update:', error);
      return null;
    }
  }

  // Get all user tracking data from Firebase
  async getAllUserTrackingData(): Promise<UserTrackingRecord[]> {
    try {
      if (!db) {
        console.warn('Firebase not available, returning empty array');
        return [];
      }

      const querySnapshot = await getDocs(
        query(
          collection(db, 'userTracking'),
          orderBy('lastSeen', 'desc')
        )
      );

      const trackingData: UserTrackingRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        trackingData.push({
          id: doc.id,
          ...data,
          lastSeen: data['lastSeen']?.toDate ? data['lastSeen'].toDate() : new Date(data['lastSeen']),
          lastActivity: data['lastActivity']?.toDate ? data['lastActivity'].toDate() : new Date(data['lastActivity']),
          loginTime: data['loginTime']?.toDate ? data['loginTime'].toDate() : new Date(data['loginTime'])
        } as UserTrackingRecord);
      });

      return trackingData;
    } catch (error) {
      console.error('Error getting user tracking data:', error);
      return [];
    }
  }

  // Set up real-time listener for tracking data
  setupRealtimeTrackingListener(callback: (data: UserTrackingRecord[]) => void) {
    if (!db) {
      console.warn('Firebase not available for real-time listener');
      return null;
    }

    const q = query(
      collection(db, 'userTracking'),
      orderBy('lastSeen', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const trackingData: UserTrackingRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        trackingData.push({
          id: doc.id,
          ...data,
          lastSeen: data['lastSeen']?.toDate ? data['lastSeen'].toDate() : new Date(data['lastSeen']),
          lastActivity: data['lastActivity']?.toDate ? data['lastActivity'].toDate() : new Date(data['lastActivity']),
          loginTime: data['loginTime']?.toDate ? data['loginTime'].toDate() : new Date(data['loginTime'])
        } as UserTrackingRecord);
      });
      callback(trackingData);
    }, (error) => {
      console.error('Error in real-time tracking listener:', error);
    });
  }

  // Event emitter methods
  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
}

// Create singleton instance
const locationTrackingService = new LocationTrackingService();

export default locationTrackingService; 