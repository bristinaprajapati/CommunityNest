import React, { useState, useEffect } from 'react';
import './AdminDashboard.css'; // Import CSS for styling
import Sidebar from '../sidebar/AdminSidebar.jsx'; // Fixed the import path

const AdminDashboard = () => {
  // State to store counts and recent uploads
  const [dashboardData, setDashboardData] = useState({
    spacesCount: 0,
    membersCount: 0,
    recentUploads: [],
  });

  // Fetch data (replace this with your API call)
  useEffect(() => {
    // Mocked data
    const fetchData = async () => {
      const data = {
        spacesCount: 12, // Example count of spaces created
        membersCount: 150, // Example count of members
        recentUploads: [
          { id: 1, title: 'Project Plan.pdf', category: 'Documents' },
          { id: 2, title: 'Event Poster.png', category: 'Graphics' },
          { id: 3, title: 'Meeting Notes.docx', category: 'Documents' },
        ], // Example uploads
      };
      setDashboardData(data);
    };

    fetchData();
  }, []);

  return (
    <div className="AdminDashboard">
      <Sidebar/>
      <h1>Welcome to the Admin Dashboard</h1>
      <p>Only admins can access this page.</p>

      {/* Dashboard Overview */}
      <div className="DashboardOverview">
        {/* Spaces Created */}
        <div className="OverviewBox">
          <h2>Spaces Created</h2>
          <p className="Count">{dashboardData.spacesCount}</p>
        </div>

        {/* Members Count */}
        <div className="OverviewBox">
          <h2>Members</h2>
          <p className="Count">{dashboardData.membersCount}</p>
        </div>

        {/* Recent Uploads */}
        <div className="OverviewBox">
          <h2>Recent Uploads</h2>
          <ul className="RecentUploads">
            {dashboardData.recentUploads.map((upload) => (
              <li key={upload.id}>
                {upload.title} <span>({upload.category})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
