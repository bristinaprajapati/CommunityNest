import React, { createContext, useState, useContext, useEffect } from 'react';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  // Update total whenever unreadCounts changes
  useEffect(() => {
    const newTotal = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    setTotalUnread(newTotal);
  }, [unreadCounts]);

  return (
    <ChatContext.Provider value={{ 
      unreadCounts, 
      setUnreadCounts, 
      totalUnread, 
      setTotalUnread 
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);