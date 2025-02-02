import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faShieldAlt, faGavel } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import React from 'react'
import { useAuth } from '../AuthContext'


const Footer = () => {
  const { user, logout } = useAuth();
  const [versionInfo, setVersionInfo] = useState<{
    text: string;
    show: boolean;
  }>({
    text: 'Version: (Local Development)',
    show: true
  });

  useEffect(() => {
    fetch('/version.txt')
      .then(response => {
        if (!response.ok) {
          console.debug('Version file not found:', response.status)
          return null
        }
        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('text/plain')) {
          console.debug('Invalid content type:', contentType)
          return null
        }
        return response.text()
      })
      .then(text => {
        if (text?.trim()) {
          setVersionInfo({
            text: `Version: ${text.trim()}`,
            show: true
          })
        }
        // if text is null/empty, keep default state
      })
      .catch((error) => {
        console.debug('Error loading version:', error.message)
        setVersionInfo(prev => ({ ...prev, show: false }))
      })
  }, [])

  return (
    <footer className="footer mt-auto py-3 opacity-75 shadow-sm"
      style={{ 
        backgroundColor: 'var(--bs-footer-bg)', 
        color: 'var(--bs-footer-color)',
        fontSize: '.75em' 
      }}>
      <div className="container">
        {/* Mobile Layout (default) */}
        <div className="d-md-none">
          <div className="text-center mb-2">
            <Link to="/terms" className="text-decoration-none">Terms of Use</Link>
            <span className="mx-2">|</span>
            <Link to="/privacy" className="text-decoration-none">Privacy Policy</Link>
          </div>
          <div className="text-center">
            <span>Copyright © 2025 Subosity</span>
            {versionInfo.show && (
              <span className="d-none d-sm-inline">
                <span className="mx-2">|</span>
                <span>{versionInfo.text}</span>
              </span>
            )}
          </div>
        </div>
    
        {/* Desktop Layout */}
        <div className="d-none d-md-block text-center">
          <span>Copyright © 2025 Subosity</span>
          <span className="mx-2">|</span>
          <Link to="/terms" className="text-decoration-none">Terms of Use</Link>
          <span className="mx-2">|</span>
          <Link to="/privacy" className="text-decoration-none">Privacy Policy</Link>
          {versionInfo.show && (
            <span className="d-none d-sm-inline">
              <span className="mx-2">|</span>
              <span>{versionInfo.text}</span>
            </span>
          )}
        </div>
      </div>
    </footer>
  )
}

export default Footer