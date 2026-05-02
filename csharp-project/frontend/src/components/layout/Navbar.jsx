import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container" style={{ paddingLeft: 40 }}>
        <div className="navbar-content" style={{ gap: 32 }}>
          <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)} style={{ marginRight: 'auto'}}>
            <span className="navbar-brand-mark">R</span>
            ROSCA
          </Link>

          {/* Hamburger */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>

          <div className={`navbar-menu${menuOpen ? ' open' : ''}`}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="navbar-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/groups" className="navbar-link" onClick={() => setMenuOpen(false)}>Groups</Link>
                <Link to="/contributions" className="navbar-link" onClick={() => setMenuOpen(false)}>Contributions</Link>
                <Link to="/payouts" className="navbar-link" onClick={() => setMenuOpen(false)}>Payouts</Link>
                <Link to="/profile" className="navbar-link" onClick={() => setMenuOpen(false)}>Profile</Link>
                <NotificationDropdown />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, padding: '0 4px' }}>
                  {user?.firstName}
                </span>
                <button onClick={handleLogout} className="btn btn-outline" style={{ fontSize: 13, padding: '6px 14px' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-link" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn btn-outline" style={{ fontSize: 13, padding: '6px 16px' }} onClick={() => setMenuOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, top: 60, background: 'rgba(0,0,0,0.4)', zIndex: 498 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;