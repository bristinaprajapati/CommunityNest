import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Add useLocation
import './sidebar.css';
import { FaHome, FaSitemap, FaUsers, FaCalendarAlt, FaUserFriends,FaNewspaper } from 'react-icons/fa'; 
import axios from 'axios';
import logo2 from '../logo.png';

const Sidebar = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);
  const location = useLocation(); // Get current location

// Add this to your existing useEffect or create a new one:

useEffect(() => {
  const handleProfileImageChange = (event) => {
    setProfileImage(event.detail.profileImage);
  };
  
  // Listen for custom profile image change events
  window.addEventListener('profileImageChanged', handleProfileImageChange);
  
  return () => {
    window.removeEventListener('profileImageChanged', handleProfileImageChange);
  };
}, []);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const token = localStorage.getItem('token');
        const status = localStorage.getItem('status');
        
        if (!token) {
          setLoading(false);
          return;
        }

        setUserStatus(status);

        if (status === 'community') {
          // For community admin - show their own profile image
          const response = await axios.get('http://localhost:5001/api/auth/user', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProfileImage(response.data.profileImage);
        } else {
          // For member - get their community admin's profile image
          const userResponse = await axios.get('http://localhost:5001/api/auth/data', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (userResponse.data.communities?.length > 0) {
            const communityResponse = await axios.get(
              `http://localhost:5001/api/auth/community/${userResponse.data.communities[0]}`, 
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            
            if (communityResponse.data.admin) {
              // If the admin field is populated with user data
              if (typeof communityResponse.data.admin === 'object') {
                setProfileImage(communityResponse.data.admin.profileImage);
              } 
              // If the admin field is just an ID
              else {
                const adminResponse = await axios.get(
                  `http://localhost:5001/api/auth/user/${communityResponse.data.admin}`, 
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );
                setProfileImage(adminResponse.data.profileImage);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileImage();
  }, []);

  return (
    <div className="Sidebar">
      <div className="Sidebar-logo">
        {loading ? (
          <div className="Sidebar-profile-loading">Loading</div>
        ) : profileImage ? (
          <img 
            src={profileImage} 
            className="Sidebar-profile-image" 
            alt={userStatus === 'community' ? 'Your Profile' : 'Community Profile'} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = logo2;
            }}
          />
        ) : (
          // <img src={logo2} className="App-logo" alt="Sidebar-logo-img" />
          <div className="Sidebar-text-logo">
            Community Logo
          </div>
        )}
      </div>

      <div className="Sidebar-menu">
        <Link 
          to="/dashboard" 
          className={`Sidebar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          <div className="Sidebar-icon" style={{ backgroundColor: '#34c759', color: 'white' }}>
            <FaHome />
          </div>
          <span className="Sidebar-text">Dashboard</span>
        </Link>

        <Link 
          to="/feed" 
          className={`Sidebar-item ${location.pathname === '/feed' ? 'active' : ''}`}
        >
          <div className="Sidebar-icon" style={{ backgroundColor: '#dfbd01', color: 'white' }}>
            <FaNewspaper />
          </div>
          <span className="Sidebar-text">Feed</span>
        </Link>

        <Link 
          to="/members" 
          className={`Sidebar-item ${location.pathname.startsWith('/members') ? 'active' : ''}`}
        >
          <div className="Sidebar-icon" style={{ backgroundColor: '#4b7bec', color: 'white' }}>
            <FaUserFriends />
          </div>
          <span className="Sidebar-text">Members</span>
        </Link>

        <Link 
          to="/department" 
          className={`Sidebar-item ${location.pathname.startsWith('/department') ? 'active' : ''}`}
        >
          <div className="Sidebar-icon" style={{ backgroundColor: '#a259ff', color: 'white' }}>
            <FaSitemap />
          </div>
          <span className="Sidebar-text">Departments</span>
        </Link>

        <Link 
          to="/admin-user-meetings" 
          className={`Sidebar-item ${location.pathname.startsWith('/admin-user-meetings') ? 'active' : ''}`}
        >
          <div className="Sidebar-icon" style={{ backgroundColor: '#ffcc00', color: 'white' }}>
            <FaUsers />
          </div>
          <span className="Sidebar-text">Meetings</span>
        </Link>

        <Link 
          to="/admin-user-events" 
          className={`Sidebar-item ${location.pathname.startsWith('/admin-user-events') ? 'active' : ''}`}
        >
          <div className="Sidebar-icon" style={{ backgroundColor: '#007aff', color: 'white' }}>
            <FaCalendarAlt />
          </div>
          <span className="Sidebar-text">Events</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;