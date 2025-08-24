import { useEffect, useRef, useCallback } from 'react';

// Performance monitoring hook
export const usePerformance = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const mountTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTime.current;
    
    console.log(`[${componentName}] Render #${renderCount.current} took ${renderTime.toFixed(2)}ms`);
    
    lastRenderTime.current = currentTime;
  });

  useEffect(() => {
    const mountDuration = performance.now() - mountTime.current;
    console.log(`[${componentName}] Mounted in ${mountDuration.toFixed(2)}ms`);
    
    return () => {
      const totalDuration = performance.now() - mountTime.current;
      console.log(`[${componentName}] Unmounted after ${totalDuration.toFixed(2)}ms total`);
    };
  }, [componentName]);

  const measureOperation = useCallback((operationName, operation) => {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    
    console.log(`[${componentName}] ${operationName} took ${duration.toFixed(2)}ms`);
    return result;
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    measureOperation,
  };
};

// Memory usage monitoring hook
export const useMemoryUsage = () => {
  const memoryInfo = useRef(null);

  useEffect(() => {
    if ('memory' in performance) {
      memoryInfo.current = performance.memory;
    }
  }, []);

  const getMemoryInfo = useCallback(() => {
    if (memoryInfo.current) {
      return {
        usedJSHeapSize: (memoryInfo.current.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (memoryInfo.current.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (memoryInfo.current.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      };
    }
    return null;
  }, []);

  return { getMemoryInfo };
};

// Network performance monitoring hook
export const useNetworkPerformance = () => {
  const networkInfo = useRef(null);

  useEffect(() => {
    if ('connection' in navigator) {
      networkInfo.current = navigator.connection;
    }
  }, []);

  const getNetworkInfo = useCallback(() => {
    if (networkInfo.current) {
      return {
        effectiveType: networkInfo.current.effectiveType,
        downlink: networkInfo.current.downlink + ' Mbps',
        rtt: networkInfo.current.rtt + ' ms',
        saveData: networkInfo.current.saveData,
      };
    }
    return null;
  }, []);

  return { getNetworkInfo };
};

// Bundle size monitoring hook
export const useBundleSize = () => {
  const measureBundleSize = useCallback(async () => {
    try {
      const response = await fetch('/static/js/bundle.js');
      const blob = await response.blob();
      const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
      
      console.log(`Bundle size: ${sizeInMB} MB`);
      return sizeInMB;
    } catch (error) {
      console.warn('Could not measure bundle size:', error);
      return null;
    }
  }, []);

  return { measureBundleSize };
};
