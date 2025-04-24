// Updated header.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faBell,
  faSignOutAlt,
  faChevronDown,
  faComment,
  faCamera,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from "../contexts/NotificationContext.js";
import logo from "../logo.png";
import "./Header.css";
import axios from "axios";


const Header = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    fetchNotifications,
    isConnected,
  } = useNotifications();

 

  const [user, setUser] = useState({
    username: localStorage.getItem("username") || "Guest",
    email: localStorage.getItem("email") || "Not Available",
    profileImage: localStorage.getItem("profileImage") || null,
  });

  useEffect(() => {
   // In the fetchUserData function in Header.jsx
   const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      const response = await axios.get(
        "http://localhost:5001/api/auth/user",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.data) {
        const { username, email, profileImage } = response.data;
        setUser({
          username: username || localStorage.getItem("username") || "Guest",
          email: email || localStorage.getItem("email") || "Not Available",
          profileImage: profileImage || localStorage.getItem("profileImage") || null,
        });
        
        // Update localStorage
        if (username) localStorage.setItem("username", username);
        if (email) localStorage.setItem("email", email);
        if (profileImage) localStorage.setItem("profileImage", profileImage);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Handle 401 by clearing invalid token
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
      // Fallback to localStorage
      setUser({
        username: localStorage.getItem("username") || "Guest",
        email: localStorage.getItem("email") || "Not Available",
        profileImage: localStorage.getItem("profileImage") || null,
      });
    }
  };

    fetchUserData();
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleStorageChange = () => {
      setUser({
        username: localStorage.getItem("username") || "Guest",
        email: localStorage.getItem("email") || "Not Available",
        profileImage: localStorage.getItem("profileImage") || null,
      });
    };

    window.addEventListener("storage", handleStorageChange);

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setShowNotifications(false);
        setShowImageUpload(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchNotifications]);

  // In Header.jsx, enhance the storage event listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "profileImage") {
        setUser((prev) => ({
          ...prev,
          profileImage: e.newValue || null,
        }));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:5001/api/auth/logout", {
        withCredentials: true,
      });

      // Only remove sensitive data
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");

      setUser({
        username: "Guest",
        email: "Not Available",
        profileImage: localStorage.getItem("profileImage") || null, // Keep profile image
      });

      navigate("/login");
      setShowDropdown(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setShowImageUpload(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("profileImage", selectedFile);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5001/api/auth/upload-profile-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        localStorage.setItem("profileImage", response.data.imageUrl);
        setUser((prev) => ({ ...prev, profileImage: response.data.imageUrl }));
        setShowImageUpload(false);
        setSelectedFile(null);
        setPreviewImage(null);
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      alert("Failed to upload profile image");
    }
  };

  const removeProfileImage = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        "http://localhost:5001/api/auth/remove-profile-image",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        localStorage.removeItem("profileImage");
        setUser((prev) => ({ ...prev, profileImage: null }));
        setShowImageUpload(false);
      }
    } catch (error) {
      console.error("Error removing profile image:", error);
    }
  };

  useEffect(() => {
    if (unreadCount > 0 && showNotifications) {
      fetchNotifications();
    }
  }, [unreadCount, showNotifications, fetchNotifications]);

  return (
    <header className="App-header">
      <div className="Header-left">
        <img src={logo} className="App-logo" alt="logo" />
      </div>

      <div className="Header-right">
        {/* Message Icon */}
        <div
          className="Message-icon-wrapper"
          onClick={() => navigate("/chat")}
          style={{ cursor: "pointer" }}
        >
          <FontAwesomeIcon icon={faComment} className="Icon" />
          <span className="Message-badge">3</span>
        </div>

         {/* Message Icon */}
         {/* <div
          className="Messages-icon-wrapper"
          onClick={() => navigate("/messenger")}
          style={{ cursor: "pointer" }}
        >
          <FontAwesomeIcon icon={faComment} className="Icon" />
          <span className="Messages-badge">10</span>
        </div>

 */}

        {/* Notification Icon */}
        <div className="Notification-container" ref={notificationRef}>
          <div
            className={`Notification-icon-wrapper ${
              !isConnected ? "disconnected" : ""
            }`}
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                fetchNotifications();
              }
            }}
            title={
              isConnected
                ? "Notifications"
                : "Connection lost - notifications disabled"
            }
          >
            <FontAwesomeIcon icon={faBell} className="Icon" />
            {unreadCount > 0 && (
              <span className="Notification-badge">{unreadCount}</span>
            )}
            {!isConnected && <span className="Connection-dot"></span>}
          </div>

          {showNotifications && (
            <div className="Notification-dropdown">
              <div className="Notification-header">
                <h4>Notifications</h4>
              </div>
              <div className="Notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`Notification-item ${
                        !notification.read ? "unread" : ""
                      }`}
                      onClick={() => {
                        markAsRead(notification._id);
                      }}
                    >
                      <p className="Notification-message">
                        {notification.message}
                      </p>
                      <div className="Notification-meta">
                        <span className="Notification-time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="Notification-empty">No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="Profile-container" ref={dropdownRef}>
          <div
            className="Profile-icon-wrapper"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="Profile-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  setUser((prev) => ({ ...prev, profileImage: null }));
                }}
              />
            ) : (
              <FontAwesomeIcon icon={faUserCircle} className="Profile-icon" />
            )}
          </div>

          {showDropdown && (
            <div className="Profile-dropdown">
              <div className="Profile-dropdown-header">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="Profile-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      setUser((prev) => ({ ...prev, profileImage: null }));
                    }}
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faUserCircle}
                    className="Profile-icon"
                  />
                )}
                <div className="Profile-dropdown-info">
                  <span className="Profile-dropdown-username">
                    {user.username}
                  </span>
                  <span className="Profile-dropdown-email">{user.email}</span>
                </div>
              </div>
              <div className="Profile-dropdown-divider"></div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />

              <button
                className="Profile-dropdown-item"
                onClick={() => fileInputRef.current.click()}
              >
                <FontAwesomeIcon icon={faCamera} />{" "}
                {user.profileImage ? "Change Profile" : "Upload Photo"}
              </button>

              {user.profileImage && (
                <button
                  className="Profile-dropdown-item"
                  onClick={removeProfileImage}
                >
                  <FontAwesomeIcon icon={faTimes} /> Remove Profile Photo
                </button>
              )}

              {/* <Link to="/profile" className="Profile-dropdown-item">
                View Profile
              </Link> */}
              <button
                className="Profile-dropdown-item logout"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
              </button>

              {showImageUpload && (
                <div className="Image-upload-preview">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="Preview-image"
                  />
                  <div className="Image-upload-actions">
                    <button onClick={handleUpload}>Save</button>
                    <button
                      onClick={() => {
                        setShowImageUpload(false);
                        setSelectedFile(null);
                        setPreviewImage(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
