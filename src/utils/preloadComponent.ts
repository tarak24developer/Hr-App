/**
 * Preload Component Utility
 * Preloads lazy-loaded components in the background
 */

export const preloadComponent = (importFn: () => Promise<any>) => {
  importFn().catch((error) => {
    console.warn('Failed to preload component:', error);
  });
};

export const preloadComponents = (...importFns: (() => Promise<any>)[]) => {
  importFns.forEach((importFn) => {
    preloadComponent(importFn);
  });
};

export default preloadComponent;


