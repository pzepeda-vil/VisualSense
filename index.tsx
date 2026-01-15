import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  console.error("Mounting Error:", err);
  const diag = document.getElementById('error-diagnostic');
  if (diag) {
    diag.style.display = 'block';
    const msg = document.createElement('div');
    msg.className = 'text-rose-500 font-mono text-xs mt-2';
    msg.textContent = '> ' + (err instanceof Error ? err.message : String(err));
    diag.appendChild(msg);
  }
}