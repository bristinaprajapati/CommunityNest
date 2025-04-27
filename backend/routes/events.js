
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const Event = require("../models/Event");
const authenticate = require("./authenticate");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const router = express.Router();
const ensureAuthenticated = require("./meeting.js");
const { OAuth2Client } = require("google-auth-library");
const Notification = require('../models/Notification');
const Community = require('../models/Community');

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create an Event (with status field)
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  try {
    const { title, description, date, time, status = "Private" } = req.body;

    if (!title || !date || !time || !req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields and image are required." 
      });
    }

    cloudinary.uploader.upload_stream(
      { folder: "events" }, 
      async (error, result) => {
        if (error) {
          return res.status(500).json({ 
            success: false, 
            message: "Error uploading image to Cloudinary" 
          });
        }

        const newEvent = new Event({
          title,
          description: description || "", 
          date,
          time,
          image: result.secure_url,
          createdBy: req.userId,
          status,
          googleSheets: []
        });

        await newEvent.save();
        res.status(201).json({ 
          success: true, 
          event: newEvent 
        });
      }
    ).end(req.file.buffer);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});

// Fetch events based on user role
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("status communityDetails");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    let events;

    // For community admins - fetch all their own events
    if (user.status === "community") {
      events = await Event.find({ createdBy: req.userId })
        .sort({ createdAt: -1 }); // This ensures newest first
    } else if (user.status === "member") {
      const adminId = user.communityDetails[0]?.adminId;
      
      if (!adminId) {
        return res.status(400).json({ 
          success: false, 
          message: "Admin ID not found in community details." 
        });
      }

      events = await Event.find({ createdBy: adminId })
        .sort({ createdAt: -1 }); // This ensures newest first
    } else {
      events = [];
    }

    res.json({ 
      success: true, 
      events 
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});

// Delete an event
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the event first to check ownership
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: "Event not found" 
      });
    }

    // Verify the requesting user is the event creator
    if (event.createdBy.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized to delete this event" 
      });
    }

    // Extract Cloudinary public_id from image URL
    const imageUrl = event.image;
    const publicId = imageUrl.split("/").pop().split(".")[0];

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(`events/${publicId}`);

    // Delete event from MongoDB
    await Event.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: "Event deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting event",
      error: error.message 
    });
  }
});

// Update an event
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { title, description, date, time, status } = req.body;
    
    const existingEvent = await Event.findById(req.params.id);
    
    if (!existingEvent) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }
    
    if (existingEvent.createdBy.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized to update this event" 
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, time, status },
      { new: true }
    );

    res.json({ 
      success: true, 
      event: updatedEvent 
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});

// Fetch event title
router.get("/:id/title", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select("title");

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    res.json({ 
      success: true,
      title: event.title 
    });
  } catch (error) {
    console.error("Error fetching event title:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
});

// Email sending route (unchanged)

const oauth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);
router.post("/send-feedback-email", ensureAuthenticated, async (req, res) => {
  try {
      console.log("Request received at /send-feedback-email");
      console.log("Request body:", req.body);

      // Retrieve tokens and email from cookies
      const token = req.cookies.googleAuthToken;
      const refreshToken = req.cookies.googleAuthRefreshToken;
      const email = req.cookies.googleAuthEmail;

      console.log("Token from cookie:", token);
      console.log("Refresh token from cookie:", refreshToken);
      console.log("Email from cookie:", email);

      if (!token || !refreshToken || !email) {
          console.error("Token, refresh token, or email not found in cookies.");
          return res.status(401).json({ error: "Unauthorized. Please authenticate first." });
      }

      // Set credentials for OAuth2Client
      oauth2Client.setCredentials({
          access_token: token,
          refresh_token: refreshToken,
      });

      // Check if the token is expired
      if (oauth2Client.credentials.expiry_date && oauth2Client.credentials.expiry_date < Date.now()) {
          console.log("Token is expired. Refreshing token...");
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);

          // Update the token in cookies
          res.cookie("googleAuthToken", credentials.access_token, {
              httpOnly: false,
              secure: process.env.NODE_ENV === "production",
              sameSite: "Strict",
              maxAge: 7 * 24 * 60 * 60 * 1000,
              path: "/",
          });

          console.log("Token refreshed successfully:", credentials.access_token);
      }

      // Create a Nodemailer transporter using OAuth2
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              type: "OAuth2",
              user: email,
              clientId: process.env.CLIENT_ID,
              clientSecret: process.env.CLIENT_SECRET,
              refreshToken: refreshToken,
              accessToken: token,
          },
      });

      console.log("Nodemailer transporter created successfully.");

      // Define email options
      const mailOptions = {
          from: email,
          to: req.body.to.join(", "), // Join the array of emails into a comma-separated string
          subject: req.body.subject,
          text: req.body.message,
          html: `<p>${req.body.message}</p>`, // Optional: Add HTML version of the message
      };

      console.log("Sending email with options:", mailOptions);

      // Send the email
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.response);

      res.json({ message: "Feedback emails sent successfully", info });
  } catch (error) {
      console.error("Error sending feedback emails:", error);
      res.status(500).json({ error: "Failed to send feedback emails", details: error.message });
  }
});


// Add row to Google Sheet
router.post('/google-sheets/add-row', async (req, res) => {
  try {
    const { sheetUrl, rowData } = req.body;
    
    // Your implementation to add row to Google Sheet
    // This will depend on how you're interacting with Google Sheets API
    const newRow = await addRowToSheet(sheetUrl, rowData);
    
    res.json({ success: true, newRow });
  } catch (error) {
    console.error('Error adding row:', error);
    res.status(500).json({ success: false, message: 'Failed to add row' });
  }
});

// // Notification sending function for events
// const sendEventNotifications = async (io, event, userId, communityId) => {
//   try {
//     const community = await Community.findById(communityId).populate('members');
//     const allUsers = await User.find({ _id: { $ne: userId } });
//     const sender = await User.findById(userId);

//     await Promise.all(allUsers.map(async user => {
//       const isCommunityMember = community.members.some(m => m._id.equals(user._id));
      
//       const notification = new Notification({
//         recipient: user._id,
//         sender: userId,
//         message: `New Event: ${event.title}`,
//         type: 'event',
//         relatedEntity: event._id,
//         isCommunityMember,
//         eventData: {  
//           title: event.title,
//           date: event.date,
//           time: event.time,
//           image: event.image,
//           organizer: sender.username
//         }
//       });
      
//       await notification.save();
      
//       const notificationData = notification.toObject();
//       notificationData.sender = {
//         _id: sender._id,
//         username: sender.username,
//         name: sender.name
//       };
      
//       io.to(`user_${user._id}`).emit('new-notification', notificationData);
      
//       return notification;
//     }));

//     console.log(`Sent ${notifications.length} event notifications`);
//   } catch (error) {
//     console.error('Event notification error:', error);
//   }
// };


// In routes/event.js (status update route)
router.put("/:id/status", authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const newStatus = event.status === "Private" ? "Announcement" : "Private";
    event.status = newStatus;
    await event.save();

    if (newStatus === "Announcement") {
      const [organizer, allUsers] = await Promise.all([
        User.findById(req.userId),
        User.find({ _id: { $ne: req.userId } }) // All users except creator
      ]);

      const community = await Community.findOne({ adminId: req.userId });
      const io = req.app.get('io');

      await Promise.all(allUsers.map(async user => {
        const isMember = community?.members.includes(user._id) || false;
        
        const notification = new Notification({
          recipient: user._id,
          sender: req.userId,
          message: `Announcement: New Event: ${event.title}`,
          type: 'event',
          relatedEntity: event._id,
          isCommunityMember: isMember,
          eventData: {
            title: event.title,
            date: event.date,
            time: event.time,
            image: event.image,
            organizer: organizer.username
          }
        });

        await notification.save();
        
        const notificationData = notification.toObject();
        notificationData.sender = {
          _id: organizer._id,
          username: organizer.username,
          name: organizer.name || organizer.username
        };

        io.to(`user_${user._id}`).emit('new-notification', notificationData);
      }));
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error("Error updating event status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
