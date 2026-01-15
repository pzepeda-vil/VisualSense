import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * Entry point for VisualSense.
 * Handles mounting and provides fallback UI if critical failure occurs.
 */
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Target container #root not found.");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log("%c VisualSense %c Engine Mounted Successfully ", 
    "color: white; background: #4f46e5; font-weight: bold; padding: 2px 4px; border-radius: 4px 0 0 4px;", 
    "color: #4f46e5; background: #eef2ff; font-weight: bold; padding: 2px 4px; border-radius: 0 4px 4px 0;"
  );
} catch (err) {
  console.error("Initialization Error:", err);
  const diag = document.getElementById('error-diagnostic');
  if (diag) {
    diag.classList.remove('hidden');
    const msg = document.createElement('div');
    msg.className = 'text-rose-500 font-mono text-[10px] mt-2 border-t border-slate-800 pt-2';
    msg.textContent = '> Runtime Error: ' + (err instanceof Error ? err.message : String(err));
    diag.appendChild(msg);
  }
}