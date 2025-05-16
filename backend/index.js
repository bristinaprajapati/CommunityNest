const http = require('http');
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const path = require("path");
const { Server: SocketIOServer } = require('socket.io');
const dashboardRoutes = require("./routes/dashboard");
const noticeRoutes = require("./routes/notice");
const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const departmentRoutes = require("./routes/department");
const files = require("./routes/files");
const meetingRoutes = require("./routes/meeting");
const communityRoutes = require("./routes/community");
const eventRoutes = require("./routes/events");
const googleSheetsRoutes = require("./routes/googleSheetsRoutes");
const googleAuth = require("./routes/googleAuth");
// Add near other route imports
const notificationRoutes = require('./routes/notifications');
const jwt = require('jsonwebtoken'); 
const chatRoutes = require('./routes/chat');
const groupRoutes = require('./routes/group');
const Message = require('./models/Message'); 
const config = require('./config');
const postRoutes = require('./routes/posts');


// Load environment variables
dotenv.config();
const Group = require('./models/Group');

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});



// Store connected clients
const connectedClients = new Map();


io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // socket.on('new-message', () => {
  //   console.log('New message event received');
  //   const message = 'BRISITNA'
  //   io.emit('refetch',{message})
  // })

 // Replace your authenticate handler with this:

socket.on('authenticate', async (token) => {
  try {
    // Use process.env.JWT_SECRET for consistency with auth.js
    console.log('Authenticating socket with token');
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    socket.userId = decoded.userId;
    
    // Store the socket in connectedClients map
    connectedClients.set(decoded.userId, socket);
    
    console.log(`Socket ${socket.id} authenticated for user ${decoded.userId}`);
    
    // Join user's personal room
    socket.join(`user_${decoded.userId}`);
    
    // Join all group rooms for this user
    const userGroups = await Group.find({ members: decoded.userId });
    userGroups.forEach(group => {
      socket.join(`group_${group._id}`);
      console.log(`User ${decoded.userId} joined group room: group_${group._id}`);
    });
    
    socket.emit('authenticated', { success: true });
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    socket.emit('authenticated', { success: false, error: error.message });
  }
});

// Remove the existing private-message handler and replace with:
socket.on('send-private-message', async (data, callback) => {
  try {
    const { recipientId, content, tempId } = data;
    
    // Validate sender
    if (!socket.userId) throw new Error('Not authenticated');
    
    // Create and save message
    const message = new Message({
      sender: socket.userId,
      recipient: recipientId,
      content,
      type: 'private',
      timestamp: new Date()
    });

    const savedMessage = await message.save();
    const populated = await Message.populate(savedMessage, [
      { path: 'sender', select: 'username profileImage' },
      { path: 'recipient', select: 'username profileImage' }
    ]);

    // Prepare response
    const response = {
      ...populated.toObject(),
      tempId
    };

    // Emit to recipient only
    io.to(`user_${recipientId}`).emit('private-message', { 
      messageData: response 
    });

    // Send confirmation to sender
    callback({ status: 'success', message: response });
    
  } catch (error) {
    console.error('Error sending private message:', error);
    callback({ status: 'error', error: error.message });
  }
});

// Enhanced group message handler
socket.on('group-message', async (data) => {
  try {
    console.log('Group message received:', data);
    
    const { groupId, content, senderId } = data;
    
    // Verify group exists
    const group = await Group.findById(groupId).populate('members');
    if (!group) {
      console.error(`Group not found: ${groupId}`);
      return socket.emit('message-error', { error: 'Group not found' });
    }
    
    // Verify sender is member
    const isMember = group.members.some(m => m._id.toString() === senderId);
    if (!isMember) {
      console.error(`User ${senderId} is not a member of group ${groupId}`);
      return socket.emit('message-error', { error: 'Not a group member' });
    }
    
    // Create and save message
    const message = new Message({
      sender: senderId,
      group: groupId,
      content,
      type: 'group',
      timestamp: new Date()
    });
    
    const savedMessage = await message.save();
    
    // Update group's last message
    await Group.findByIdAndUpdate(groupId, { 
      lastMessage: savedMessage._id,
      updatedAt: new Date()
    });
    
    // Populate message details
    const populatedMessage = await Message.populate(savedMessage, [
      { path: 'sender', select: 'username profileImage' },
      { path: 'group', select: 'name members' }
    ]);
    
    // Get unique user IDs (not socket IDs) 
    const memberIds = Array.from(new Set(
      group.members.map(member => member._id.toString())
    ));
    
    console.log(`Broadcasting to ${memberIds.length} group members`);
    
    // Broadcast to rooms instead of individual sockets
    io.to(`group_${groupId}`).emit('group-message', {
      message: populatedMessage,
      groupId
    });
    
    // Send a confirmation to the sender if there's a tempId
    if (data.tempId) {
      socket.emit('group-message-sent', {
        tempId: data.tempId,
        message: populatedMessage
      });
    }
    
  } catch (error) {
    console.error('Error handling group message:', error);
    socket.emit('message-error', { 
      error: error.message,
      tempId: data.tempId
    });
  }
});

// Handle explicit group joining
socket.on('join-group', async (groupId) => {
  try {
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }
    
    // Verify user is a member of this group
    const group = await Group.findOne({
      _id: groupId,
      members: socket.userId
    });
    
    if (!group) {
      socket.emit('error', { message: 'Not a member of this group' });
      return;
    }
    
    console.log(`User ${socket.userId} joining group room: group_${groupId}`);
    socket.join(`group_${groupId}`);
    socket.emit('joined-group', { groupId });
  } catch (error) {
    console.error('Error joining group room:', error);
    socket.emit('error', { message: error.message });
  }
});

