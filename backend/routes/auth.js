const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto"); // To generate reset tokens
const nodemailer = require("nodemailer"); // To send emails
const router = express.Router();
const Community = require("../models/Community");
const authenticate = require("./authenticate"); 
const jwt = require('jsonwebtoken'); 




// User model
const User = require("../models/User");

// Email configuration for sending reset links (You should replace these with your own credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bristinaprajapati99@gmail.com', // Your email
    pass: 'wsaf appb angc opvt', // Your email password (use app password if 2FA enabled)
  },
});



const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const storage = multer.memoryStorage();
const upload = multer({ storage });



// // Password validation function
// const validatePassword = (password) => {
//   const minLength = 8;
//   const hasUpperCase = /[A-Z]/.test(password);
//   const hasLowerCase = /[a-z]/.test(password);
//   const hasNumbers = /\d/.test(password);
//   const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

//   if (password.length < minLength) {
//     throw new Error('Password must be at least 8 characters long');
//   }
//   if (!hasUpperCase) {
//     throw new Error('Password must contain at least one uppercase letter');
//   }
//   if (!hasLowerCase) {
//     throw new Error('Password must contain at least one lowercase letter');
//   }
//   if (!hasNumbers) {
//     throw new Error('Password must contain at least one number');
//   }
//   if (!hasSpecialChars) {
//     throw new Error('Password must contain at least one special character');
//   }

//   return true;
// };

// Signup Route
router.post("/signup", async (req, res) => {
  const { username, email, password, status } = req.body;

  try {
// Validate password before hashing
  //  validatePassword(password);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      status,
      communities: [],
      managedCommunity: null,
    });

    // If the user is signing up as a community admin, create a community
    if (status === "community") {
      const newCommunity = new Community({ 
        name: `${username}'s Community`, 
        admin: newUser._id, 
        members: [] 
      });
      await newCommunity.save();
      newUser.managedCommunity = newCommunity._id; // Assign the community to the admin
    }

    await newUser.save();
    res.status(201).json({ message: "User created successfully!", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err });
  }
});

// Get user by ID
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// // Get user by Email
// router.get("/user/email/:email", async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.params.email }).select("-password");
//     if (!user) {
//       return res.status(404).json({ message: "User not found!" });
//     }
//     res.status(200).json(user);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });


router.get("/data", authenticate, async (req, res) => {
  console.log("User ID from token:", req.userId);  // Debug log
  try {
    const user = await User.findById(req.userId).select("status managedCommunity communities");
    
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({
      status: user.status,
      managedCommunity: user.managedCommunity || null,
      communities: user.communities || [],  // Ensure it always returns an array
    });
  } catch (error) {
    console.error("Error:", error);  // Debug log
    res.status(500).json({ message: "Server error", error });
  }
});



router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for Email:', email); // Log email for debugging

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found'); // Log when user is not found
      return res.status(400).json({ message: 'User not found' });
    }

    console.log('User found:', user); // Log user details for debugging

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password'); // Log when password doesn't match
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Check if the email belongs to an admin
    const isAdmin = false;

    // Generate JWT token (use environment variable for secret key)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '2h' });

    console.log('Login successful, token generated'); // Log token generation success

    // Send response with user details, token, and communities
   // In auth.js login route
res.status(200).json({ 
  message: 'Login successful', 
  userId: user._id, 
  isAdmin, 
  token,
  username: user.username,
  email: user.email,
  profileImage: user.profileImage || null, 
  status: user.status, 
  communities: user.communities,
});
    
  } catch (err) {
    console.error('Login error:', err.message || err); // Log error details for debugging
    res.status(500).json({ message: 'Server error' });
  }
});



