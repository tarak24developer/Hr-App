import React, { useState, useEffect } from 'react';
import { usePerformance, useMemoryUsage, useNetworkPerformance } from '../hooks/usePerformance';
import { PERFORMANCE_THRESHOLDS } from '../config/performance';

const PerformanceMonitor = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const { getMemoryInfo } = useMemoryUsage();
  const { getNetworkInfo } = useNetworkPerformance();

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const memoryInfo = getMemoryInfo();
      const networkInfo = getNetworkInfo();
      
      // Get performance timing
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
      
      // Get FPS
      let fps = 0;
      let frameCount = 0;
      let lastTime = performance.now();
      
      const measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
      };
      
      requestAnimationFrame(measureFPS);

      setMetrics({
        memory: memoryInfo,
        network: networkInfo,
        loadTime: loadTime.toFixed(2),
        fps,
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics();

    return () => clearInterval(interval);
  }, [isVisible, getMemoryInfo, getNetworkInfo]);

  if (!isVisible) return null;

  const getPerformanceColor = (value, threshold) => {
    if (value <= threshold.excellent) return '#4CAF50';
    if (value <= threshold.good) return '#8BC34A';
    if (value <= threshold.poor) return '#FF9800';
    return '#F44336';
  };

  const getLoadTimeColor = (loadTime) => {
    const time = parseFloat(loadTime);
    if (time <= PERFORMANCE_THRESHOLDS.loadTime.excellent) return '#4CAF50';
    if (time <= PERFORMANCE_THRESHOLDS.loadTime.good) return '#8BC34A';
    if (time <= PERFORMANCE_THRESHOLDS.loadTime.poor) return '#FF9800';
    return '#F44336';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        minWidth: '200px',
        cursor: 'pointer',
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        🚀 Performance Monitor
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <span style={{ color: '#FFD700' }}>FPS:</span>{' '}
        <span style={{ color: getPerformanceColor(metrics.fps || 0, PERFORMANCE_THRESHOLDS.renderTime) }}>
          {metrics.fps || 'N/A'}
        </span>
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <span style={{ color: '#FFD700' }}>Load:</span>{' '}
        <span style={{ color: getLoadTimeColor(metrics.loadTime || 0) }}>
          {metrics.loadTime || 'N/A'}ms
        </span>
      </div>
      
      {isExpanded && (
        <>
          {metrics.memory && (
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#FFD700' }}>Memory:</span>{' '}
              <span style={{ color: getPerformanceColor(parseFloat(metrics.memory.usedJSHeapSize), PERFORMANCE_THRESHOLDS.memoryUsage) }}>
                {metrics.memory.usedJSHeapSize}
              </span>
            </div>
          )}
          
          {metrics.network && (
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#FFD700' }}>Network:</span>{' '}
              <span style={{ color: '#4CAF50' }}>
                {metrics.network.effectiveType}
              </span>
            </div>
          )}
          
          <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>
            {metrics.timestamp}
          </div>
        </>
      )}
      
      <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>
        Click to {isExpanded ? 'collapse' : 'expand'}
      </div>
    </div>
  );
};

export default PerformanceMonitor;
