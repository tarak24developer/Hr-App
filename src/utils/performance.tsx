import React from 'react';

// Memoized value hook
export const useMemoizedValue = <T,>(
  value: T,
  deps: React.DependencyList
) => {
  return React.useMemo(() => value, deps);
};

// Debounce function with proper typing
export const debounce = <T extends (...args: any[]) => any,>(
  func: T,
  wait: number
) => {
  let timeout: NodeJS.Timeout | undefined;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function with proper typing
export const throttle = <T extends (...args: any[]) => any,>(
  func: T,
  limit: number
) => {
  let inThrottle: boolean = false;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    const argsArray = Array.from(args);
    
    if (!inThrottle) {
      func.apply(context, argsArray);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy loading utility
export const lazyLoad = <T extends React.ComponentType<any>,>(
  importFunc: () => Promise<{ default: T }>
) => {
  return React.lazy(importFunc);
};

// Performance measurement utility
export const measurePerformance = <T extends (...args: any[]) => any,>(
  func: T,
  name: string = 'Function'
) => {
  return function(this: any, ...args: Parameters<T>) {
    const start = performance.now();
    const result = func.apply(this, args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds to execute`);
    return result;
  };
};

// Image optimization utility
export const optimizeImage = (src: string) => {
  // In a real app, you might use a CDN or image optimization service
  // For now, just return the original source
  return src;
};

// Component preloading utility
export const preloadComponent = <T extends React.ComponentType<any>,>(
  component: () => Promise<{ default: T }>
) => {
  // Preload the component
  component();
};
