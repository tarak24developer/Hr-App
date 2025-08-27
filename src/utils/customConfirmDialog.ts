// Custom confirmation dialog utility for better user experience
export const showCustomConfirmDialog = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const dialogDiv = document.createElement('div');
    dialogDiv.innerHTML = `
      <div style="
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        ">
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 16px;
          ">
            <div style="
              width: 48px;
              height: 48px;
              background: #fef3c7;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 16px;
            ">
              <span style="color: #d97706; font-size: 24px;">⚠️</span>
            </div>
            <h3 style="
              margin: 0;
              font-size: 20px;
              font-weight: 600;
              color: #111827;
            ">${title}</h3>
          </div>
          
          <div style="
            margin-bottom: 24px;
            color: #374151;
            line-height: 1.6;
            white-space: pre-line;
            font-size: 14px;
          ">${message}</div>
          
          <div style="
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          ">
            <button id="cancelBtn" style="
              padding: 10px 20px;
              background: #f3f4f6;
              color: #374151;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
              Cancel
            </button>
            <button id="updateBtn" style="
              padding: 10px 20px;
              background: #10b981;
              color: white;
              border: 1px solid #10b981;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
              Update Existing Balance
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialogDiv);
    
    // Add event listeners
    const cancelBtn = dialogDiv.querySelector('#cancelBtn');
    const updateBtn = dialogDiv.querySelector('#updateBtn');
    
    const cleanup = () => {
      document.body.removeChild(dialogDiv);
    };
    
    cancelBtn?.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
    
    updateBtn?.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });
    
    // Close on backdrop click
    dialogDiv.addEventListener('click', (e) => {
      if (e.target === dialogDiv) {
        cleanup();
        resolve(false);
      }
    });
  });
};
