/**
 * Real-Time Collection Hook
 * Provides real-time synchronization for Firestore collections
 * with automatic updates, optimistic UI, and offline support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  QueryConstraint,
  DocumentData,
  FirestoreError,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/services/firebase';

export interface RealtimeOptions {
  enabled?: boolean;
  onError?: (error: FirestoreError) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export interface RealtimeState<T> {
  data: T[];
  loading: boolean;
  error: FirestoreError | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  refetch: () => void;
}

/**
 * Real-time collection hook with automatic synchronization
 */
export function useRealtimeCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  options: RealtimeOptions = {}
): RealtimeState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const { 
    enabled = true, 
    onError, 
    onConnected, 
    onDisconnected 
  } = options;

  const setupListener = useCallback(() => {
    if (!db || !enabled) {
      setLoading(false);
      return;
    }

    try {
      const collectionRef = collection(db, collectionName);
      const q = constraints.length > 0 
        ? query(collectionRef, ...constraints) 
        : collectionRef;

      console.log(`🔄 Setting up real-time listener for: ${collectionName}`);

      const unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!isMountedRef.current) return;

          // Check if data is from cache or server
          const source = snapshot.metadata.fromCache ? 'cache' : 'server';
          const hasPendingWrites = snapshot.metadata.hasPendingWrites;

          console.log(`📡 ${collectionName} update from ${source}`, {
            size: snapshot.size,
            hasPendingWrites
          });

          // Update connection status
          if (source === 'server' && !isConnected) {
            setIsConnected(true);
            onConnected?.();
            retryCountRef.current = 0;
          }

          // Extract data
          const items: T[] = [];
          snapshot.forEach((doc) => {
            items.push({
              id: doc.id,
              ...doc.data(),
              _fromCache: snapshot.metadata.fromCache,
              _hasPendingWrites: doc.metadata.hasPendingWrites,
            } as unknown as T);
          });

          setData(items);
          setLoading(false);
          setError(null);
          setLastUpdated(new Date());
        },
        (err: FirestoreError) => {
          console.error(`❌ ${collectionName} listener error:`, err);
          
          if (!isMountedRef.current) return;

          setError(err);
          setLoading(false);

          // Handle connection issues
          if (err.code === 'unavailable' || err.code === 'permission-denied') {
            setIsConnected(false);
            onDisconnected?.();

            // Retry with exponential backoff
            if (retryCountRef.current < maxRetries) {
              const delay = Math.pow(2, retryCountRef.current) * 1000;
              retryCountRef.current++;
              
              console.log(`🔄 Retrying ${collectionName} in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
              
              setTimeout(() => {
                if (isMountedRef.current) {
                  setupListener();
                }
              }, delay);
            }
          }

          onError?.(err);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error(`❌ Failed to setup ${collectionName} listener:`, err);
      setLoading(false);
      setError(err as FirestoreError);
    }
  }, [collectionName, constraints, enabled, isConnected, onConnected, onDisconnected, onError]);

  useEffect(() => {
    isMountedRef.current = true;
    setupListener();

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        console.log(`🔌 Unsubscribing from ${collectionName}`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [setupListener]);

  const refetch = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    setLoading(true);
    setupListener();
  }, [setupListener]);

  return {
    data,
    loading,
    error,
    isConnected,
    lastUpdated,
    refetch,
  };
}

/**
 * Hook for real-time document (single item)
 */
export function useRealtimeDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string | null,
  options: RealtimeOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isMountedRef = useRef(true);

  const { enabled = true, onError, onConnected, onDisconnected } = options;

  useEffect(() => {
    if (!db || !enabled || !documentId) {
      setLoading(false);
      return;
    }

    isMountedRef.current = true;

    const docRef = collection(db, collectionName);
    
    // Setup document listener
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!isMountedRef.current) return;

        const doc = snapshot.docs.find(d => d.id === documentId);
        
        if (doc) {
          const source = snapshot.metadata.fromCache ? 'cache' : 'server';
          
          setData({
            id: doc.id,
            ...doc.data(),
            _fromCache: snapshot.metadata.fromCache,
          } as unknown as T);
          
          if (source === 'server') {
            setIsConnected(true);
            onConnected?.();
          }
        } else {
          setData(null);
        }

        setLoading(false);
        setError(null);
        setLastUpdated(new Date());
      },
      (err: FirestoreError) => {
        if (!isMountedRef.current) return;

        setError(err);
        setLoading(false);
        setIsConnected(false);
        onDisconnected?.();
        onError?.(err);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [collectionName, documentId, enabled, onError, onConnected, onDisconnected]);

  const refetch = useCallback(() => {
    setLoading(true);
    // Listener will automatically refetch
  }, []);

  return {
    data,
    loading,
    error,
    isConnected,
    lastUpdated,
    refetch,
  };
}

export default useRealtimeCollection;

