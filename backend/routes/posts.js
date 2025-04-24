const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Post = require("../models/Post");
const authenticate = require("./authenticate");
const router = express.Router();

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new post
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.userId;

    if (!content && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Post content or image is required",
      });
    }

    let imageUrl = null;
    if (req.file) {
      // Upload image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "posts" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const newPost = new Post({
      content,
      image: imageUrl,
      author: userId,
      likes: 0,
      likedBy: [],
    });

    await newPost.save();

    // Populate author details before sending response
    const populatedPost = await Post.findById(newPost._id).populate(
      "author",
      "username profileImage"
    );

    res.status(201).json({
      success: true,
      post: populatedPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// Get all posts
router.get("/", authenticate, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profileImage");

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// Like/unlike a post
router.post("/:id/like", authenticate, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const likedIndex = post.likedBy.indexOf(userId);
    let liked = false;

    if (likedIndex === -1) {
      // Like the post
      post.likedBy.push(userId);
      liked = true;
    } else {
      // Unlike the post
      post.likedBy.splice(likedIndex, 1);
    }

    post.likes = post.likedBy.length;
    await post.save();

    res.json({
      success: true,
      likes: post.likes,
      liked,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// Delete a post
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if the user is the author of the post
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this post",
      });
    }

    // Delete image from Cloudinary if exists
    if (post.image) {
      const publicId = post.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`posts/${publicId}`);
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// Get comments for a post
router.get('/:id/comments', authenticate, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id)
        .populate('comments.author', 'username profileImage');
      
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
  
      res.json({ success: true, comments: post.comments });
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  
  // Add comment to a post
  router.post('/:id/comments', authenticate, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ success: false, message: "Comment content is required" });
      }
  
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            comments: {
              content,
              author: req.userId,
              createdAt: new Date()
            }
          }
        },
        { new: true }
      ).populate('comments.author', 'username profileImage');
  
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
  
      // Emit real-time update
      req.app.get('io').emit(`post-${req.params.id}-comment`, post.comments[post.comments.length - 1]);
  
      res.json({ success: true, comment: post.comments[post.comments.length - 1] });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  
module.exports = router;