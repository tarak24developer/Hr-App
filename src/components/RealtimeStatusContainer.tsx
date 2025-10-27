/**
 * Real-Time Status Container
 * Connects RealtimeStatus component to RealtimeContext
 */

import React, { useState, useEffect } from 'react';
import RealtimeStatus from './RealtimeStatus';
import { useRealtime } from '@/contexts/RealtimeContext';

export const RealtimeStatusContainer: React.FC = () => {
  const { isConnected, isOnline } = useRealtime();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isConnected) {
      setLastUpdated(new Date());
    }
  }, [isConnected]);

  return (
    <RealtimeStatus 
      isConnected={isOnline && isConnected}
      lastUpdated={lastUpdated}
    />
  );
};

export default RealtimeStatusContainer;

