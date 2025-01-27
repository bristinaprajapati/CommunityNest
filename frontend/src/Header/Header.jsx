import React from 'react';
import { Link, useNavigate } from 'react-router-dom';  // Import useNavigate for navigation
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBell } from '@fortawesome/free-solid-svg-icons';
import logo from '../logo.png';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();  // Use navigate for navigation

  const handleLogout = () => {
    // Clear session or authentication data
    localStorage.removeItem('userToken'); // Adjust depending on how you're managing user session

    // Redirect to login page
    navigate('/login');  // Use navigate to redirect to the login page
  };

  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <div className="Header-right">
        <FontAwesomeIcon icon={faUser} className="Icon" title="Profile" />
        <FontAwesomeIcon icon={faBell} className="Icon" title="Notifications" />
        <Link to="/login" className="Register-btn">
          Register
        </Link>
        <button className="Logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
