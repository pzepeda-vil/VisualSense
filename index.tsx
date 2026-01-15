import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * Robust entry point with diagnostic logging for 
 * deployment environments like GitHub Pages.
 */
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Target container #root not found in the DOM.");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log("VisualSense successfully mounted.");
} catch (err) {
  console.error("Critical Mounting Error:", err);
  const diag = document.getElementById('error-diagnostic');
  if (diag) {
    diag.classList.remove('hidden');
    const msg = document.createElement('div');
    msg.className = 'text-rose-500 font-mono text-[10px] mt-2 border-t border-slate-800 pt-2';
    msg.textContent = '> Mount Failure: ' + (err instanceof Error ? err.message : String(err));
    diag.appendChild(msg);
  }
}