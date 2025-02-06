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
      console.log('Checking for updates...');
      const response = await fetch(`/version.txt?t=${new Date().getTime()}`, {
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
      console.warn('Version check failed:', err);
    }
  }
});

// Polling logic for /version.txt
let currentVersion = null;
let pollInterval;

async function pollVersion() {
  try {
    console.log('Polling version.txt...');
    const response = await fetch(`/version.txt?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // Check for expected content-type
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('text/plain')) {
      const newVersion = (await response.text()).trim();
      console.log('Fetched version:', newVersion);
      if (currentVersion && newVersion !== currentVersion) {
        console.log('New version detected:', newVersion);
        window.dispatchEvent(new CustomEvent('pwaUpdateAvailable'));
      }
      currentVersion = newVersion;
    } else {
      console.warn(
        'Ignoring response because either status is not OK or content-type is not text/plain.',
        response.status,
        contentType
      );
      // Stop polling locally since it's not meaningful here
      if (pollInterval) {
        clearInterval(pollInterval);
        console.log('Stopped polling /version.txt');
      }
    }
  } catch (err) {
    console.error('Error polling version.txt:', err);
  }
}

// Start polling every minute and capture the interval handle
pollInterval = setInterval(pollVersion, 60 * 1000);
// Also trigger an immediate poll on startup
pollVersion();

// Initialize service worker immediately, if supported
if ('serviceWorker' in navigator) {
  updateSW();
  setTimeout(() => updateSW(true), 1000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)