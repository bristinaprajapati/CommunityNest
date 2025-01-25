import React from 'react';
import Sidebar from '../Sidebar/sidebar.jsx'; // Import Sidebar
import './meeting.css'; // Optional: Add specific styles for Meetings

const Meetings = () => {
  return (
    <div className="meetings-page">
      {/* Sidebar */}
      <Sidebar />

      {/* Meetings Content */}
      <div className="meetings-content">
        <h1>Meetings Management</h1>
        <p>Manage your meetings here.</p>

        {/* Add your meetings page content here */}
        <div className="meeting-details">
          <p>No meetings scheduled yet. Click "Create Meeting" to get started!</p>
        </div>
      </div>
    </div>
  );
};

export default Meetings;
