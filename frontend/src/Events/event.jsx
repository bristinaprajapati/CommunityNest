import React from 'react';
import Sidebar from '../Sidebar/sidebar.jsx'; // Import Sidebar
import './event.css'; // Add styles specific to Events page

const Events = () => {
  return (
    <div className="events-page">
      {/* Sidebar */}
      <Sidebar />

      {/* Events Content */}
      <div className="events-content">
        <h1>Events Management</h1>
        <p>Manage your events here.</p>

        {/* Add your events-specific content */}
        <div className="event-details">
          <p>No events scheduled yet. Click "Create Event" to get started!</p>
        </div>
      </div>
    </div>
  );
};

export default Events;
