import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // CRITICAL FIX: Use relative path './service-worker.js' for APK/Capacitor compatibility
    navigator.serviceWorker.register('./service-worker.js') 
      .then(registration => {
        console.log('Service Worker 註冊成功:', registration);
      })
      .catch(err => {
        console.log('Service Worker 註冊失敗:', err);
      });
  });
}

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