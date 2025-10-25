/**
 * Hook to preload routes on hover/focus
 * Improves perceived performance by loading components before navigation
 */

import { useCallback } from 'react';

export const usePreloadRoute = (importFn: () => Promise<any>) => {
  const preload = useCallback(() => {
    importFn().catch((error) => {
      console.warn('Failed to preload route:', error);
    });
  }, [importFn]);

  return {
    onMouseEnter: preload,
    onFocus: preload,
  };
};

export default usePreloadRoute;


