import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { showSuccess } = useToast();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    showSuccess('You have been signed out');
    setIsProfileOpen(false);
  };

  if (!isAuthenticated) {
    return null; // Don't show navbar when not authenticated
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and Brand */}
        <div className="navbar-brand">
          <Link to="/classes" className="brand-link">
            <img src="/logo_centered.png" alt="SpeakEval" className="brand-logo" />
            <span className="brand-text">
              <span className="brand-name">SpeakEval</span>
              <span className="brand-subtitle">Classes</span>
            </span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="navbar-nav">
            <Link 
              to="/classes" 
              className={`nav-link ${isActive('/classes') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="nav-icon">🏠</i>
              Dashboard
            </Link>
            
            <Link 
              to="/classes/create" 
              className={`nav-link ${isActive('/classes/create') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="nav-icon">➕</i>
              Create Class
            </Link>
            
            <Link 
              to="/classes/join" 
              className={`nav-link ${isActive('/classes/join') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <i className="nav-icon">🔗</i>
              Join Class
            </Link>
          </div>

          {/* User Profile */}
          <div className="navbar-profile">
            <div className="profile-dropdown">
              <button 
                className="profile-button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="profile-avatar">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="profile-name">{user?.username}</span>
                <i className={`profile-arrow ${isProfileOpen ? 'open' : ''}`}>▼</i>
              </button>

              {isProfileOpen && (
                <div className="profile-menu">
                  <div className="profile-info">
                    <div className="profile-username">{user?.username}</div>
                    <div className="profile-subscription">
                      {user?.subscription || 'Free'} Plan
                    </div>
                  </div>
                  
                  <div className="profile-divider"></div>
                  
                  <a 
                    href="https://speakeval.org" 
                    className="profile-link"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <i className="link-icon">🌐</i>
                    SpeakEval Home
                  </a>
                  
                  <a 
                    href="https://speakeval.org/upgrade" 
                    className="profile-link"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <i className="link-icon">⭐</i>
                    Upgrade Plan
                  </a>
                  
                  <div className="profile-divider"></div>
                  
                  <button className="profile-link logout-btn" onClick={handleLogout}>
                    <i className="link-icon">🚪</i>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile menu */}
      {(isMenuOpen || isProfileOpen) && (
        <div 
          className="navbar-backdrop"
          onClick={() => {
            setIsMenuOpen(false);
            setIsProfileOpen(false);
          }}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;