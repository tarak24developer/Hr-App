// Mock WebSocket service for demo purposes
// This replaces the Firebase Realtime Database implementation

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
}

interface WebSocketConnection {
  id: string;
  userId: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSeen: number;
  metadata?: any;
}

class WebSocketService {
  private connections: Map<string, WebSocketConnection> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    console.log('WebSocket service initialized in demo mode');
  }

  // Connect to WebSocket
  async connect(userId: string, metadata?: any): Promise<boolean> {
    try {
      // Simulate connection in demo mode
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const connection: WebSocketConnection = {
        id: connectionId,
        userId,
        status: 'connected',
        lastSeen: Date.now(),
        metadata
      };

      this.connections.set(connectionId, connection);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log(`WebSocket connected for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Disconnect from WebSocket
  async disconnect(connectionId: string): Promise<boolean> {
    try {
      const connection = this.connections.get(connectionId);
      if (connection) {
        connection.status = 'disconnected';
        connection.lastSeen = Date.now();
        this.connections.delete(connectionId);
        
        if (this.connections.size === 0) {
          this.isConnected = false;
        }
        
        console.log(`WebSocket disconnected: ${connectionId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('WebSocket disconnection failed:', error);
      return false;
    }
  }

  // Send message
  async sendMessage(message: WebSocketMessage): Promise<boolean> {
    try {
      if (!this.isConnected) {
        // Queue message if not connected
        this.messageQueue.push(message);
        return false;
      }

      // Simulate sending message in demo mode
      console.log('WebSocket message sent:', message);
      
      // Process message locally for demo
      this.processMessage(message);
      
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  // Process incoming message
  private processMessage(message: WebSocketMessage): void {
    try {
      console.log('Processing WebSocket message:', message);
      
      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.sendMessage({
            type: 'pong',
            data: { timestamp: Date.now() },
            timestamp: Date.now()
          });
          break;
          
        case 'status_update':
          // Update connection status
          break;
          
        case 'notification':
          // Handle notifications
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  // Get connection status
  getConnectionStatus(connectionId: string): WebSocketConnection | null {
    return this.connections.get(connectionId) || null;
  }

  // Get all connections
  getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  // Check if connected
  isServiceConnected(): boolean {
    return this.isConnected;
  }

  // Get connection count
  getConnectionCount(): number {
    return this.connections.size;
  }

  // Clean up old connections
  cleanupOldConnections(maxAge: number = 300000): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.connections.forEach((connection, id) => {
      if (now - connection.lastSeen > maxAge) {
        toRemove.push(id);
      }
    });

    toRemove.forEach(id => {
      this.connections.delete(id);
    });

    if (toRemove.length > 0) {
      console.log(`Cleaned up ${toRemove.length} old connections`);
    }
  }

  // Reconnect logic
  async reconnect(userId: string): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return false;
    }

    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    // Wait before attempting to reconnect
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts));

    return this.connect(userId);
  }

  // Send queued messages
  async sendQueuedMessages(): Promise<number> {
    if (!this.isConnected || this.messageQueue.length === 0) {
      return 0;
    }

    let sentCount = 0;
    const failedMessages: WebSocketMessage[] = [];

    for (const message of this.messageQueue) {
      try {
        const success = await this.sendMessage(message);
        if (success) {
          sentCount++;
        } else {
          failedMessages.push(message);
        }
      } catch (error) {
        console.error('Failed to send queued message:', error);
        failedMessages.push(message);
      }
    }

    // Update queue with failed messages
    this.messageQueue = failedMessages;

    console.log(`Sent ${sentCount} queued messages, ${failedMessages.length} failed`);
    return sentCount;
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService; 