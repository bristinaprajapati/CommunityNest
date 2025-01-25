import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/AdminSidebar.jsx'; // Import the sidebar
import './Department.css'; // Import CSS for styling

const Departments = () => {
  // Dummy data for spaces and department counts
  const spacesData = [
    { spaceName: 'Tech Enthusiasts', departmentCount: 5 },
    { spaceName: 'Design Gurus', departmentCount: 3 },
    { spaceName: 'Developers Hub', departmentCount: 8 },
  ];

  const navigate = useNavigate(); // Use navigate for routing

  const handleCardClick = (spaceName) => {
    // Navigate to the document repository for the clicked space
    navigate(`/department/${spaceName}/documents`);
  };

  return (
    <div className="departments-page">
      <Sidebar />
      <div className="departments-content">
        <h1>Departments Management</h1>
        <p>Manage departments within the community spaces here.</p>
        <div className="departments-cards">
          {spacesData.map((space, index) => (
            <div
              key={index}
              className="department-card"
              onClick={() => handleCardClick(space.spaceName)}
            >
              <div className="department-space-name">{space.spaceName}</div>
              <div className="department-count">{space.departmentCount}</div>
              <div className="department-label">Departments</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Departments;
