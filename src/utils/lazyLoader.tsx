import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from '../components/UI/ErrorBoundary';

// Dynamic import with retry mechanism
export const dynamicImport = <T,>(
  importFunc: () => Promise<T>, 
  retries: number = 3
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber: number) => {
      importFunc()
        .then(resolve)
        .catch((error) => {
          if (attemptNumber < retries) {
            console.warn(`Import attempt ${attemptNumber} failed, retrying...`, error);
            setTimeout(() => attempt(attemptNumber + 1), 1000 * attemptNumber);
          } else {
            reject(error);
          }
        });
    };
    
    attempt(1);
  });
};

// Lazy load with error boundary
export const lazyLoadWithErrorBoundary = <P extends Record<string, any>>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback: React.ReactNode = null,
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>
) => {
  const LazyComponent = lazy(importFunc);
  
  if (errorFallback) {
    return (props: P) => (
      <Suspense fallback={fallback}>
        <ErrorBoundary FallbackComponent={errorFallback}>
          <LazyComponent {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  }
  
  return (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Simple Error Boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; FallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; FallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyLoader ErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.FallbackComponent) {
        return <this.props.FallbackComponent error={this.state.error} retry={this.retry} />;
      }
      
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
          <p className="text-red-600 mb-4">{this.state.error.message}</p>
          <button
            onClick={this.retry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export the ErrorBoundary for use in other components
export { ErrorBoundary };