socket.on('get-group-conversations', async () => {
  if (!socket.userId) return;
  
  try {
    const groups = await Group.aggregate([
      { $match: { members: mongoose.Types.ObjectId(socket.userId) } },
      {
        $lookup: {
          from: 'messages',
          let: { groupId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ['$group', '$$groupId'] },
                type: 'group'
              } 
            },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessage'
        }
      },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'lastMessage.sender'
        }
      },
      { $unwind: { path: '$lastMessage.sender', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          members: 1,
          lastMessage: {
            $cond: {
              if: { $ifNull: ['$lastMessage', false] },
              then: {
                content: '$lastMessage.content',
                timestamp: '$lastMessage.timestamp',
                sender: {
                  _id: '$lastMessage.sender._id',
                  username: '$lastMessage.sender.username'
                }
              },
              else: null
            }
          }
        }
      },
      { $sort: { 'lastMessage.timestamp': -1 } }
    ]);

    socket.emit('group-conversations', groups);
  } catch (error) {
    console.error('Error fetching group conversations:', error);
  }
});


socket.on('messages-read', async ({ userId, conversationId, type }) => {
  try {
    console.log(`Marking messages as read for ${userId}, ${type} ${conversationId}`);
    
    if (type === 'private') {
      await Message.updateMany(
        {
          recipient: userId,
          sender: conversationId,
          read: false
        },
        { $set: { read: true } }
      );
    } else if (type === 'group') {
      await Message.updateMany(
        {
          group: conversationId,
          sender: { $ne: userId },
          read: false
        },
        { $set: { read: true } }
      );
    }
    
    // Get updated counts and emit to client
    const counts = await getUnreadCounts(userId);
    io.to(`user_${userId}`).emit('unread-count-update', counts);
    
  } catch (error) {
    console.error('Error handling messages-read:', error);
  }
});

// Handle request for unread counts
socket.on('get-unread-counts', async (userId) => {
  try {
    const counts = await getUnreadCounts(userId);
    socket.emit('unread-count-update', counts);
  } catch (error) {
    console.error('Error getting unread counts:', error);
    socket.emit('unread-count-error', { error: error.message });
  }
});

socket.on('new-msg',async ({selectedId,currentId}) => {
io.emit(`${selectedId}`,currentId);
}
);


  async function getUnreadCounts(userId) {
    try {
      // Get private message counts
      const privateCounts = await Message.aggregate([
        {
          $match: {
            recipient: mongoose.Types.ObjectId(userId),
            read: false,
            type: 'private'
          }
        },
        {
          $group: {
            _id: '$sender',
            count: { $sum: 1 }
          }
        }
      ]);
  
      // Get group message counts
      const userGroups = await Group.find({ members: userId }).select('_id');
      const groupIds = userGroups.map(g => g._id);
      
      const groupCounts = await Message.aggregate([
        {
          $match: {
            group: { $in: groupIds },
            sender: { $ne: mongoose.Types.ObjectId(userId) },
            read: false,
            type: 'group'
          }
        },
        {
          $group: {
            _id: '$group',
            count: { $sum: 1 }
          }
        }
      ]);
  
      // Combine counts
      const unreadCounts = {};
      privateCounts.forEach(item => {
        unreadCounts[item._id.toString()] = item.count;
      });
      groupCounts.forEach(item => {
        unreadCounts[item._id.toString()] = item.count;
      });
  
      const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  
      return { unreadCounts, totalUnread };
    } catch (error) {
      console.error('Error in getUnreadCounts:', error);
      throw error;
    }
  }

  // Handle message history requests
  socket.on('get-messages', async ({ userId1, userId2 }) => {
    try {
      const messages = await Message.find({
        $or: [
          { sender: userId1, recipient: userId2 },
          { sender: userId2, recipient: userId1 }
        ]
      }).sort({ timestamp: 1 }).populate('sender recipient', 'username profileImage');

      socket.emit('previous-messages', messages);
    } catch (error) {
      console.error('Error fetching message history:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    if (socket.userId) {
      connectedClients.delete(socket.userId);
      updateOnlineUsers();
    }
  });

  // Helper function to update online users
  function updateOnlineUsers() {
    const onlineUsers = Array.from(connectedClients.keys());
    io.emit('online-users', onlineUsers);
  }
});

// Update the sendNotification utility
function sendNotification(userId, notification) {
  io.to(`user_${userId}`).emit('new-notification', notification);
  console.log(`Notification sent to user ${userId}`);
}


// Enhanced notification utility function
function sendNotification(userId, data) {
  // Get the socket instance from the server
  const io = app.get('io');
  
  // Emit to the specific user's room
  io.to(`user_${userId}`).emit('new-notification', data);
  
  console.log(`Notification sent to user ${userId}`);
}
// Make io accessible to routes
app.set('io', io);

// Middleware to parse cookies
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization",  "cache-control", ],
  credentials: true,
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://apis.google.com",
          "https://accounts.google.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://www.googleapis.com",
          "https://oauth2.googleapis.com",
        ],
        frameSrc: ["https://accounts.google.com", "https://www.googleapis.com"],
      },
    },
  })
);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
mongoose
  .connect(process.env.MONGO_URL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB not connected:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/file", files);
app.use("/api/meeting", meetingRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/google-sheets", googleSheetsRoutes);
app.use("/api/google", googleAuth.router);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notice", noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/posts', postRoutes);
// app.use('/api/conversations', conversationRoutes);
// app.use('/api/messages', messageRoutes);

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// Utility function to send notifications
function sendNotification(userId, data) {
  const clientSocket = connectedClients.get(userId);
  if (clientSocket) {
    clientSocket.emit('notification', data);
  }
}

// Make sendNotification available to routes
app.set('sendNotification', sendNotification);