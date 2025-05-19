import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { initializeSocket } from '../services/socketService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 404) {
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5001/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? {...n, read: true} : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      fetchNotifications();
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5001/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting notification:', error);
      fetchNotifications();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    const socket = initializeSocket(token);

    // Join user-specific room when connected
    const onConnect = () => {
      console.log('Socket connected for notifications');
      setIsConnected(true);
      socket.emit('join-user-room', userId); // Add this line
    };

    socket.on('connect', onConnect);

    socket.on('new-notification', (newNotification) => {
      console.log('New notification received:', newNotification);
      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => n._id === newNotification._id);
        if (exists) return prev;
        
        return [newNotification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    });

    // Initial fetch
    fetchNotifications();

    return () => {
      socket.off('connect', onConnect);
      socket.off('new-notification');
      socket.off('connect_error');
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      fetchNotifications,
      markAsRead,
      deleteNotification,
      isConnected
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);