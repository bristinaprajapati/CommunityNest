import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const socketRef = useRef(null);
  


  // Initialize socket connection
  useEffect(() => {
    const socket = io("http://localhost:5001", {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      const token = localStorage.getItem('token');
      if (token) {
        socket.emit('authenticate', token);
        // Request initial unread counts
        socket.emit('get-unread-counts');
      }
    });

    // Handle real-time unread count updates
    socket.on('unread-count-update', (data) => {
      if (data.chatId && data.count !== undefined) {
        setUnreadCounts(prev => ({
          ...prev,
          [data.chatId]: data.count
        }));
      }
    });

    // Handle total unread count updates
    socket.on('total-unread-update', (data) => {
      if (data.total !== undefined) {
        setTotalUnread(data.total);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  

  // Calculate total unread whenever counts change
  useEffect(() => {
    const newTotal = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    setTotalUnread(newTotal);
  }, [unreadCounts]);

  return (
    <ChatContext.Provider value={{ 
      unreadCounts, 
      setUnreadCounts, 
      totalUnread, 
      setTotalUnread,
      socket: socketRef.current
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);