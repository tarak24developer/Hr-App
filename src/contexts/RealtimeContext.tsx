/**
 * Real-Time Sync Context
 * Provides global real-time connection status and controls
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/services/firebase';

interface RealtimeContextType {
  isOnline: boolean;
  isConnected: boolean;
  isPaused: boolean;
  pauseSync: () => void;
  resumeSync: () => void;
  activeListeners: number;
  registerListener: () => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [activeListeners, setActiveListeners] = useState(0);

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Browser is online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('🌐 Browser is offline');
      setIsOnline(false);
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Firestore connection status
  useEffect(() => {
    if (!db || !isOnline) {
      setIsConnected(false);
      return;
    }

    // Use a lightweight collection to monitor connection
    const unsubscribe = onSnapshot(
      collection(db, '_connection_test'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const source = snapshot.metadata.fromCache ? 'cache' : 'server';
        const connected = source === 'server';
        
        if (connected !== isConnected) {
          console.log(`📡 Firestore connection: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
          setIsConnected(connected);
        }
      },
      (error) => {
        console.error('Connection monitor error:', error);
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, [isOnline, isConnected]);

  const pauseSync = () => {
    console.log('⏸️ Real-time sync paused');
    setIsPaused(true);
  };

  const resumeSync = () => {
    console.log('▶️ Real-time sync resumed');
    setIsPaused(false);
  };

  const registerListener = () => {
    setActiveListeners((prev) => prev + 1);
    
    return () => {
      setActiveListeners((prev) => Math.max(0, prev - 1));
    };
  };

  const value: RealtimeContextType = {
    isOnline,
    isConnected,
    isPaused,
    pauseSync,
    resumeSync,
    activeListeners,
    registerListener,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeProvider;

