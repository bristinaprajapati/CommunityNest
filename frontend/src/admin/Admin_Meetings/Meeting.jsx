import React, { useState } from 'react';
import Sidebar from '../sidebar/AdminSidebar.jsx'; // Import the sidebar
import './Meeting.css'; // Import CSS for styling

const Meetings = () => {
  // Dummy data for meetings
  const [meetingsData, setMeetingsData] = useState([
    {
      meetingTitle: 'Community Strategy Planning',
      communityName: 'Tech Enthusiasts',
      date: '2025-02-01',
      meetingTime: '10:00 AM',
      meetingLink: 'https://meet.example.com/tech-strategy',
      status: 'Scheduled',
    },
    {
      meetingTitle: 'Design Review',
      communityName: 'Design Gurus',
      date: '2025-02-03',
      meetingTime: '11:00 AM',
      meetingLink: 'https://meet.example.com/design-review',
      status: 'Completed',
    },
    {
      meetingTitle: 'Hackathon Kickoff',
      communityName: 'Developers Hub',
      date: '2025-02-05',
      meetingTime: '12:00 PM',
      meetingLink: 'https://meet.example.com/hackathon-kickoff',
      status: 'Scheduled',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    communityName: '',
    meetingTitle: '',
    meetingDate: '',
    meetingTime: '',
  });

  const handleDelete = (meetingTitle) => {
    alert(`Meeting "${meetingTitle}" has been deleted.`);
    setMeetingsData(meetingsData.filter((meeting) => meeting.meetingTitle !== meetingTitle));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleScheduleMeeting = () => {
    const meetingLink = `https://meet.example.com/${formData.communityName.replace(/\s+/g, '-').toLowerCase()}`;
    const newMeeting = {
      meetingTitle: formData.meetingTitle,
      communityName: formData.communityName,
      date: formData.meetingDate,
      meetingTime: formData.meetingTime,
      meetingLink,
      status: 'Scheduled',
    };
    setMeetingsData([...meetingsData, newMeeting]);
    alert(`Meeting scheduled for ${formData.communityName}. Email notifications sent.`);
    setShowModal(false);
    setFormData({ communityName: '', meetingTitle: '', meetingDate: '', meetingTime: '' });
    // Email sending logic can be integrated here
  };

  return (
    <div className="meetings-page">
      <Sidebar />
      <div className="meetings-content">
        <div className="meetings-header">
          <h1>Meetings Management</h1>
          <button className="schedule-button" onClick={() => setShowModal(true)}>
            Schedule New Meeting
          </button>
        </div>
        <p>Manage community meetings, update their status, and remove them if necessary.</p>
        <table className="meetings-table">
          <thead>
            <tr>
              <th>Meeting Title</th>
              <th>Community Name</th>
              <th>Date</th>
              <th>Meeting Time</th>
              <th>Meeting Link</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {meetingsData.map((meeting, index) => (
              <tr key={index}>
                <td>{meeting.meetingTitle}</td>
                <td>{meeting.communityName}</td>
                <td>{meeting.date}</td>
                <td>{meeting.meetingTime}</td>
                <td>
                  <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                    Join Link
                  </a>
                </td>
                <td>{meeting.status}</td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(meeting.meetingTitle)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal for scheduling a meeting */}
        {showModal && (
          <div className={`modal-overlay ${showModal ? 'open' : ''}`}>
            <div className={`modal ${showModal ? 'open' : ''}`}>
              <h2>Schedule New Meeting</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScheduleMeeting();
                }}
              >
                <label>
                  Community Name:
                  <select
                    name="communityName"
                    value={formData.communityName}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a Community</option>
                    {meetingsData.map((meeting, index) => (
                      <option key={index} value={meeting.communityName}>
                        {meeting.communityName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Meeting Title:
                  <input
                    type="text"
                    name="meetingTitle"
                    value={formData.meetingTitle}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Meeting Date:
                  <input
                    type="date"
                    name="meetingDate"
                    value={formData.meetingDate}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Meeting Time:
                  <input
                    type="time"
                    name="meetingTime"
                    value={formData.meetingTime}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <div className="modal-actions">
                  <button type="submit" className="create-button">
                    Create
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meetings;
