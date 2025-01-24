import React, { useState } from 'react';
import './AdminSidebar.css';

const Sidebar = ({ onCategorySelect }) => {
  const [expandedAdmin, setExpandedAdmin] = useState(null); // Tracks the expanded admin name

  const adminUsers = [
    { name: 'Admin1', email: 'admin1@example.com' },
    { name: 'Admin2', email: 'admin2@example.com' },
    { name: 'Bristina Prajapati', email: 'bristinaprajapati99@gmail.com' },
  ];

  const handleAdminClick = (adminName) => {
    setExpandedAdmin((prev) => (prev === adminName ? null : adminName)); // Toggle the expanded state
  };

  return (
    <div className="Sidebar">
      <div
        className="Sidebar-item"
        onClick={() => onCategorySelect('Dashboard')}
      >
        Dashboard
      </div>

      <div className="Sidebar-title">Community Spaces</div>
      <div className="Sidebar-community">
        {adminUsers.map((admin) => (
          <div key={admin.email} className="Admin-section">
            <div
              className="Admin-name"
              onClick={() => handleAdminClick(admin.name)}
            >
              {admin.name}
            </div>
            {expandedAdmin === admin.name && (
              <div className="Admin-subcategories">
                <div
                  className="Sidebar-subitem"
                  onClick={() => onCategorySelect(`${admin.name} Members`)}
                >
                  Members
                </div>
                <div
                  className="Sidebar-subitem"
                  onClick={() => onCategorySelect(`${admin.name} Departments`)}
                >
                  Departments
                </div>
                <div
                  className="Sidebar-subitem"
                  onClick={() => onCategorySelect(`${admin.name} Meetings`)}
                >
                  Meetings
                </div>
                <div
                  className="Sidebar-subitem"
                  onClick={() => onCategorySelect(`${admin.name} Events`)}
                >
                  Events
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
