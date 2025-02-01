import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faShieldAlt, faGavel } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { useAuth } from '../AuthContext'


const Footer = () => {
  const { user, logout } = useAuth();
  
  return (
    <footer className="footer mt-auto py-3 opacity-75 shadow-sm"
      style={{ 
        backgroundColor: 'var(--bs-footer-bg)', 
        color: 'var(--bs-footer-color)',
        fontSize: '.75em' }}>
      <div className="container">
        <div className="text-center">
          <span>Copyright © 2025 Subosity</span>
          <span className="mx-2">|</span>
          <Link to="/terms" className="text-decoration-none">
            Terms of Use
          </Link>
          <span className="mx-2">|</span>
          <Link to="/privacy" className="text-decoration-none">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer