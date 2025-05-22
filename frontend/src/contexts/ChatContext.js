import { createContext, useState, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const processedMessages = useRef(new Set()); // Track processed message IDs

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

    const onPrivateMessage = (data) => {
      if (!data.messageData) return;
      
      const currentUserId = localStorage.getItem("userId");
      const { sender, recipient, _id } = data.messageData;

      // Skip if not for current user or sent by current user
      if (recipient._id !== currentUserId || sender._id === currentUserId) return;

      // Skip if viewing this conversation
      if (activeConversation?.type === "private" && 
          activeConversation?.id === sender._id) {
        return;
      }

      // Skip if already processed this message
      if (_id && processedMessages.current.has(_id)) return;

      setUnreadCounts(prev => ({
        ...prev,
        [sender._id]: (prev[sender._id] || 0) + 1
      }));

      if (_id) processedMessages.current.add(_id);
    };

    const onGroupMessage = (data) => {
      if (!data.message || !data.groupId) return;
    
      const currentUserId = localStorage.getItem("userId");
      const { _id, sender } = data.message;
    
      // Skip if already processed this message
      if (_id && processedMessages.current.has(_id)) return;
    
      // Always process the message to update lastMessage, even if from current user
      if (_id) processedMessages.current.add(_id);
    
      // Only update unread counts if not from current user AND not viewing this group
      if (sender._id !== currentUserId && 
          !(activeConversation?.type === "group" && 
            activeConversation?.id === data.groupId)) {
        // Always set at least 1 for the first message
        setUnreadCounts(prev => ({
          ...prev,
          [data.groupId]: (prev[data.groupId] || 0) + 1
        }));
      }
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
    const newTotal = Object.values(unreadCounts).reduce(
      (sum, count) => sum + (typeof count === 'number' ? count : 0), 
      0
    );
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