// Forgot Password route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Store OTP and expiration time (optional)
    user.resetToken = otp;
    user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    await user.save();

    // Send OTP via email
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Here is your OTP for password reset: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending OTP' });
      }
      res.status(200).json({ success: true, message: 'OTP sent to your email' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP route
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email, resetToken: otp });

    if (!user || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Reset Password route
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email, resetToken: otp });

    if (!user || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    // Hash the new password and update it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined; // Clear the reset token
    user.resetTokenExpiry = undefined; // Clear the expiry time
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Route to get community details for a user
router.get("/getCommunityDetails/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch the user with the provided userId and populate communityDetails
    const user = await User.findById(userId).populate({
      path: "communityDetails.communityId", // Populate community details
      select: "name" // Select relevant fields, e.g., community name
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      communityDetails: user.communityDetails,
    });
  } catch (error) {
    console.error("Error fetching community details:", error);
    res.status(500).json({ message: "Error fetching community details" });
  }
});

// Logout route to clear the googleAuthToken cookie
router.get("/logout", (req, res) => {
  try {
      // Clear the googleAuthToken cookie
      res.clearCookie("googleAuthToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Ensure secure in production
          sameSite: "Strict",
      });

      // Optionally, you can also clear other cookies or session data here
      res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ success: false, message: "Error during logout" });
  }
});

// Store Google auth in user model
router.post('/store-google-auth', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      googleAuthToken: req.body.token,
      googleRefreshToken: req.body.refreshToken,
      googleAuthExpiry: new Date(Date.now() + req.body.expiresIn * 1000)
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check Google auth status
router.get('/check-google-auth', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.status(200).json({ 
      isGoogleAuthed: !!user.googleAuthToken,
      email: user.email 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});





// Upload profile image
router.post("/upload-profile-image", authenticate, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    cloudinary.uploader.upload_stream(
      { folder: "profile-images" },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ success: false, message: "Error uploading image" });
        }

        // Update user in database
        await User.findByIdAndUpdate(req.userId, { profileImage: result.secure_url });

        res.json({ 
          success: true, 
          imageUrl: result.secure_url 
        });
      }
    ).end(req.file.buffer);
  } catch (error) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Remove profile image
router.delete("/remove-profile-image", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.profileImage) {
      return res.json({ success: true });
    }

    // Extract public ID from URL
    const publicId = user.profileImage.split("/").pop().split(".")[0];
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(`profile-images/${publicId}`);

    // Update user in database
    await User.findByIdAndUpdate(req.userId, { $unset: { profileImage: 1 } });

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing profile image:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/user", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("username email profileImage");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      username: user.username,
      email: user.email,
      profileImage: user.profileImage || null
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/community/:id', authenticate, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('admin', 'profileImage username email');
    
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    
    res.json({
      _id: community._id,
      name: community.name,
      admin: community.admin,
      members: community.members
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', authenticate, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('username email status profileImage');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.get("/user/:id", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("status username email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});



router.get('/unread-count', authenticate, async (req, res) => {
    try {
      console.log('Fetching unread count for user:', req.userId);
      
      // Count unread private messages
      const privateCount = await Message.countDocuments({
        recipient: req.userId,
        read: false,
        type: 'private'
      });
  
      // Get all groups the user belongs to
      const userGroups = await Group.find({ members: req.userId }).select('_id');
      const groupIds = userGroups.map(g => g._id);
  
      // Count unread group messages
      const groupCount = await Message.countDocuments({
        group: { $in: groupIds },
        readBy: { $ne: req.userId },
        type: 'group',
        sender: { $ne: req.userId }
      });
  
      const totalCount = privateCount + groupCount;
  
      console.log('Unread counts:', {
        private: privateCount,
        group: groupCount,
        total: totalCount
      });
  
      res.json({ 
        success: true,
        count: totalCount,
        privateCount,
        groupCount 
      });
    } catch (error) {
      console.error('Detailed error in /unread-count:', {
        message: error.message,
        stack: error.stack,
        userId: req.userId
      });
      res.status(500).json({ 
        success: false,
        message: 'Error fetching unread count',
        error: error.message 
      });
    }
  });
module.exports = router;