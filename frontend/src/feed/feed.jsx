import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar/sidebar.jsx";
import "./feed.css";
import {
  FiMoreVertical,
  FiHeart,
  FiMessageSquare,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, } from "react-icons/fa";

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
  return localStorage.getItem('userId') || null;
});


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
    if (user?._id) { // Only fetch myPosts if user._id exists
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

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found");
        return;
      }
  
      const response = await axios.get("http://localhost:5001/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data) {
        setUser(response.data);
        // Ensure we store the user ID in state and localStorage
        const userId = response.data._id || response.data.userId;
        if (userId) {
          setUserId(userId);
          localStorage.setItem('userId', userId);
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
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
    const currentUserId = userId || localStorage.getItem('userId');
    
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
        userId: currentUserId
      });
      setMyPosts([]);
    }
  };

  // useEffect(() => {
  //   console.log("Current User ID:", userId);
  // }, [userId]);
  
  // useEffect(() => {
  //   console.log("My Posts State:", myPosts);
  // }, [myPosts]);

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


  const deletePost = async (postId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5001/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Remove from both posts and myPosts
      setPosts(posts.filter((post) => post._id !== postId));
      setMyPosts(myPosts.filter((post) => post._id !== postId));
      
      setDropdownOpenId(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
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
                currentUserId={user?._id}
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
              currentUserId={user?._id}
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

// Separate PostItem component for better readability
const PostItem = ({
  post,
  currentUserId,
  onLike,
  onDelete,
  dropdownOpenId,
  setDropdownOpenId,
}) => {
  const isAuthor = post.author._id === currentUserId;
  const isLiked = post.likedBy.includes(currentUserId);

  return (
    <div className="post">
      <div className="post-header">
        {post.author.profileImage ? (
          <img
            src={post.author.profileImage}
            alt={post.author.username}
            className="post-avatar"
          />
        ) : (
          <FaUserCircle className="post-avatar default-avatar" size={40} />
        )}
        <div className="post-author">
          <span className="author-name">{post.author.username}</span>
          <span className="post-time">{formatDate(post.createdAt)}</span>
        </div>
        {isAuthor && (
          <div className="post-options">
            <button
              className="options-button"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpenId(dropdownOpenId === post._id ? null : post._id);
              }}
            >
              <FiMoreVertical />
            </button>
            {dropdownOpenId === post._id && (
              <div className="post-dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={(e) => onDelete(post._id, e)}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="post-content">
        {post.content && <p className="post-text">{post.content}</p>}
        {post.image && (
          <div className="post-image-container">
            <img src={post.image} alt="Post" className="post-image" />
          </div>
        )}
      </div>
      <div className="post-actions">
        <button
          onClick={() => onLike(post._id)}
          className={`like-button ${isLiked ? "liked" : ""}`}
        >
          <FiHeart className={isLiked ? "liked" : ""} />
          {post.likes > 0 && <span>{post.likes}</span>}
        </button>
        <button className="comment-button">
          {/* <FiMessageSquare /> Comment */}
        </button>
      </div>
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