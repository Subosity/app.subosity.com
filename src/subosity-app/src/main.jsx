import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh');
    // Dispatch event that UpdateNotification listens for
    window.dispatchEvent(new CustomEvent('pwaUpdateAvailable'));
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  immediate: true,
  periodicInterval: 60 * 1000, // Check every minute
  async checkUpdate() {
    try {
      // Add debug logging
      console.log('Checking for updates...');
      const response = await fetch(`/version.txt?t=${new Date().getTime()}`, {
        // Force bypass cache
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const newVersion = await response.text();
        console.log('Current version:', newVersion);
        // Force service worker update check
        await updateSW(true);
      }
    } catch (err) {
      console.debug('Version check failed:', err);
    }
  }
});

// Initialize immediately
if ('serviceWorker' in navigator) {
  updateSW();
  // Trigger initial check
  setTimeout(() => updateSW(true), 1000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)