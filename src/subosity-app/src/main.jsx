import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Handle updates
    console.log('New content available, please refresh')
    window.dispatchEvent(new CustomEvent('pwaUpdateAvailable'));
  },
  onOfflineReady() {
    // Handle offline mode ready
    console.log('App ready to work offline')
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