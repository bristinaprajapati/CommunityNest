const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  content: { 
    type: String, 
    trim: true,
    required: function() {
      return !this.image; // Content is required if no image
    }
  },
  image: { 
    type: String,
    required: function() {
      return !this.content; // Image is required if no content
    }
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  comments: [{
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });


// Add text index for search functionality
postSchema.index({ content: "text" });

// Virtual for whether the current user has liked the post
postSchema.virtual("liked").get(function() {
  // This will be populated in the controller
  return false;
});

// Populate author when finding posts
postSchema.pre(/^find/, function(next) {
  this.populate("author", "username profileImage");
  next();
});

module.exports = mongoose.model("Post", postSchema);