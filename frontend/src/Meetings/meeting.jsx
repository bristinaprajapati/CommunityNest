import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../Sidebar/sidebar.jsx";
import "./meeting.css";
import {
  FiCalendar,
  FiClock,
  FiUsers,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiVideo,
  FiMoreVertical,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

const ScheduleMeetingForm = () => {
  const [eventData, setEventData] = useState({
    summary: "",
    description: "",
    start: "",
    end: "",
    attendees: "",
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [events, setEvents] = useState([]);
  const [menuVisible, setMenuVisible] = useState(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [memberEmails, setMemberEmails] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const menuRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuVisible && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuVisible(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuVisible]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/meeting/check-auth",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          setAuthenticated(true);
          fetchEvents();
          fetchUserEmail();
          fetchUserStatus(); // Add this function call
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        setAuthenticated(false);
      }
    };

    const fetchUserStatus = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        
        const response = await fetch(
          `http://localhost:5001/api/auth/user/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        if (response.ok) {
          const userData = await response.json();
          setUserStatus(userData.status);
        }
      } catch (error) {
        console.error("Error fetching user status:", error);
      }
    };

    checkAuth();
  }, []);

  const fetchUserEmail = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/meeting/fetch-email",
        {
          method: "GET",
          credentials: "include", // Ensure cookies are sent
        }
      );

      if (!response.ok) {
        const errorText = await response.text(); // Read the response as text
        console.error("Error fetching user email:", errorText);
        alert(`Error fetching user email: ${errorText}`);
        return;
      }

      const result = await response.json();
      setEmail(result.email);
    } catch (error) {
      console.error("Error fetching user email:", error);
      alert(
        "Something went wrong while fetching your email. Please try again."
      );
    }
  };

  const fetchMemberEmails = async () => {
    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        console.error("User ID is required");
        return;
      }

      const response = await fetch(
        `http://localhost:5001/api/meeting/community/members?userId=${userId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const result = await response.json();
      if (response.ok) {
        const emails = result.emails.join(", ");
        setMemberEmails(result.emails);
        setEventData((prev) => ({
          ...prev,
          attendees: emails,
        }));
      } else {
        console.error("Error fetching member emails:", result.error);
      }
    } catch (error) {
      console.error("Error fetching member emails:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/meeting/events", {
        method: "GET",
        credentials: "include", // Ensure cookies are sent
      });

      if (!response.ok) {
        const errorText = await response.text(); // Read the response as text
        console.error("Error fetching events:", errorText);
        alert(`Error fetching events: ${errorText}`);
        return;
      }

      const result = await response.json();
      setEvents(result.events);
    } catch (error) {
      console.error("Error fetching events:", error);
      alert("Something went wrong while fetching events.");
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = "http://localhost:5001/api/meeting/google";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authenticated) {
      alert("Please sign in with Google before scheduling a meeting.");
      return;
    }

    const attendeesList = eventData.attendees
      .split(",")
      .map((email) => email.trim());

    console.log("Scheduling meeting with data:", {
      ...eventData,
      attendees: attendeesList,
    });

    try {
      const response = await fetch(
        "http://localhost:5001/api/meeting/schedule_meeting",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Ensure cookies are sent
          body: JSON.stringify({ ...eventData, attendees: attendeesList }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMeetingLink(result.eventLink);
        alert(`Meeting Scheduled! Link: ${result.eventLink}`);
        fetchEvents();
        setEventData({
          summary: "",
          description: "",
          start: "",
          end: "",
          attendees: "",
        });
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleMenuToggle = (eventId) => {
    setMenuVisible(menuVisible === eventId ? null : eventId);
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      alert("Meeting link copied to clipboard!");
    });
  };

  const handleEdit = (eventId) => {
    const eventToEdit = events.find((event) => event.id === eventId);

    if (!eventToEdit) return;

    setCurrentEvent({
      ...eventToEdit,
      start: eventToEdit.start?.dateTime?.slice(0, 16) || "",
      end: eventToEdit.end?.dateTime?.slice(0, 16) || "",
      attendees: eventToEdit.attendees
        ? eventToEdit.attendees.map((attendee) => attendee.email).join(", ") // This converts the array to a string
        : "",
    });

    setEditModalVisible(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Convert the attendees string back into an array
    const updatedEvent = {
      ...currentEvent,
      attendees: currentEvent.attendees.split(",").map((email) => email.trim()), // Convert to array and trim whitespace
    };

    console.log("Editing event with data:", updatedEvent);

    try {
      const response = await fetch(
        `http://localhost:5001/api/meeting/edit_meeting/${currentEvent.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Ensure cookies are sent
          body: JSON.stringify(updatedEvent),
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert("Event updated successfully!");
        setEditModalVisible(false);
        fetchEvents();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentEvent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = async (eventId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this meeting?"
    );
    if (confirmed) {
      try {
        const response = await fetch(
          `http://localhost:5001/api/meeting/delete_meeting/${eventId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (response.ok) {
          alert("Meeting deleted successfully!");
          fetchEvents();
        } else {
          alert("Error deleting the meeting.");
        }
      } catch (error) {
        console.error("Error deleting meeting:", error);
        alert("Something went wrong while deleting the meeting.");
      }
    }
  };

  return (
    <div className="meeting-container">
      <Sidebar />
      <div className="meeting-content">
        <div className="meeting-header">
          <h1>Schedule & Meet</h1>
          {!authenticated ? (
            <button className="google-signin-btn" onClick={handleGoogleAuth}>
              <FcGoogle className="google-icon" /> Sign in with Google
            </button>
          ) : (
            <div className="user-actions">
              <span className="user-email">Signed in as: {email}</span>
              {userStatus === 'community' && (
                <button
                  className="primary-btn"
                  onClick={async () => {
                    setScheduleModalVisible(true);
                    await fetchMemberEmails();
                  }}
                >
                  <FiCalendar /> Schedule Meeting
                </button>
              )}
            </div>
          )}
        </div>
  
        {!authenticated && (
          <div className="auth-prompt">
            <p>Please sign in with Google to view meetings</p>
          </div>
        )}
  
        {authenticated && (
          <div className="meetings-section">
            {events.length > 0 ? (
              <div className="meetings-grid">
                {events.map((event) => (
                  <div key={event.id} className="meeting-card">
                    <div className="card-header">
                      <h3>{event.summary}</h3>
                      <div ref={menuRef}>
                      <button
                        className="card-menu-btn"
                        onClick={() => handleMenuToggle(event.id)}
                      >
                        <FiMoreVertical />
                      </button>
                      {menuVisible === event.id && (
                        <div className="card-menu">
                          {userStatus === 'community' && (
                            <>
                              <button onClick={() => handleEdit(event.id)}>
                                <FiEdit2 /> Edit
                              </button>
                              <button onClick={() => handleDelete(event.id)}>
                                <FiTrash2 /> Delete
                              </button>
                            </>
                          )}
                          {event.hangoutLink && (
                            <button
                              onClick={() => handleCopyLink(event.hangoutLink)}
                            >
                              <FiCopy /> Copy Link
                            </button>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
  
                    <div className="card-body">
                      <p className="agenda">Agenda:</p>
                      <p className="description">{event.description}</p>
  
                      <div className="time-info">
                        <div className="time-block">
                          <FiClock className="time-icon" />
                          <div>
                            <span className="time-label">Starts:</span>
                            <span>
                              {new Date(event.start.dateTime).toLocaleString()}
                            </span>
                          </div>
                        </div>
  
                        <div className="time-block">
                          <FiClock className="time-icon" />
                          <div>
                            <span className="time-label">Ends:</span>
                            <span>
                              {new Date(event.end.dateTime).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
  
                      {event.attendees?.length > 0 && (
                        <div className="attendees-info">
                          <FiUsers className="attendees-icon" />
                          <span>
                            {event.attendees.length} attendee
                            {event.attendees.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
  
                    {event.hangoutLink && (
                      <a
                        href={event.hangoutLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="join-btn"
                      >
                        <FiVideo /> Join Meeting
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FiCalendar className="empty-icon" />
                <p>No upcoming meetings scheduled</p>
                {userStatus === 'community' && (
                  <button
                    className="primary-btn"
                    onClick={async () => {
                      setScheduleModalVisible(true);
                      await fetchMemberEmails();
                    }}
                  >
                    Schedule Your First Meeting
                  </button>
                )}
              </div>
            )}
          </div>
        )}
  
        {/* Schedule Meeting Modal */}
        {scheduleModalVisible && (
          <div className="schedule-modal-overlay">
            <div className="schedule-modal">
              <div className="schedule-modal-header">
                <h2>Schedule New Meeting</h2>
                <button
                  className="schedule-close-btn"
                  onClick={() => setScheduleModalVisible(false)}
                >
                  &times;
                </button>
              </div>
  
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Meeting Title</label>
                  <input
                    type="text"
                    name="summary"
                    placeholder="Team sync, 1:1, etc."
                    value={eventData.summary}
                    onChange={handleChange}
                    required
                  />
                </div>
  
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    placeholder="Meeting agenda or details"
                    value={eventData.description}
                    onChange={handleChange}
                    required
                    rows="3"
                  />
                </div>
  
                <div className="time-inputs">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="datetime-local"
                      name="start"
                      value={eventData.start}
                      onChange={handleChange}
                      required
                    />
                  </div>
  
                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="datetime-local"
                      name="end"
                      value={eventData.end}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
  
                <div className="form-group">
                  <label>Attendees</label>
                  <input
                    type="text"
                    name="attendees"
                    value={eventData.attendees}
                    placeholder="email1@example.com, email2@example.com"
                    onChange={(e) =>
                      setEventData((prev) => ({
                        ...prev,
                        attendees: e.target.value,
                      }))
                    }
                    required
                  />
                  <small className="hint">Separate emails with commas</small>
                </div>
  
                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setScheduleModalVisible(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    {loading ? "Scheduling..." : "Schedule Meeting"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
  
        {/* Edit Meeting Modal */}
        {editModalVisible && (
          <div className="edit-modal-overlay">
            <div className="edit-modal">
              <div className="edit-modal-header">
                <h2>Edit Meeting</h2>
                <button
                  className="edit-close-btn"
                  onClick={() => setEditModalVisible(false)}
                >
                  &times;
                </button>
              </div>
  
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>Meeting Title</label>
                  <input
                    type="text"
                    name="summary"
                    placeholder="Event Title"
                    value={currentEvent?.summary || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>
  
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    placeholder="Event Description"
                    value={currentEvent?.description || ""}
                    onChange={handleEditChange}
                    required
                    rows="3"
                  />
                </div>
  
                <div className="time-inputs">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="datetime-local"
                      name="start"
                      value={currentEvent?.start || ""}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
  
                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="datetime-local"
                      name="end"
                      value={currentEvent?.end || ""}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                </div>
  
                <div className="form-group">
                  <label>Attendees</label>
                  <input
                    type="text"
                    name="attendees"
                    value={currentEvent?.attendees || ""}
                    placeholder="Attendees (comma-separated emails)"
                    onChange={handleEditChange}
                    required
                  />
                  <small className="hint">Separate emails with commas</small>
                </div>
  
                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setEditModalVisible(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn">
                    Save Changes
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

export default ScheduleMeetingForm;
