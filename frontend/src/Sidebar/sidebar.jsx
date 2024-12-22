import React from 'react';
import './sidebar.css'; // Add the appropriate CSS path

const Sidebar = ({ onCategorySelect }) => (
  <div className="Sidebar">
    <div className="Sidebar-item" onClick={() => onCategorySelect('Dashboard')}>
      Dashboard
    </div>
    <div className="Sidebar-item" onClick={() => onCategorySelect('Departments')}>
      Departments
    </div>
    <div className="Sidebar-item" onClick={() => onCategorySelect('Meetings')}>
      Meetings
    </div>
    <div className="Sidebar-item" onClick={() => onCategorySelect('Events')}>
      Events
    </div>
  </div>
);

export default Sidebar;
