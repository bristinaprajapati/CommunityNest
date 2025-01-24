import React from 'react';
import './sidebar.css';
import { FaHome, FaSitemap, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import logo2 from '../logo2.png'; // Adjusted path to go one level up

const Sidebar = ({ onCategorySelect }) => (
  <div className="Sidebar">
    {/* Logo Container */}
    <div className="Sidebar-logo">
  
      <img src={logo2} className="App-logo" alt="lSidebar-logo-img" />
    </div>

    {/* Sidebar Items */}
    <div className="Sidebar-menu">
      <div
        className="Sidebar-item"
        onClick={() => onCategorySelect('Dashboard')}
      >
        <div className="Sidebar-icon" style={{ backgroundColor: '#34c759' }}>
          <FaHome />
        </div>
        <span className="Sidebar-text">Dashboard</span>
      </div>

      <div
        className="Sidebar-item"
        onClick={() => onCategorySelect('Departments')}
      >
        <div className="Sidebar-icon" style={{ backgroundColor: '#a259ff' }}>
          <FaSitemap />
        </div>
        <span className="Sidebar-text">Departments</span>
      </div>

      <div
        className="Sidebar-item"
        onClick={() => onCategorySelect('Meetings')}
      >
        <div className="Sidebar-icon" style={{ backgroundColor: '#ffcc00' }}>
          <FaUsers />
        </div>
        <span className="Sidebar-text">Meetings</span>
      </div>

      <div
        className="Sidebar-item"
        onClick={() => onCategorySelect('Events')}
      >
        <div className="Sidebar-icon" style={{ backgroundColor: '#007aff' }}>
          <FaCalendarAlt />
        </div>
        <span className="Sidebar-text">Events</span>
      </div>
    </div>
  </div>
);

export default Sidebar;
