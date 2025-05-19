// ChatContext.js
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const socket = io("http://localhost:5001", {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      const token = localStorage.getItem('token');
      if (token) {
        socket.emit('authenticate', token);
        // Request initial unread counts
        socket.emit('get-unread-counts');
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onUnreadCountUpdate = (data) => {
      if (data.chatId && data.count !== undefined) {
        setUnreadCounts(prev => ({
          ...prev,
          [data.chatId]: data.count
        }));
      }
    };

    const onTotalUnreadUpdate = (data) => {
      if (data.total !== undefined) {
        setTotalUnread(data.total);
      }
    };

    const onPrivateMessage = (data) => {
      if (data.messageData && data.messageData.recipient._id === localStorage.getItem('userId')) {
        // Update unread count for this conversation
        setUnreadCounts(prev => ({
          ...prev,
          [data.messageData.sender._id]: (prev[data.messageData.sender._id] || 0) + 1
        }));
      }
    };

    const onGroupMessage = (data) => {
      if (data.message && data.groupId) {
        // Update unread count for this group
        setUnreadCounts(prev => ({
          ...prev,
          [data.groupId]: (prev[data.groupId] || 0) + 1
        }));
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('unread-count-update', onUnreadCountUpdate);
    socket.on('total-unread-update', onTotalUnreadUpdate);
    socket.on('private-message', onPrivateMessage);
    socket.on('group-message', onGroupMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('unread-count-update', onUnreadCountUpdate);
      socket.off('total-unread-update', onTotalUnreadUpdate);
      socket.off('private-message', onPrivateMessage);
      socket.off('group-message', onGroupMessage);
      socket.disconnect();
    };
  }, []);

  // Calculate total unread whenever counts change
  useEffect(() => {
    const newTotal = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    setTotalUnread(newTotal);
  }, [unreadCounts]);

  const markAsRead = (conversationId) => {
    setUnreadCounts(prev => {
      const newCounts = {...prev};
      delete newCounts[conversationId];
      return newCounts;
    });
    
    if (socketRef.current) {
      socketRef.current.emit('mark-as-read', {
        conversationId,
        userId: localStorage.getItem('userId')
      });
    }
  };

  return (
    <ChatContext.Provider value={{ 
      unreadCounts, 
      setUnreadCounts, 
      totalUnread, 
      setTotalUnread,
      isConnected,
      markAsRead,
      socket: socketRef.current
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);