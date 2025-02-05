import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh')
    window.dispatchEvent(new CustomEvent('pwaUpdateAvailable'));
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
  // Add periodic check for new version
  immediate: true,
  periodicInterval: 60 * 1000, // Check every minute
  async checkUpdate() {
    try {
      const response = await fetch(`/version.txt?t=${new Date().getTime()}`);
      if (response.ok) {
        const newVersion = await response.text();
        // Force service worker update check
        updateSW(true);
      }
    } catch (err) {
      console.debug('Version check failed:', err);
    }
  }
})

if ('serviceWorker' in navigator) {
  updateSW()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)