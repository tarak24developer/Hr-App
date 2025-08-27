// Notification utility for better user experience
export const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };
  
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };
  
  const notificationDiv = document.createElement('div');
  notificationDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 350px;
      animation: slideIn 0.3s ease-out;
      white-space: pre-line;
      line-height: 1.4;
    ">
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <div style="width: 20px; height: 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
          <span style="color: ${colors[type]}; font-size: 12px; font-weight: bold;">${icons[type]}</span>
        </div>
        <div style="flex: 1;">
          ${message}
        </div>
      </div>
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `;
  document.body.appendChild(notificationDiv);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (notificationDiv.parentNode) {
      notificationDiv.parentNode.removeChild(notificationDiv);
    }
  }, 5000);
};
