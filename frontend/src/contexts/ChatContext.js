import { createContext, useState, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);

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
      const token = localStorage.getItem("token");
      if (token) {
        socket.emit("authenticate", token);
        socket.emit("get-unread-counts");
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onTotalUnreadUpdate = (data) => {
      if (data.total !== undefined) {
        setTotalUnread(data.total);
      }
    };
// ChatContext.js
const onPrivateMessage = (data) => {
  if (!data.messageData) return;
  
  const currentUserId = localStorage.getItem("userId");
  const { sender, recipient } = data.messageData;

  // Skip if not for current user or sent by current user
  if (recipient._id !== currentUserId || sender._id === currentUserId) return;

  // Skip if viewing this conversation
  if (activeConversation?.type === "private" && 
      activeConversation?.id === sender._id) {
    return;
  }

  // Update count only if not already incremented
  setUnreadCounts(prev => {
    // Check if we've already processed this message (by ID or timestamp)
    const isDuplicate = data.messageData._id && 
      prev[`processed_${data.messageData._id}`] === true;
    
    if (isDuplicate) return prev;

    return {
      ...prev,
      [sender._id]: (prev[sender._id] || 0) + 1,
      [`processed_${data.messageData._id}`]: true // Mark as processed
    };
  });
};

const onGroupMessage = (data) => {
  if (!data.message || !data.groupId) return;

  const currentUserId = localStorage.getItem("userId");

  // Skip if sent by current user
  if (data.message.sender._id === currentUserId) return;

  // Skip if viewing this group
  if (activeConversation?.type === "group" && 
      activeConversation?.id === data.groupId) {
    return;
  }

  // Update count only if not already incremented
  setUnreadCounts(prev => {
    // Check if we've already processed this message
    const isDuplicate = data.message._id && 
      prev[`processed_${data.message._id}`] === true;
    
    if (isDuplicate) return prev;

    return {
      ...prev,
      [data.groupId]: (prev[data.groupId] || 0) + 1,
      [`processed_${data.message._id}`]: true // Mark as processed
    };
  });
};

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("total-unread-update", onTotalUnreadUpdate);
    socket.on("private-message", onPrivateMessage);
    socket.on("group-message", onGroupMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("total-unread-update", onTotalUnreadUpdate);
      socket.off("private-message", onPrivateMessage);
      socket.off("group-message", onGroupMessage);
      socket.disconnect();
    };
  }, [activeConversation]);

  // Calculate total unread whenever counts change
  useEffect(() => {
    const newTotal = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    setTotalUnread(newTotal);
  }, [unreadCounts]);

  const markAsRead = (conversationId) => {
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[conversationId];
      return newCounts;
    });

    if (socketRef.current) {
      socketRef.current.emit("mark-as-read", {
        conversationId,
        userId: localStorage.getItem("userId"),
      });
    }
  };

  // Clear unread counts when conversation becomes active
  useEffect(() => {
    if (activeConversation) {
      markAsRead(activeConversation.id);
    }
  }, [activeConversation]);

  return (
    <ChatContext.Provider
      value={{
        unreadCounts,
        setUnreadCounts,
        totalUnread,
        setTotalUnread,
        isConnected,
        markAsRead,
        socket: socketRef.current,
        activeConversation,
        setActiveConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);