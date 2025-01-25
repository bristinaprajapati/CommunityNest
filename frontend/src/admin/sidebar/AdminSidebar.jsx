import React from 'react';
import { Link } from 'react-router-dom';  // Import Link from react-router-dom
import './AdminSidebar.css';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/admin-dashboard' },
    { name: 'Members', icon: '👥', path: '/members' },  // Ensure path is correct
    { name: 'Departments', icon: '🏢', path: '/departments' },
    { name: 'Events', icon: '🎉', path: '/events' },
    { name: 'Meetings', icon: '📅', path: '/meetings' },
  ];

  return (
    <div className="Sidebar">
      <div className="Sidebar-title">Admin Panel</div>
      <ul className="Sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.name} className="Sidebar-item">
            <Link to={item.path} className="Sidebar-link">  {/* Link here */}
              <span className="Sidebar-icon">{item.icon}</span>
              <span className="Sidebar-text">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
