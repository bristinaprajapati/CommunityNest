import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar/sidebar.jsx";
import "./feed.css";
import {
  FiHeart,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'my'
  const [loading, setLoading] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  // Get userId from localStorage first
  const [userId, setUserId] = useState(() => {
    return localStorage.getItem("userId") || null;
  });

  useEffect(() => {
    // If userId exists in localStorage but not in state, set it
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId && !userId) {
      console.log("Setting userId from localStorage on mount:", storedUserId);
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchCurrentUser();
        await fetchPosts();
      } catch (error) {
        console.error("Error initializing feed:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user?._id) {
      // Only fetch myPosts if user._id exists
      fetchMyPosts();
      console.log("User ID:", user._id);
    }
  }, [user]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchCurrentUser();
        await fetchPosts();
        // Now that we have the user, fetch my posts
        if (userId) {
          await fetchMyPosts();
        }
      } catch (error) {
        console.error("Error initializing feed:", error);
      }
    };

    initializeData();
  }, []); // Empty dependency array to run only once on mount

  // Add this effect to fetch myPosts whenever userId changes
  useEffect(() => {
    if (userId) {
      fetchMyPosts();
    }
  }, [userId]);

  // Add this function to your Feed component
  const updatePost = async (postId, updatedContent) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }
  
      const response = await axios.put(
        `http://localhost:5001/api/posts/${postId}`,
        { content: updatedContent },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );
  
      if (response.data.success) {
        // Update both posts and myPosts states
        setPosts(posts.map(post => 
          post._id === postId ? { ...post, content: updatedContent } : post
        ));
        setMyPosts(myPosts.map(post => 
          post._id === postId ? { ...post, content: updatedContent } : post
        ));
        
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to update post");
      }
    } catch (error) {
      console.error("Detailed update error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show more detailed error to user
      const errorMsg = error.response?.data?.message || 
                      error.message || 
                      "Failed to update post";
      alert(`Update failed: ${errorMsg}`);
      
      throw error;
    }
  };

  // In your fetchCurrentUser function
const fetchCurrentUser = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return null;
    }

    const response = await axios.get("http://localhost:5001/api/auth/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Make sure to get the correct user ID field
    const userData = response.data.user || response.data;
    const userId = userData._id || userData.id;

    if (!userId) {
      throw new Error("User ID not found in response");
    }

    // Update state and localStorage
    setUser(userData);
    setUserId(userId.toString());
    localStorage.setItem("userId", userId.toString());

    return userId.toString();
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5001/api/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchMyPosts = async () => {
    const currentUserId = userId || localStorage.getItem("userId");

    if (!currentUserId) {
      console.log("No user ID available to fetch my posts");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5001/api/posts/user/${currentUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.posts) {
        setMyPosts(response.data.posts);
      } else {
        console.log("No posts data received");
        setMyPosts([]);
      }
    } catch (error) {
      console.error("Detailed error fetching my posts:", {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        userId: currentUserId,
      });
      setMyPosts([]);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedImage) return;

    const formData = new FormData();
    formData.append("content", newPostText);
    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5001/api/posts",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update both posts and myPosts states
      setPosts([response.data.post, ...posts]);
      setMyPosts([response.data.post, ...myPosts]);

      // Reset form
      setNewPostText("");
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Switch to "My Posts" tab
      setActiveTab("my");
    } catch (error) {
      console.error("Error creating post:", error);
      alert(error.response?.data?.message || "Error creating post");
    } finally {
      setLoading(false);
    }
  };

  // Update your frontend deletePost function:
  const deletePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You need to be logged in to delete posts");
      }

      await axios.delete(`http://localhost:5001/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Remove the post from both posts and myPosts states
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      setMyPosts((prevPosts) =>
        prevPosts.filter((post) => post._id !== postId)
      );

      return { success: true };
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5001/api/posts/${postId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPosts(
        posts.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              likes: response.data.likes,
              liked: response.data.liked,
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="feed-container">
      <Sidebar />
      <div className="feed-header">
        <h2>Community Feed</h2>
        <div className="feed-tabs">
          <button
            className={`tab-button ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Posts
          </button>
          <button
            className={`tab-button ${activeTab === "my" ? "active" : ""}`}
            onClick={() => setActiveTab("my")}
          >
            My Posts
          </button>
        </div>
      </div>

      <div className="post-form-container">
        <form onSubmit={handlePostSubmit} className="post-form">
          <div className="form-group">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="What's on your mind?"
              rows="3"
            />
          </div>
          <div className="form-actions">
            <div className="image-upload">
              <label htmlFor="image-upload" className="upload-button">
                <i className="fas fa-image"></i> Add Image
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: "none" }}
              />
              {selectedImage && (
                <span className="image-preview-text">{selectedImage.name}</span>
              )}
            </div>
            <button type="submit" className="post-button" disabled={loading}>
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>

      <div className="posts-container">
        {activeTab === "all" ? (
          posts.length === 0 ? (
            <div className="no-posts">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostItem
                key={post._id}
                post={post}
                showMenu={post.author._id === (user?._id || userId)}
                currentUserId={
                  user?._id || userId || localStorage.getItem("userId")
                }
                activeTab={activeTab}
                onLike={handleLike}
                onDelete={deletePost}
                dropdownOpenId={dropdownOpenId}
                setDropdownOpenId={setDropdownOpenId}
              />
            ))
          )
        ) : myPosts.length === 0 ? (
          <div className="no-posts">
            <p>You haven't posted anything yet.</p>
          </div>
        ) : (
          myPosts.map((post) => (
            <PostItem
              key={post._id}
              post={post}
              onUpdate={updatePost} 
              showMenu={true}
              currentUserId={
                user?._id || userId || localStorage.getItem("userId")
              }
              activeTab={activeTab}
              onLike={handleLike}
              onDelete={deletePost}
              dropdownOpenId={dropdownOpenId}
              setDropdownOpenId={setDropdownOpenId}
            />
          ))
        )}
      </div>
    </div>
  );
};

