import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfoCircle, faShieldAlt, faGavel } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { useAuth } from '../AuthContext'


const Footer = () => {
  const { user, logout } = useAuth();
  
  return (
    <footer className="footer mt-auto py-3" style={{ backgroundColor: 'var(--bs-footer-bg)', color: 'var(--bs-footer-color)' }}>
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
          {user && (
            <>
              <span className="mx-2">|</span>
              <Link to="/pricing" className="text-decoration-none">
                Pricing
              </Link>
              <span className="mx-2">|</span>
              <Link to="/about" className="text-decoration-none">
                About Us
              </Link>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}

export default Footer