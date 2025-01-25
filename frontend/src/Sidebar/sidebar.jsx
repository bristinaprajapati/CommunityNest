import React from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';
import { FaHome, FaSitemap, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import logo2 from '../logo2.png'; // Adjusted path to go one level up

const Sidebar = () => (
  <div className="Sidebar">
    {/* Logo Container */}
    <div className="Sidebar-logo">
      <img src={logo2} className="App-logo" alt="Sidebar-logo-img" />
    </div>

    {/* Sidebar Items */}
    <div className="Sidebar-menu">
      <Link to="/dashboard" className="Sidebar-item">
        <div className="Sidebar-icon" style={{ backgroundColor: '#34c759' }}>
          <FaHome />
        </div>
        <span className="Sidebar-text">Dashboard</span>
      </Link>

      <Link to="/department" className="Sidebar-item">
        <div className="Sidebar-icon" style={{ backgroundColor: '#a259ff' }}>
          <FaSitemap />
        </div>
        <span className="Sidebar-text">Departments</span>
      </Link>

      <Link to="/admin-user-meetings" className="Sidebar-item">
        <div className="Sidebar-icon" style={{ backgroundColor: '#ffcc00' }}>
          <FaUsers />
        </div>
        <span className="Sidebar-text">Meetings</span>
      </Link>

      <Link to="/admin-user-events" className="Sidebar-item">
        <div className="Sidebar-icon" style={{ backgroundColor: '#007aff' }}>
          <FaCalendarAlt />
        </div>
        <span className="Sidebar-text">Events</span>
      </Link>
    </div>
  </div>
);

export default Sidebar;
