import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBell } from '@fortawesome/free-solid-svg-icons';
import logo from '../logo.png'; // Adjusted path to go one level up
import '../App.css';           // Adjusted path to go one level up


const Header = () => (
  <header className="App-header">
    <img src={logo} className="App-logo" alt="logo" />
    <div className="Header-right">
      <FontAwesomeIcon icon={faUser} className="Icon" title="Profile" />
      <FontAwesomeIcon icon={faBell} className="Icon" title="Notifications" />
      <Link to="/login" className="Register-btn">
        Register
      </Link>
    </div>
  </header>
);

export default Header;
