import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faBell, faSignOutAlt, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import logo from "../logo.png";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState(3); // Example count
  const dropdownRef = useRef(null);

  // User info state
  const [user, setUser] = useState({
    username: localStorage.getItem("username") || "Guest",
    email: localStorage.getItem("email") || "Not Available"
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setUser({
        username: localStorage.getItem("username") || "Guest",
        email: localStorage.getItem("email") || "Not Available"
      });
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Handle click outside dropdown to close it
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
        // Call the backend logout route to clear the googleAuthToken cookie
        const response = await fetch("http://localhost:5001/api/auth/logout", {
            method: "GET",
            credentials: "include", // Ensure cookies are sent
        });

        if (response.ok) {
            // Clear local storage
            localStorage.removeItem("userToken");
            localStorage.removeItem("username");
            localStorage.removeItem("email");
            localStorage.removeItem("userId");
            localStorage.removeItem("status");
            localStorage.removeItem("token");
            localStorage.removeItem("authenticated");

            // Reset user state
            setUser({ username: "Guest", email: "Not Available" });

            // Redirect to login page
            navigate("/login");
            setShowDropdown(false);
        } else {
            console.error("Failed to logout");
        }
    } catch (error) {
        console.error("Error logging out:", error);
    }
};
  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />

      <div className="Header-right">
        {/* Notification Icon */}
        <div className="Notification-container">
          <FontAwesomeIcon icon={faBell} className="Icon" title="Notifications" />
          {notifications > 0 && <span className="Notification-badge">{notifications}</span>}
        </div>

        {/* User Info */}
        <div className="User-info">
          <span className="Username">{user.username}</span>
          <span className="Email">{user.email}</span>
        </div>

        {/* Dropdown Button */}
        <div className="Dropdown-container" ref={dropdownRef}>
          <button className="Dropdown-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <FontAwesomeIcon icon={faChevronDown} className="Arrow-icon" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="Dropdown-menu">
              <button className="Dropdown-item" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} className="Logout-icon" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
