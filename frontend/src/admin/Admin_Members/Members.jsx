import React, { useState } from 'react';
import Sidebar from '../sidebar/AdminSidebar.jsx'; // Import the sidebar
import './Members.css'; // Import CSS for styling the table

const Members = () => {
  // State to manage popup visibility
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    communityName: '',
    email: '',
    password: '',
  });

  // Dummy data for members
  const membersData = [
    { id: 1, username: 'john_doe', email: 'john@example.com', community: 'Tech Enthusiasts', type: 'Community Admin' },
    { id: 2, username: 'jane_smith', email: 'jane@example.com', community: 'Design Gurus', type: 'Normal User' },
    { id: 3, username: 'mark_lee', email: 'mark@example.com', community: 'Developers Hub', type: 'Normal User' },
  ];

  // Function to handle the removal of a member
  const handleRemove = (id) => {
    alert(`Member with ID ${id} has been removed.`);
    // Logic to remove the member can be added here
  };

  // Handle opening and closing of the popup
  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  // Handle input changes for new member
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember({ ...newMember, [name]: value });
  };

  // Handle creating a new admin account
  const handleCreateAdminAccount = (e) => {
    e.preventDefault();
    // Here you would usually send the new member data to your server or API
    alert(`New Community Admin Account created for community: ${newMember.communityName}`);
    setIsPopupOpen(false); // Close the popup after creation
  };

  return (
    <div className="members-page">
      <Sidebar />
      <div className="members-content">
        <h1>Members Management</h1>
        <p>Manage community members here.</p>

        {/* Button to open the popup */}
        <button className="add-member-button" onClick={togglePopup}>
          Add Member
        </button>

        {/* Modal for adding admin user */}
        {isPopupOpen && (
          <div className="modal-overlay open">
            <div className="modal">
              <h2>Create Community Admin Account</h2>
              <form onSubmit={handleCreateAdminAccount}>
                <label htmlFor="communityName">Community Name</label>
                <input
                  type="text"
                  id="communityName"
                  name="communityName"
                  value={newMember.communityName}
                  onChange={handleInputChange}
                  required
                />

                <label htmlFor="email">Community Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newMember.email}
                  onChange={handleInputChange}
                  required
                />

                <label htmlFor="password">Create Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newMember.password}
                  onChange={handleInputChange}
                  required
                />

                <div className="modal-actions">
                  <button type="submit" className="create-button">
                    Create Account
                  </button>
                  <button type="button" className="cancel-button" onClick={togglePopup}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Members Table */}
        <table className="members-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Community Name</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {membersData.map((member) => (
              <tr key={member.id}>
                <td>{member.username}</td>
                <td>{member.email}</td>
                <td>{member.community}</td>
                <td>{member.type}</td>
                <td>
                  <button
                    className="remove-button"
                    onClick={() => handleRemove(member.id)}
                  >
                    Remove
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

export default Members;
