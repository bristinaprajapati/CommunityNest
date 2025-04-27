// import React, { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';
// import { io } from 'socket.io-client';

// const NotificationContext = createContext();

// export const NotificationProvider = ({ children }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [socket, setSocket] = useState(null);
//   const [isConnected, setIsConnected] = useState(false);

//   const fetchNotifications = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) return;
      
//       const response = await axios.get('http://localhost:5001/api/notifications', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       setNotifications(response.data.notifications || []);
//       setUnreadCount(response.data.unreadCount || 0);
//     } catch (error) {
//       console.error('Error fetching notifications:', error);
//       if (error.response?.status === 404) {
//         setNotifications([]);
//         setUnreadCount(0);
//       }
//     }
//   };

//   const markAsRead = async (notificationId) => {
//     try {
//       const token = localStorage.getItem('token');
//       await axios.patch(
//         `http://localhost:5001/api/notifications/${notificationId}/read`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       // Optimistic update
//       setNotifications(prev => 
//         prev.map(n => 
//           n._id === notificationId ? {...n, read: true} : n
//         )
//       );
//       setUnreadCount(prev => Math.max(0, prev - 1));
//     } catch (error) {
//       console.error('Error marking notification as read:', error);
//       fetchNotifications(); // Fallback to refetch
//     }
//   };

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const userId = localStorage.getItem('userId');
//     if (!token || !userId) return;
  
//     const newSocket = io('http://localhost:5001', {
//       auth: { token },
//       transports: ['websocket'],
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000
//     });
  
//     setSocket(newSocket);
  
//     // Authentication
//     newSocket.on('connect', () => {
//       console.log('Socket connected');
//       setIsConnected(true);
//       newSocket.emit('authenticate', token);
//     });
  
//     newSocket.on('authenticated', () => {
//       console.log('Socket authenticated');
//     });
  
//     // notification handler
//     newSocket.on('new-notification', (newNotification) => {
//       console.log('New notification received:', newNotification);
//       setNotifications(prev => {
//         // Check for duplicates by ID and createdAt
//         const exists = prev.some(n => 
//           n._id === newNotification._id || 
//           (n.sender?._id === newNotification.sender?._id && 
//            n.message === newNotification.message &&
//            new Date(n.createdAt).getTime() === new Date(newNotification.createdAt).getTime())
//         );
//         return exists ? prev : [newNotification, ...prev];
//       });
//       setUnreadCount(prev => prev + 1);
//     });
  
//     // Error handling
//     newSocket.on('connect_error', (err) => {
//       console.error('Socket connection error:', err);
//       setIsConnected(false);
//     });
  
//     // Initial fetch
//     fetchNotifications();
  
//     return () => {
//       newSocket.disconnect();
//     };
//   }, []);

//   return (
//     <NotificationContext.Provider value={{ 
//       notifications, 
//       unreadCount, 
//       fetchNotifications,
//       markAsRead,
//       isConnected
//     }}>
//       {children}
//     </NotificationContext.Provider>
//   );
// };

// export const useNotifications = () => useContext(NotificationContext);
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { initializeSocket, getSocket } from '../services/socketService';

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
      fetchNotifications(); // Refresh as fallback
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) return;

    const socket = initializeSocket(token);

    socket.on('connect', () => {
      console.log('Socket connected for notifications');
      setIsConnected(true);
    });

    socket.on('new-notification', (newNotification) => {
      console.log('New notification received:', newNotification);
      setNotifications(prev => {
        const exists = prev.some(n => 
          n._id === newNotification._id || 
          (n.sender?._id === newNotification.sender?._id && 
           n.message === newNotification.message &&
           new Date(n.createdAt).getTime() === new Date(newNotification.createdAt).getTime())
        );
        return exists ? prev : [newNotification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    });

    fetchNotifications();

   
    

    return () => {
      // Don't disconnect here - let the socket live for other features
      socket.off('new-notification');
      socket.off('connect');
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
