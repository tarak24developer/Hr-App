interface TrackingData {
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  isActive: boolean;
  status: string;
}

interface EventData {
  type: string;
  timestamp: number;
  data: any;
}

class RealtimeTrackingService {
  private trackingData: Map<string, TrackingData> = new Map();
  private listeners: Map<string, Function> = new Map();

  constructor() {
    // Initialize with mock data for demo
    console.log('RealtimeTrackingService initialized in demo mode');
  }

  // Start tracking for a user
  startTracking(userId: string, locationData: any) {
    const tracking: TrackingData = {
      userId,
      location: {
        latitude: locationData.latitude || 0,
        longitude: locationData.longitude || 0,
        accuracy: locationData.accuracy || 0,
        timestamp: Date.now()
      },
      isActive: true,
      status: 'online'
    };

    this.trackingData.set(userId, tracking);
    console.log(`Started tracking for user: ${userId}`);
    
    // Emit tracking start event
    this.emit('tracking_start', { userId, tracking });
  }

  // Update location for a user
  updateLocation(userId: string, locationData: any) {
    const existing = this.trackingData.get(userId);
    if (existing) {
      existing.location = {
        latitude: locationData.latitude || existing.location.latitude,
        longitude: locationData.longitude || existing.location.longitude,
        accuracy: locationData.accuracy || existing.location.accuracy,
        timestamp: Date.now()
      };
      existing.status = 'online';
      
      this.trackingData.set(userId, existing);
      console.log(`Updated location for user: ${userId}`);
      
      // Emit location update event
      this.emit('location_update', { userId, location: existing.location });
    }
  }

  // Stop tracking for a user
  stopTracking(userId: string) {
    const existing = this.trackingData.get(userId);
    if (existing) {
      existing.isActive = false;
      existing.status = 'offline';
      this.trackingData.set(userId, existing);
      console.log(`Stopped tracking for user: ${userId}`);
      
      // Emit tracking stop event
      this.emit('tracking_stop', { userId });
    }
  }

  // Listen for user location updates
  onUserLocationUpdate(userId: string, callback: Function) {
    const eventKey = `location_update_${userId}`;
    this.listeners.set(eventKey, callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(eventKey);
    };
  }

  // Listen for all tracking updates
  onAllTrackingUpdates(callback: Function) {
    const eventKey = 'all_tracking_updates';
    this.listeners.set(eventKey, callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(eventKey);
    };
  }

  // Get all active tracking data
  getAllActiveTracking() {
    const activeTracking: Record<string, TrackingData> = {};
    
    this.trackingData.forEach((tracking, userId) => {
      if (tracking.isActive) {
        activeTracking[userId] = tracking;
      }
    });
    
    return activeTracking;
  }

  // Get tracking history for a user
  async getUserTrackingHistory(userId: string, limit: number = 100) {
    // Mock implementation - return empty array for demo
    return [];
  }

  // Add tracking event
  addTrackingEvent(userId: string, eventData: EventData) {
    const existing = this.trackingData.get(userId);
    if (existing) {
      // In a real implementation, this would save to a database
      console.log(`Added tracking event for user ${userId}:`, eventData);
      
      // Emit event
      this.emit('tracking_event', { userId, event: eventData });
    }
  }

  // Remove listener for a specific user
  removeListener(userId: string) {
    const eventKey = `location_update_${userId}`;
    const unsubscribe = this.listeners.get(eventKey);
    if (unsubscribe) {
      this.listeners.delete(eventKey);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing listener:', error);
        }
      }
    });
    this.listeners.clear();
  }

  // Clean up resources
  cleanup() {
    this.removeAllListeners();
    this.trackingData.clear();
  }

  // Emit events to listeners
  private emit(event: string, data: any) {
    this.listeners.forEach((callback, key) => {
      if (key === event || key === 'all_tracking_updates') {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in tracking listener:', error);
        }
      }
    });
  }
}

// Create singleton instance
const realtimeTrackingService = new RealtimeTrackingService();

export default realtimeTrackingService; 