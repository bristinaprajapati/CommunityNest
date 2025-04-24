import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar/sidebar.jsx";
import "./event.css";
import { useNavigate } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";

const Events = () => {
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dropdownOpenId, setDropdownOpenId] = useState(null); // Track which dropdown is open

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    image: null,
    status: "Private", // Default status set to "Private"
  });
  const [loading, setLoading] = useState(false);
 
  const navigate = useNavigate();

  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const [userStatus, setUserStatus] = useState(null); // Track user status

  useEffect(() => {
    fetchEvents();
    fetchUserStatus(); // Fetch user status on component mount
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpenId(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const fetchUserStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5001/api/auth/data", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUserStatus(response.data.status); // Set the user status to "member" or "community"
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  };

  const openEditModal = (event, e) => {
    e.stopPropagation(); // Prevents the click event from propagating and triggering navigation
    setSelectedEvent(event);
    setEditModal(true);
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Sort by createdAt date (newest first)
      const sortedEvents = res.data.events.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Update the handleChange function to include status
  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setEventData({ ...eventData, image: file }); // Just store the file
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !eventData.title ||
      !eventData.date ||
      !eventData.time ||
      !eventData.image
    ) {
      alert("Please fill all required fields and upload an image.");
      return;
    }

    const formData = new FormData();
    formData.append("title", eventData.title);
    formData.append("description", eventData.description); // Add this line
    formData.append("date", eventData.date);
    formData.append("time", eventData.time);
    formData.append("image", eventData.image);
    formData.append("status", eventData.status);

    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5001/api/events",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Event created:", response.data);
      fetchEvents();
      setShowModal(false);
      setEventData({
        title: "",
        date: "",
        time: "",
        image: null,
        status: "Private",
      });
    } catch (error) {
      console.error(
        "Error creating event:",
        error.response?.data || error.message
      );
      alert(
        `Error creating event: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.delete(
        `http://localhost:5001/api/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Update your events state to remove the deleted event
        setEvents(events.filter((event) => event._id !== eventId));
        alert("Event deleted successfully");
      } else {
        alert(response.data.message || "Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert(error.response?.data?.message || "Error deleting event");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5001/api/events/${selectedEvent._id}`,
        {
          title: selectedEvent.title,
          description: selectedEvent.description, // Ensure this is included
          date: selectedEvent.date,
          time: selectedEvent.time,
          status: selectedEvent.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchEvents(); // This refreshes the event list
      setEditModal(false);
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event. Please try again.");
    }
  };

  // Function to toggle event status
  const toggleEventStatus = async (eventId, currentStatus) => {
    const newStatus = currentStatus === "Private" ? "Announcement" : "Private";
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5001/api/events/${eventId}/status`,
        {}, // No body needed since we're using a dedicated endpoint
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.data.success) {
        // Update the local state without refetching all events
        setEvents(
          events.map((event) =>
            event._id === eventId ? { ...event, status: newStatus } : event
          )
        );
        
        if (newStatus === "Announcement") {
          alert("Event published as announcement! All members will be notified.");
        }
      }
    } catch (error) {
      console.error("Error updating event status:", error);
      alert("Failed to update event status. Please try again.");
    }
  };

  return (
    <div className="events-page">
      <Sidebar />
      <div className="events-content">
        <div className="events-header">
          <div className="header-text">
            <h1>Event Management</h1>
            <p className="subheading">
              Create, announce, and manage events easily.
            </p>
          </div>
          {userStatus === "community" && (
            <button
              className="create-event-btn"
              onClick={() => setShowModal(true)}
            >
              + Create Event
            </button>
          )}
        </div>

        <div className="events-container">
          <div className="event-list">
            {events.length === 0 ? (
              <p className="no-events">No events scheduled yet.</p>
            ) : (
              events.map((event) => (
                <div className="event-card" key={event._id}>
                  <div className="event-image-container">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="event-image"
                    />
                  </div>
                  <div className="event-content">
                    <div className="event-text-content">
                      <h3 className="event-title">{event.title}</h3>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                      <div className="event-meta">
                        <span className="event-date">Date: {event.date}</span>
                        <span className="event-time">Time: {event.time}</span>
                      </div>
                    </div>
                    <div className="event-actions">
                      <button
                        className="manage-btn"
                        onClick={() => handleEventClick(event._id)}
                      >
                        Manage
                      </button>
                      {userStatus === "community" && (
                        <div className="event-dropdown-container">
                          <button
                            className="event-dropdown-toggle"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpenId(
                                dropdownOpenId === event._id ? null : event._id
                              );
                            }}
                          >
                            &#8942;
                          </button>
                          {dropdownOpenId === event._id && (
                            <div
                              className="event-dropdown-menu"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="event-dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setEditModal(true);
                                  setDropdownOpenId(null);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="event-dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEventStatus(event._id, event.status);
                                  setDropdownOpenId(null);
                                }}
                              >
                                {event.status === "Announcement"
                                  ? "Remove Announcement"
                                  : "Publish to Announcement"}
                              </button>
                              <button
                                className="event-dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteEvent(event._id);
                                  setDropdownOpenId(null);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal for creating event */}
        {showModal && (
          <div className="modal1">
            <div className="modal-content1">
              <h2>Create Event</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="title"
                  placeholder="Event Title"
                  value={eventData.title}
                  onChange={handleChange}
                  required
                />
                <textarea
                  className="event-description-input"
                  name="description"
                  placeholder="Event Description"
                  value={eventData.description}
                  onChange={handleChange}
                />
                <input
                  type="date"
                  name="date"
                  value={eventData.date}
                  onChange={handleChange}
                  required
                />
                <input
                  type="time"
                  name="time"
                  value={eventData.time}
                  onChange={handleChange}
                  required
                />
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  required
                />
                <div className="modal-buttons">
                  <button type="submit" disabled={loading}>
                    {loading ? "Uploading Image..." : "Post Event"}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModal && selectedEvent && (
          <div className="modal1">
            <div className="modal-content1">
              <h2>Edit Event</h2>
              <form onSubmit={handleEditSubmit}>
                <input
                  type="text"
                  name="title"
                  placeholder="Event Title"
                  value={selectedEvent.title}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      title: e.target.value,
                    })
                  }
                  required
                />
                <textarea
                  className="event-description-input"
                  name="description"
                  placeholder="Event Description"
                  value={selectedEvent.description || ""}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      description: e.target.value,
                    })
                  }
                />
                <input
                  type="date"
                  name="date"
                  value={selectedEvent.date}
                  onChange={(e) =>
                    setSelectedEvent({ ...selectedEvent, date: e.target.value })
                  }
                  required
                />
                <input
                  type="time"
                  name="time"
                  value={selectedEvent.time}
                  onChange={(e) =>
                    setSelectedEvent({ ...selectedEvent, time: e.target.value })
                  }
                  required
                />
                <div className="modal-buttons">
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={() => setEditModal(false)}>
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

export default Events;
