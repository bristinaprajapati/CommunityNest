import React from 'react';
import Sidebar from '../sidebar/AdminSidebar.jsx'; // Import the sidebar
import './Event.css'; // Import CSS for styling

const Events = () => {
  // Dummy data for events
  const eventsData = [
    {
      eventName: 'Tech Fest 2025',
      communityName: 'Tech Enthusiasts',
      uploads: 'Agenda.pdf',
      uploadDate: '2025-01-20',
    },
    {
      eventName: 'Design Workshop',
      communityName: 'Design Gurus',
      uploads: 'WorkshopOutline.docx',
      uploadDate: '2025-01-15',
    },
    {
      eventName: 'Hackathon',
      communityName: 'Developers Hub',
      uploads: 'Rules.pdf',
      uploadDate: '2025-01-10',
    },
  ];

  const handleDelete = (eventName) => {
    alert(`Event "${eventName}" has been deleted.`);
    // Add logic to handle delete action
  };

  const handleView = (eventName) => {
    alert(`Viewing details for "${eventName}".`);
    // Add logic to handle view action
  };

  return (
    <div className="events-page">
      <Sidebar />
      <div className="events-content">
        <h1>Events Management</h1>
        <p>Manage community events, view details, and remove events if needed.</p>
        <table className="events-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Community Name</th>
              <th>Uploads</th>
              <th>Date of Upload</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {eventsData.map((event, index) => (
              <tr key={index}>
                <td>{event.eventName}</td>
                <td>{event.communityName}</td>
                <td>{event.uploads}</td>
                <td>{event.uploadDate}</td>
                <td>
                  <button
                    className="view-button"
                    onClick={() => handleView(event.eventName)}
                  >
                    View
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(event.eventName)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Events;
