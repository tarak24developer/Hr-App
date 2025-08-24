interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string | undefined;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
}

class LocationTrackingService {
  private watchId: number | null = null;
  private isTracking: boolean = false;
  private consentGiven: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private consentChecked: boolean = false;
  private currentLocation: LocationData | null = null;
  private eventListeners: Record<string, Function[]> = {};

  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.consentGiven = false;
    this.updateInterval = null;
    this.consentChecked = false;
    this.currentLocation = null;
    this.eventListeners = {};
  }

  // Check if user has already given consent (mock implementation)
  async checkExistingConsent(): Promise<boolean> {
    try {
      console.log('Checking existing consent...');
      
      // For demo purposes, check localStorage
      const consent = localStorage.getItem('locationConsent');
      this.consentGiven = consent === 'true';
      console.log('Existing consent found:', this.consentGiven);
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

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Get device info
            const deviceInfo = this.getDeviceInfo();
            
            // Save consent to localStorage for demo
            localStorage.setItem('locationConsent', 'true');
            localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));

            this.consentGiven = true;
            this.startTracking();
            resolve({ success: true, data: { hasConsent: true } });
          } catch (error) {
            console.error('Error saving consent:', error);
            reject(error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(new Error('Failed to get location permission'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
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
    } catch (error) {
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

    // Watch for location changes
    this.watchId = navigator.geolocation.watchPosition(
      this.handleLocationUpdate.bind(this),
      this.handleLocationError.bind(this),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // Update every 30 seconds
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
      
      // Store current location
      this.currentLocation = {
        latitude,
        longitude,
        accuracy,
        timestamp: Date.now(),
        address: undefined
      };
      
      // Save location to localStorage for demo
      const locationData = {
        latitude,
        longitude,
        accuracy,
        timestamp: Date.now(),
        userInfo: this.getDeviceInfo()
      };
      
      localStorage.setItem('lastLocation', JSON.stringify(locationData));
      console.log('Location updated:', { latitude, longitude, accuracy });
      
      // Emit location update event
      this.emit('location_update', this.currentLocation);
    } catch (error) {
      console.error('Error updating location:', error);
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
      
      // Clear localStorage for demo
      localStorage.removeItem('locationConsent');
      localStorage.removeItem('userStatus');
      localStorage.removeItem('lastLocation');
      localStorage.removeItem('deviceInfo');
      
      this.consentGiven = false;
      this.consentChecked = false; // Reset consent check flag
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

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const location: LocationData = {
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
            address: undefined
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
          timeout: 10000,
          maximumAge: 60000
        }
      );
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