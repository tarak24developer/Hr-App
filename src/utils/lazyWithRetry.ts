/**
 * Lazy loading with retry logic
 * Automatically retries failed chunk loads (useful for network issues)
 */

import { ComponentType, lazy } from 'react';

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
}

export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): React.LazyExoticComponent<T> {
  const { maxRetries = 3, delay = 1000 } = options;

  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (remainingRetries: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (remainingRetries === 0) {
              console.error('Failed to load component after multiple retries:', error);
              reject(error);
              return;
            }

            console.warn(
              `Failed to load component, retrying... (${maxRetries - remainingRetries + 1}/${maxRetries})`,
              error
            );

            setTimeout(() => {
              attemptLoad(remainingRetries - 1);
            }, delay);
          });
      };

      attemptLoad(maxRetries);
    })
  );
}

export default lazyWithRetry;


