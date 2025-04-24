import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Sidebar from "../Sidebar/sidebar.jsx";
import './feed.css';
import { FiMoreVertical, FiHeart, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchPosts();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/auth/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedImage) return;

    const formData = new FormData();
    formData.append('content', newPostText);
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:5001/api/posts',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPosts([response.data.post, ...posts]);
      setNewPostText('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert(error.response?.data?.message || 'Error creating post');
    } finally {
      setLoading(false);
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
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/posts/${postId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            likes: response.data.likes,
            liked: response.data.liked,
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const deletePost = async (postId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="feed-container">
        <Sidebar />
      <div className="feed-header">
        <h2>Community Feed</h2>
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
                style={{ display: 'none' }}
              />
              {selectedImage && (
                <span className="image-preview-text">{selectedImage.name}</span>
              )}
            </div>
            <button type="submit" className="post-button" disabled={loading}>
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post._id} className="post">
              <div className="post-header">
                <img 
                  src={post.author.profileImage || 'https://i.pravatar.cc/150?img=3'} 
                  alt={post.author.username} 
                  className="post-avatar" 
                />
                <div className="post-author">
                  <span className="author-name">{post.author.username}</span>
                  <span className="post-time">{formatDate(post.createdAt)}</span>
                </div>
                {user && user._id === post.author._id && (
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
                          onClick={(e) => deletePost(post._id, e)}
                        >
                          Delete
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
                  onClick={() => handleLike(post._id)} 
                  className={`like-button ${post.liked ? 'liked' : ''}`}
                >
                  <FiHeart className={post.liked ? 'liked' : ''} />
                  {post.likes > 0 && <span>{post.likes}</span>}
                </button>
                <button className="comment-button">
                  <FiMessageSquare /> Comment
                </button>
                <button className="share-button">
                  <FiShare2 /> Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;