const PostItem = ({ post, currentUserId, onLike, onDelete, activeTab, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = async (e) => {
    e.stopPropagation();

    try {
      if (!window.confirm("Are you sure you want to delete this post?")) {
        return;
      }

      setIsDeleting(true);
      await onDelete(post._id);
      // The parent component will handle updating the state
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await onUpdate(post._id, editedContent);
      if (result && result.success) {
        setIsEditing(false);
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error('Update error:', {
        error: error,
        response: error.response?.data,
        postId: post._id,
        userId: currentUserId
      });
      alert(error.response?.data?.message || "Failed to update post");
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const authorId = post.author?._id || post.author;

  return (
    <div className="feed-post">
      {/* Header section */}
      <div className="feed-post__header">
        {post.author?.profileImage ? (
          <img
            src={post.author.profileImage}
            alt={post.author.username || "User"}
            className="feed-post__avatar"
          />
        ) : (
          <FaUserCircle
            className="feed-post__avatar feed-post__avatar--default"
            size={40}
          />
        )}
        <div className="feed-post__author-info">
          <span className="feed-post__author-name">
            {post.author?.username || "Unknown User"}
          </span>
          <span className="feed-post__time">{formatDate(post.createdAt)}</span>
        </div>

        {activeTab === "my" && (
          <div className="feed-post__actions-icons">
            <button
              onClick={handleEditClick}
              className="feed-post__edit-button"
            >
              <FiEdit2 />
            </button>
            <button
              onClick={handleDeleteClick}
              className="feed-post__delete-button"
              disabled={isDeleting}
            >
              {isDeleting ? "..." : <FiTrash2 />}
            </button>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="feed-post__content">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="edit-post-form">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="edit-post-textarea"
              required
            />
            <div className="edit-post-actions">
              <button
                type="button"
                className="edit-post-cancel"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="edit-post-submit">
                Save
              </button>
            </div>
          </form>
        ) : (
          <>
            {post.content && <p className="feed-post__text">{post.content}</p>}
            {post.image && (
              <div className="feed-post__image-wrapper">
                <img src={post.image} alt="Post" className="feed-post__image" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions section */}
      {!isEditing && (
        <div className="feed-post__actions">
          <button
            onClick={() => onLike(post._id)}
            className={`feed-post__action-button feed-post__action-button--like ${
              post.likedBy.includes(currentUserId)
                ? "feed-post__action-button--liked"
                : ""
            }`}
          >
            <FiHeart
              className={
                post.likedBy.includes(currentUserId)
                  ? "feed-post__action-icon--liked"
                  : ""
              }
            />
            {post.likes > 0 && (
              <span className="feed-post__like-count">{post.likes}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to format date
const formatDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default Feed;
