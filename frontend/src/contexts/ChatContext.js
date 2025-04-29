import { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const ChatContext = createContext();

// Define max retries as a constant
const MAX_RETRIES = 5;

// In ChatContext.js
export const ChatProvider = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const socketRef = useRef(null);
  const timers = useRef({});
  const retryCount = useRef(0);

  // Enhanced fetchUnreadCounts function
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5001/api/chat/unread-counts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setUnreadCounts(response.data.unreadCounts || {});
        setTotalUnread(response.data.totalUnread || 0);
      }
      retryCount.current = 0;
    } catch (error) {
      console.error('Error fetching unread counts:', error);
      if (retryCount.current < MAX_RETRIES) {
        const delay = Math.min(4000 * (2 ** retryCount.current), 60000);
        timers.current.unreadFetch = setTimeout(() => {
          retryCount.current++;
          fetchUnreadCounts();
        }, delay);
      }
    }
  }, []);

  // Socket.io setup with enhanced event handling
  useEffect(() => {
    const socket = socketRef.current = io("http://localhost:5001", {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      const token = localStorage.getItem("token");
      if (token) {
        socket.emit('authenticate', token);
      }
      fetchUnreadCounts();
    });

    socket.on('authenticated', () => {
      console.log('Socket authenticated');
    });

    // Enhanced event listeners
    socket.on('unread-count-update', (data) => {
      if (data.unreadCounts) {
        setUnreadCounts(data.unreadCounts);
      }
      if (data.totalUnread !== undefined) {
        setTotalUnread(data.totalUnread);
      }
    });

    socket.on('new-unread-message', (data) => {
      fetchUnreadCounts(); // Always refetch to ensure accuracy
    });

    socket.on('messages-marked-read', (data) => {
      fetchUnreadCounts(); // Refetch when messages are marked as read
    });

    // Initial fetch
    fetchUnreadCounts();

    return () => {
      socket.disconnect();
      if (timers.current.unreadFetch) {
        clearTimeout(timers.current.unreadFetch);
      }
    };
  }, [fetchUnreadCounts]);

  // Enhanced markAsRead function
  const markAsRead = async (conversationId, type = 'private') => {
    try {
      const token = localStorage.getItem("token");
      await axios.post('http://localhost:5001/api/chat/mark-as-read', {
        conversationId,
        type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchUnreadCounts(); // Always refetch after marking as read
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      unreadCounts, 
      totalUnread,
      markAsRead,
      fetchUnreadCounts
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);