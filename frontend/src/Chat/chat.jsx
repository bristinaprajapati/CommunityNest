import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPaperPlane,
  faUser,
  faUsers,
  faPlus,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import "./chat.css";
import Sidebar from "../Sidebar/sidebar";
import { io } from "socket.io-client";
import { useChat } from "../contexts/ChatContext";

const Chat = () => {
  // State variables
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const navigate = useNavigate();

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversationPartners, setConversationPartners] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activeConversations, setActiveConversations] = useState([]);

  // Current user details
  const currentUserId = localStorage.getItem("userId");
  const currentUsername = localStorage.getItem("username");
  const currentUserProfileImage = localStorage.getItem("profileImage");
  const seenMessageIds = useRef(new Set());
  const socketRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  // --- useEffect Hooks ---
  const {
    unreadCounts,
    setUnreadCounts,
    setTotalUnread,
    activeConversation,
    setActiveConversation,
  } = useChat();

  useEffect(() => {
    // Clear seen messages when conversation changes
    seenMessageIds.current = new Set();
  }, [selectedUser?._id, selectedGroup?._id]);

  // Initial data loading
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUsers(),
          fetchGroups(),
          fetchConversationPartners(),
        ]);
        // Simulate some online users for UI demonstration
        setOnlineUsers([
          // Add some random user IDs here that would be in your users array
          // This is just for UI demonstration since we removed socket functionality
        ]);
      } catch (err) {
        console.error("Error during initial data loading:", err);
        setError("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  useEffect(() => {
    if (activeConversation) {
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[activeConversation.id];
        return newCounts;
      });
    }
  }, [activeConversation]);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setShowSearchResults(false);
      setSearchResults([]);
    } else {
      const filtered = users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(filtered.length > 0);
    }
  }, [searchTerm, users]);

  // // Scroll to bottom of messages
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  // Combined conversation list useEffect
  useEffect(() => {
    const combined = [
      ...conversationPartners.map((partner) => ({
        ...partner,
        type: "private",
        _id: partner._id,
        name: partner.username,
        avatar: partner.profileImage,
        isOnline: onlineUsers.includes(partner._id),
        lastMessage: partner.lastMessage,
        createdAt: partner.lastMessage?.timestamp || new Date(0),
      })),
      ...groups.map((group) => ({
        ...group,
        type: "group",
        _id: group._id,
        name: group.name,
        avatar: group.image,
        isOnline: false,
        lastMessage: group.lastMessage,
        createdAt:
          group.lastMessage?.timestamp || group.createdAt || new Date(0),
      })),
    ].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setActiveConversations(combined);
  }, [conversationPartners, groups, onlineUsers]);

  useEffect(() => {
    // Clear unread counts when conversation becomes active
    if (activeConversation) {
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[activeConversation.id];
        return newCounts;
      });

      // Mark messages as read immediately
      if (activeConversation.type === "private") {
        markMessagesAsRead(activeConversation.id, "private");
      } else {
        markMessagesAsRead(activeConversation.id, "group");
      }
    }
  }, [activeConversation]);

  useEffect(() => {
    const socket = (socketRef.current = io("http://localhost:5001"));

    const onConnect = () => {
      console.log("Connected to socket server");
      const token = localStorage.getItem("token");
      socket.emit("authenticate", token);
    };

    const onPrivateMessageSent = (data) => {
      const { messageData } = data;
      if (!messageData) return;
  
      // Only update the message in state (optimistic updates)
      setMessages((prev) =>
        prev.map((m) => (m.tempId === messageData.tempId ? messageData : m))
      );
    };
  
    const onPrivateMessage = (data) => {
      const { messageData } = data;
      if (!messageData) return;
    
      if (messageData.type === "private") {
        // Skip if the current user is the sender
        if (messageData.sender._id === currentUserId) return;
    
        // Only proceed if current user is the recipient
        if (messageData.recipient._id !== currentUserId) return;
    
        const isCurrentConversation =
          activeConversation?.type === "private" && 
          activeConversation?.id === messageData.sender._id;
    
        // Skip if we've already seen this message
        if (messageData._id && seenMessageIds.current.has(messageData._id)) return;
    
        // Mark this message as seen
        if (messageData._id) seenMessageIds.current.add(messageData._id);
    
        if (isCurrentConversation) {
          setMessages((prev) => {
            const isDuplicate = prev.some(
              m => (m._id && m._id === messageData._id) ||
                   (m.tempId && m.tempId === messageData.tempId) ||
                   (m.content === messageData.content && 
                    m.sender._id === messageData.sender._id &&
                    Math.abs(new Date(m.timestamp) - new Date(messageData.timestamp)) < 1000)
            );
            return isDuplicate ? prev : [...prev, messageData];
          });
        }
    
        // Update conversation partners (without touching unread counts)
        setConversationPartners(prev =>
          prev.map(p => 
            p._id === messageData.sender._id 
              ? { ...p, lastMessage: messageData } 
              : p
          )
        );
      }
    };
    
    const onGroupMessage = (data) => {
      const { message, groupId } = data;
    
      // Don't process messages from current user
      if (message.sender?._id === currentUserId) {
        return;
      }
    
      const isCurrentConversation =
        activeConversation?.type === "group" &&
        activeConversation?.id === groupId;
    
      // Find the group in state
      const group = groups.find((g) => g._id === groupId);
      if (!group) return;
    
      // Check if current user is a member of this group
      const isMember = group.members?.some((member) =>
        typeof member === "object"
          ? member._id === currentUserId
          : member === currentUserId
      );
    
      if (!isMember) return;
    
      // Skip if we've already seen this message
      if (message._id && seenMessageIds.current.has(message._id)) {
        return;
      }
    
      // Mark message as seen if we're viewing this group
      if (isCurrentConversation) {
        if (message._id) seenMessageIds.current.add(message._id);
    
        // Update messages if viewing this group
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
      } else {
        // Only increment unread count if it's not the active conversation
        // setUnreadCounts((prev) => ({
        //   ...prev,
        //   [groupId]: (prev[groupId] || 0) + 1,
        // }));
      }
    
      // Update groups list with new message
      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId ? { ...g, lastMessage: message } : g
        )
      );
    };


    // Set up event listeners
    socket.on("connect", onConnect);
    socket.on("group-message", onGroupMessage);
    // socket.on("unread-count-update", onUnreadCountUpdate);
    socket.on("private-message-sent", onPrivateMessageSent);
    socket.on("private-message", onPrivateMessage);

    return () => {
      // Clean up listeners
      socket.off("connect", onConnect);
      socket.off("group-message", onGroupMessage);
      // socket.off("unread-count-update", onUnreadCountUpdate);
      socket.off("private-message-sent", onPrivateMessageSent);
      socket.off("private-message", onPrivateMessage);

      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    currentUserId,
    selectedUser,
    activeConversation,
    selectedGroup,
    setTotalUnread,
  ]);

  // Fetch groups for the current user
  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5001/api/group", {
        headers: { Authorization: `Bearer ${token}` },
        params: { populate: "creator members admins lastMessage.sender" },
      });
      setGroups(response.data);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setError("Could not load groups");
    }
  };

  // Fetch conversation partners with unread counts
  const fetchConversationPartners = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5001/api/chat/conversation-partners",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        const sortedPartners = response.data.sort((a, b) => {
          const aTime = a.lastMessage?.timestamp || 0;
          const bTime = b.lastMessage?.timestamp || 0;
          return new Date(bTime) - new Date(aTime);
        });

        // Initialize unread counts only for unread messages
        const initialUnreadCounts = {};
        sortedPartners.forEach((partner) => {
          if (partner.unreadCount > 0) {
            initialUnreadCounts[partner._id] = partner.unreadCount;
          }
        });

        setUnreadCounts((prev) => ({ ...prev, ...initialUnreadCounts }));
        setConversationPartners(sortedPartners);
      }
    } catch (err) {
      console.error("Error fetching conversation partners:", err);
      setError("Failed to load conversation history");
      if (err.response?.status === 401) navigate("/login");
    }
  };

  // Fetch all users (except current user)
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5001/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.filter((user) => user._id !== currentUserId));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

 const markMessagesAsRead = async (conversationId, type) => {
  try {
    const token = localStorage.getItem("token");
    let endpoint = "";
    let body = {};

    if (type === "private") {
      endpoint = `http://localhost:5001/api/chat/mark-as-read`;
      body = { conversationId, type };
    } else {
      endpoint = `http://localhost:5001/api/group/${conversationId}/mark-read`;
    }

    // Update local state immediately for better UX
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[conversationId];
      return newCounts;
    });

    await axios.post(endpoint, body, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Emit socket event to update counts
    if (socketRef.current) {
      socketRef.current.emit("messages-read", {
        userId: currentUserId,
        conversationId,
        type,
      });
    }
  } catch (err) {
    console.error("Error marking messages as read:", err);

    // Revert the unread count change if the API call fails
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: prev[conversationId] || 0,
    }));
  }
};

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      tempId,
      sender: {
        _id: currentUserId,
        username: currentUsername,
        profileImage: currentUserProfileImage,
      },
      recipient: selectedUser,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "private",
      isOptimistic: true,
    };

    // Add optimistic message
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5001/api/chat/messages",
        {
          recipient: selectedUser._id,
          content: newMessage,
          type: "private",
          tempId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // The API response will now include the final message
      // Socket events are handled by the backend

      // Replace optimistic message with server response
      setMessages((prev) => [
        ...prev.filter((m) => m.tempId !== tempId),
        response.data,
      ]);

      // Update conversation partners
      setConversationPartners((prev) =>
        prev
          .map((partner) =>
            partner._id === selectedUser._id
              ? { ...partner, lastMessage: response.data }
              : partner
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessage?.timestamp || 0) -
              new Date(a.lastMessage?.timestamp || 0)
          )
      );
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove failed message
      setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
      alert("Failed to send message");
    }
  };

  // Replace your handleSendGroupMessage function with this:
  const handleSendGroupMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;

    const groupId = selectedGroup._id;
    const tempId = Date.now().toString();

    // Optimistic UI update
    const optimisticMessage = {
      _id: tempId,
      sender: {
        _id: currentUserId,
        username: currentUsername,
        profileImage: currentUserProfileImage,
      },
      content: newMessage,
      timestamp: new Date().toISOString(),
      group: {
        _id: groupId,
        name: selectedGroup.name,
      },
      type: "group",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const token = localStorage.getItem("token");

      // Option 1: Use Socket.IO only and skip the API call
      socketRef.current.emit("group-message", {
        groupId,
        content: newMessage,
        senderId: currentUserId,
        token,
        tempId, // Include tempId for tracking
      });

      // Update groups list with optimistic message
      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId
            ? {
                ...g,
                lastMessage: {
                  content: newMessage,
                  timestamp: new Date().toISOString(),
                  sender: {
                    _id: currentUserId,
                    username: currentUsername,
                  },
                },
              }
            : g
        )
      );

      // No need for API call since socket handles it
    } catch (err) {
      console.error("Error sending group message:", err);
      // Remove failed message
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setError(err.response?.data?.message || "Failed to send message");
    }
  };
  // --- User and Group Selection Functions ---

  const handleSelectUser = async (user) => {
    if (!user) return;

    try {
      // Set active conversation first
      const newActiveConversation = {
        type: "private",
        id: user._id,
      };
      setActiveConversation(newActiveConversation);

      // Then reset other state
      setMessages([]);
      seenMessageIds.current = new Set();
      setSelectedGroup(null);
      setSelectedUser(user);
      setError("");

      // Clear unread count for this user
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[user._id];
        return newCounts;
      });

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      // Mark messages as read
      await markMessagesAsRead(user._id, "private");

      // Fetch messages
      const response = await axios.get(
        `http://localhost:5001/api/chat/messages/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Mark fetched messages as seen
      response.data.forEach((msg) => {
        if (msg._id) seenMessageIds.current.add(msg._id);
      });

      setMessages(response.data);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    } catch (err) {
      console.error("Error selecting user:", err);
      setError("Failed to open chat");
    }
  };

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      handleLeaveChat();
    };
  }, []);


  const handleLeaveChat = () => {
    // Clear active conversation first
    setActiveConversation(null);

    // Then clear selected chat
    setSelectedUser(null);
    setSelectedGroup(null);

    // Reset messages
    setMessages([]);
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const handleSelectGroup = async (group) => {
    try {
      // Set active conversation first
      const newActiveConversation = {
        type: "group",
        id: group._id,
      };
      setActiveConversation(newActiveConversation);

      // Then reset other state
      setSelectedUser(null);
      setSelectedGroup(group);
      setMessages([]);
      setError("");

      // Clear unread count for this group
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[group._id];
        return newCounts;
      });

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      // Mark messages as read
      await markMessagesAsRead(group._id, "group");

      // Fetch messages
      const response = await axios.get(
        `http://localhost:5001/api/group/${group._id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Mark fetched messages as seen
      response.data.forEach((msg) => {
        if (msg._id) seenMessageIds.current.add(msg._id);
      });

      setMessages(response.data);
    } catch (err) {
      console.error("Error selecting group:", err);
      setError("Failed to open group chat");
    }
  };

  // --- Group Management Functions ---

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsersForGroup.length === 0) {
      alert("Group name and at least one member are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5001/api/group",
        {
          name: groupName,
          members: selectedUsersForGroup.map((user) => user._id),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGroups((prev) => [response.data, ...prev]);
      setShowGroupModal(false);
      setGroupName("");
      setSelectedUsersForGroup([]);
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Failed to create group");
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsersForGroup((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleViewGroupMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5001/api/group/${selectedGroup._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedGroup(response.data);
      setShowGroupMembers(true);
    } catch (err) {
      console.error("Error fetching group details:", err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    const groupId = selectedGroup?._id;
    if (!groupId) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5001/api/group/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { members: [memberId] },
      });

      setSelectedGroup((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m._id !== memberId),
      }));
    } catch (err) {
      console.error("Error removing member:", err);
      setError(err.response?.data?.message || "Failed to remove member");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();

    if (now.toDateString() === date.toDateString()) {
      return formatTime(timestamp);
    } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const handleDeleteConversation = async (conversation) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this ${conversation.type} conversation?`
      )
    ) {
      return;
    }
    // If deleting the currently viewed conversation, leave it first
    if (
      (conversation.type === "private" &&
        selectedUser?._id === conversation._id) ||
      (conversation.type === "group" && selectedGroup?._id === conversation._id)
    ) {
      handleLeaveChat();
    }

    try {
      const token = localStorage.getItem("token");
      let endpoint = "";

      if (conversation.type === "private") {
        endpoint = `http://localhost:5001/api/chat/conversation/${conversation._id}`;
      } else {
        endpoint = `http://localhost:5001/api/chat/group-conversation/${conversation._id}`;
      }

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update state based on conversation type
      if (conversation.type === "private") {
        setConversationPartners((prev) =>
          prev.filter((p) => p._id !== conversation._id)
        );
        if (selectedUser?._id === conversation._id) {
          setSelectedUser(null);
          setMessages([]);
        }
      } else {
        setGroups((prev) => prev.filter((g) => g._id !== conversation._id));
        if (selectedGroup?._id === conversation._id) {
          setSelectedGroup(null);
          setMessages([]);
        }
      }

      // Remove from unread counts
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[conversation._id];
        return newCounts;
      });
    } catch (err) {
      console.error("Error deleting conversation:", err);
      alert("Failed to delete conversation");
    }
  };

  // --- Render Function ---

  if (loading) return <div className="chat-loading">Loading chat...</div>;
  if (error) return <div className="chat-error">{error}</div>;

  return (
    <div className="chat-container">
      <Sidebar />
      <div className="chat-sidebar">
        <div className="chat-search">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() =>
              searchTerm.trim() !== "" && setShowSearchResults(true)
            }
          />
          {showSearchResults && (
            <div className="search-results-dropdown">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="search-result-item"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="user-avatar">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage || "/placeholder.svg"}
                        alt={user.username}
                      />
                    ) : (
                      <FontAwesomeIcon icon={faUser} />
                    )}
                  </div>
                  <div className="user-info">
                    <h4>{user.username}</h4>
                    <p>{user.email}</p>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && (
                <div className="no-search-results">No users found</div>
              )}
            </div>
          )}
        </div>

        <button
          className="create-group-btn"
          onClick={() => setShowGroupModal(true)}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span>Create Group</span>
          <FontAwesomeIcon icon={faPlus} className="plus-icon" />
        </button>

        <div className="conversation-list">
          {activeConversations.map((conversation) => (
            <div
              key={`${conversation.type}-${conversation._id}`}
              className={`conversation-item ${
                activeConversation?.id === conversation._id &&
                activeConversation?.type === conversation.type
                  ? "active"
                  : ""
              }`}
            >
              <div
                className="conversation-content"
                onClick={() => {
                  if (conversation.type === "private") {
                    handleSelectUser(conversation);
                  } else {
                    handleSelectGroup(conversation);
                  }
                }}
              >
                <div className="conversation-avatar">
                  {conversation.type === "private" ? (
                    conversation.profileImage ? (
                      <img
                        src={conversation.profileImage || "/placeholder.svg"}
                        alt={conversation.username}
                      />
                    ) : (
                      <FontAwesomeIcon icon={faUser} />
                    )
                  ) : (
                    <FontAwesomeIcon icon={faUsers} />
                  )}
                  {conversation.type === "private" &&
                    onlineUsers.includes(conversation._id) && (
                      <span className="online-indicator"></span>
                    )}
                </div>
                <div className="conversation-details">
                  <div className="conversation-header">
                    <h4>{conversation.name}</h4>
                    {conversation.lastMessage && (
                      <span className="message-time">
                        {formatLastMessageTime(
                          conversation.lastMessage.timestamp
                        )}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <div className="message-preview-container">
                      <p className="message-preview">
                        {conversation.lastMessage.sender?._id === currentUserId
                          ? `You: ${conversation.lastMessage.content.substring(
                              0,
                              25
                            )}`
                          : conversation.type === "private"
                          ? conversation.lastMessage.content.substring(0, 25)
                          : `${
                              conversation.lastMessage.sender?.username
                            }: ${conversation.lastMessage.content.substring(
                              0,
                              25
                            )}`}
                        {conversation.lastMessage.content.length > 25
                          ? "..."
                          : ""}
                      </p>
                      {unreadCounts[conversation._id] > 0 && (
                        <span className="unread-count">
                          {unreadCounts[conversation._id]}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                className="delete-conversation-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(conversation);
                }}
                title={`Delete ${conversation.type} conversation`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-partner">
                <div className="partner-avatar">
                  {selectedUser.profileImage ? (
                    <img
                      src={selectedUser.profileImage || "/placeholder.svg"}
                      alt={selectedUser.username}
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUser} />
                  )}
                </div>
                <span>{selectedUser.username}</span>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((message) => {
                // Only show messages that belong to this conversation
                const isCurrentConversation =
                  message.type === "private" &&
                  ((message.sender._id === selectedUser._id &&
                    message.recipient._id === currentUserId) ||
                    (message.sender._id === currentUserId &&
                      message.recipient._id === selectedUser._id));

                if (!isCurrentConversation) return null;

                const isOwnMessage = message.sender._id === currentUserId;

                return (
                  <div
                    key={message._id || message.tempId}
                    className={`message ${isOwnMessage ? "sent" : "received"}`}
                  >
                    <div className="message-content">
                      <span>{message.content}</span>
                      <span className="message-time">
                        {formatTime(message.timestamp)}
                        {message.isOptimistic && " (Sending...)"}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim()}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
          </>
        ) : selectedGroup ? (
          <>
            <div className="chat-header">
              <div className="chat-partner">
                <div className="partner-avatar group-avatar">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <div className="partner-info">
                  <h3>{selectedGroup.name}</h3>
                  <p>{selectedGroup.members?.length || 0} members</p>
                </div>
                <button
                  onClick={handleViewGroupMembers}
                  className="view-members-btn"
                >
                  View Members
                </button>
              </div>
            </div>

            {showGroupMembers && (
              <div className="group-members-modal1">
                <div className="modal-content1">
                  <div className="modal-header">
                    <h3>Group Members</h3>
                    <button onClick={() => setShowGroupMembers(false)}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>

                  <div className="members-list">
                    {selectedGroup.members?.map((member) => (
                      <div key={member._id} className="member-item">
                        <div className="member-avatar">
                          {member.profileImage ? (
                            <img
                              src={member.profileImage || "/placeholder.svg"}
                              alt={member.username}
                            />
                          ) : (
                            <FontAwesomeIcon icon={faUser} />
                          )}
                        </div>
                        <div className="member-info">
                          <h4>{member.username}</h4>
                          {selectedGroup.creator?._id === member._id && (
                            <span className="creator-badge">Creator</span>
                          )}
                        </div>
                        {selectedGroup.creator?._id === currentUserId &&
                          member._id !== currentUserId && (
                            <button
                              onClick={() => handleRemoveMember(member._id)}
                              className="remove-member-btn"
                            >
                              Remove
                            </button>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="chat-messages">
              {messages.map((message) => {
                const isSent = message.sender._id === currentUserId;
                return (
                  <div
                    key={message._id}
                    className={`message ${isSent ? "sent" : "received"}`}
                  >
                    {!isSent && (
                      <div className="message-sender">
                        {message.sender.profileImage ? (
                          <img
                            src={
                              message.sender.profileImage || "/placeholder.svg"
                            }
                            alt={message.sender.username}
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUser} />
                        )}
                      </div>
                    )}
                    <div className="message-sender-info">
                      <span className="sender-username">
                        {message.sender.username}
                      </span>
                      <div className="message-content">
                        <p>{message.content}</p>
                        <span className="message-time">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSendGroupMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim()}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-content">
              <FontAwesomeIcon icon={faUser} size="3x" />
              <h3>Select a user or group to start chatting</h3>
              <p>Choose from your conversations or create a new group</p>
            </div>
          </div>
        )}
      </div>

      {showGroupModal && (
        <div className="modal-overlay1">
          <div className="group-creation-modal">
            <div className="modal-header">
              <h3>Create New Group</h3>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupName("");
                  setSelectedUsersForGroup([]);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>

              <div className="form-group">
                <label>Select Members</label>
                <div className="member-selection">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className={`member-item ${
                        selectedUsersForGroup.some((u) => u._id === user._id)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => toggleUserSelection(user)}
                    >
                      <div className="user-avatar">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage || "/placeholder.svg"}
                            alt={user.username}
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUser} />
                        )}
                      </div>
                      <div className="user-info">
                        <h4>{user.username}</h4>
                        <p>{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="selected-members-preview">
                <h4>Selected Members ({selectedUsersForGroup.length})</h4>
                <div className="selected-members-list">
                  {selectedUsersForGroup.map((user) => (
                    <div key={user._id} className="selected-member">
                      <div className="user-avatar">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage || "/placeholder.svg"}
                            alt={user.username}
                          />
                        ) : (
                          <FontAwesomeIcon icon={faUser} />
                        )}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName("");
                    setSelectedUsersForGroup([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="create-btn"
                  onClick={handleCreateGroup}
                  disabled={
                    !groupName.trim() || selectedUsersForGroup.length === 0
                  }
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
