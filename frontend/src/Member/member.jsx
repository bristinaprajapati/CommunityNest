import React, { useEffect, useState } from "react";
import axios from "axios";
import "./member.css";
import Sidebar from "../Sidebar/sidebar.jsx"; // Import Sidebar
import { FiPlus, FiTrash2, FiUser, FiMail } from "react-icons/fi";

const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(""); // State for new member email
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [userStatus, setUserStatus] = useState(""); // User's status: community or member
  const [communityId, setCommunityId] = useState(""); // Community ID

  useEffect(() => {
    fetchUserStatus();
  }, []);

  useEffect(() => {
    console.log("useEffect triggered. Community ID:", communityId);
    if (communityId) {
      fetchMembers(communityId); // Ensure community ID is passed
    }
  }, [communityId]);

  // Runs when communityId updates

  // Fetch user status to determine if they can add members
  const fetchUserStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5001/api/auth/data", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setUserStatus(response.data.status);

      // If user is a member, fetch the community ID they belong to
      if (response.data.status === "member") {
        const firstCommunity = response.data.communities[0];
        setCommunityId(firstCommunity);
        fetchMembers(firstCommunity); // Fetch members immediately
      } else if (response.data.status === "community") {
        setCommunityId(response.data.managedCommunity); // If user manages a community, get the community ID
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  };

  // Fetch members for the current community
  const fetchMembers = async (communityId) => {
    if (!communityId) {
      console.error("Community ID is missing.");
      setMessage("Community ID is missing.");
      return;
    }
    console.log("Fetching members for community:", communityId);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5001/api/community/${communityId}/members`,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      console.log("Fetched members:", response.data.members);
      setMembers(response.data.members);
    } catch (error) {
      console.error("Error fetching members:", error);
      setMessage("Error fetching members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new member
  const addMember = async () => {
    if (!email) {
      setMessage("Please enter a valid email.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("You need to be logged in to add members.");
      return;
    }

    if (!communityId) {
      console.error("Community ID is missing, cannot add members.");
      setMessage("Community ID is missing, cannot add members.");
      return;
    }

    try {
      setAdding(true);
      const response = await axios.post(
        "http://localhost:5001/api/community/add-member",
        { communityId, memberEmail: email },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setMessage(response.data.message);
      setEmail(""); // Clear input field

      // Pass communityId explicitly
      fetchMembers(communityId);
    } catch (error) {
      console.error("Add member error:", error.response?.data || error);
      setMessage(error.response?.data?.message || "Error adding member.");
    } finally {
      setAdding(false);
    }
  };

  const removeMember = async (memberId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member?"
    );
    if (!confirmed) return;

    if (!communityId) {
      console.error("Community ID is missing, cannot remove members.");
      setMessage("Community ID is missing, cannot remove members.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("You need to be logged in to remove members.");
        return;
      }

      const response = await axios.delete(
        `http://localhost:5001/api/community/${communityId}/remove-member/${memberId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setMessage(response.data.message);

      // Pass communityId explicitly
      fetchMembers(communityId);
    } catch (error) {
      console.error("Error removing member:", error.response?.data || error);
      setMessage("Error removing member. Please try again.");
    }
  };

  return (
    <div className="members-page-container">
      <Sidebar />
      <div className="members-content">
        <div className="members-header">
          <h2 className="members-title">
            {/* <FiUser className="header-icon" /> */}
            Community Members
          </h2>

          {userStatus === "community" && (
            <div className="add-member-card">
              <h4 className="add-member-title">Add New Members</h4>
              <div className="add-member-form">
                <div className="input-group">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="Enter member email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="member-input"
                  />
                </div>
                <button
                  onClick={addMember}
                  disabled={adding}
                  className="add-member-button"
                >
                  <FiPlus className="button-icon" />
                  {adding ? "Adding..." : "Add Member"}
                </button>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`message-box ${
                message.includes("Error") ? "error" : "success"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        <div className="members-table-container">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading members...</p>
            </div>
          ) : members.length > 0 ? (
            <table className="members-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  {userStatus === "community" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member._id}>
                    <td>
                      <div className="member-info">
                        {member.profileImage ? (
                          <img
                            src={member.profileImage}
                            alt={member.username}
                            className="member-profile-image"
                            onError={(e) => {
                              console.error(
                                `Failed to load image for ${member.username}`
                              );
                              e.target.onerror = null;
                              e.target.style.display = "none";
                              e.target.parentNode.innerHTML = `<div class="member-avatar">${member.username
                                .charAt(0)
                                .toUpperCase()}</div>`;
                            }}
                          />
                        ) : (
                          <div className="member-avatar">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {member.username}
                      </div>
                    </td>
                    <td>{member.email}</td>
                    {userStatus === "community" && (
                      <td>
                        <button
                          onClick={() => removeMember(member._id)}
                          className="remove-member-button"
                          title="Remove member"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <FiUser className="empty-icon" />
              <p>No members found in this community</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
