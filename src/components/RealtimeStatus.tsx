/**
 * Real-Time Connection Status Indicator
 * Shows user when app is connected, syncing, or offline
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RealtimeStatusProps {
  isConnected: boolean;
  lastUpdated: Date | null;
  className?: string;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({
  isConnected,
  lastUpdated,
  className
}) => {
  const [showStatus, setShowStatus] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    // Show status briefly when connection changes
    setShowStatus(true);
    const timer = setTimeout(() => setShowStatus(false), 3000);
    return () => {
      clearTimeout(timer);
    };
  }, [isConnected]);

  useEffect(() => {
    // Show "synced" animation briefly
    if (lastUpdated) {
      setJustSynced(true);
      const timer = setTimeout(() => setJustSynced(false), 2000);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [lastUpdated]);

  if (!showStatus && isConnected && !justSynced) {
    return null; // Hide when everything is normal
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300',
        isConnected
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
        className
      )}
    >
      {isConnected ? (
        justSynced ? (
          <>
            <Check className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Synced
            </span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Connected
            </span>
          </>
        )
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            Offline
          </span>
          <RefreshCw className="w-3 h-3 text-red-600 dark:text-red-400 animate-spin" />
        </>
      )}
    </div>
  );
};

export default RealtimeStatus;

