/**
 * Chunk Load Error Fallback
 * Displays when a code chunk fails to load
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ChunkLoadErrorProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

const ChunkLoadError: React.FC<ChunkLoadErrorProps> = ({ error, resetErrorBoundary }) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Failed to Load Component
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We encountered an issue loading this page. This might be due to a network problem or an outdated cache.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleReload}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </button>
          
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Try Again
            </button>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
          If the problem persists, please try clearing your browser cache or contact support.
        </p>
      </div>
    </div>
  );
};

export default ChunkLoadError;


