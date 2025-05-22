
const express = require('express');
const router = express.Router();
const authenticate = require('./authenticate');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const Group = require('../models/Group');
// Get messages between current user and another user
router.get('/messages/:userId', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.userId },
      ],
    })
    .sort({ timestamp: 1 })
    .populate('sender recipient', 'username profileImage');

    // Mark messages as read
    await Message.updateMany(
      {
        sender: req.params.userId,
        recipient: req.userId,
        read: false
      },
      { $set: { read: true } }
    );

    // Emit socket event to update unread counts
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`user_${req.userId}`).emit('unread-count-update', {
        conversationId: req.params.userId,
        count: 0
      });
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});
// Search for users
router.get('/search', authenticate, async (req, res) => {
  try {
    const term = req.query.term;
    if (!term) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { username: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ],
      _id: { $ne: req.userId } // Exclude current user
    }).select('username email profileImage status');

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Save a message
// routes/chat.js

router.post('/messages', authenticate, async (req, res) => {
  try {
    const { recipient, content, type = 'private', tempId } = req.body;

    // Validate request
    if (!content) return res.status(400).json({ message: 'Content required' });
    if (type === 'private' && !recipient) {
      return res.status(400).json({ message: 'Recipient required' });
    }

    // Create message (but don't save yet)
    const messageData = {
      sender: req.userId,
      content,
      type,
      timestamp: new Date()
    };

    if (type === 'private') {
      messageData.recipient = recipient;
    } else {
      messageData.group = recipient; // Using recipient field for group ID
    }

    const message = new Message(messageData);
    const savedMessage = await message.save();
    
    // Populate and prepare response
    const populated = await Message.populate(savedMessage, [
      { path: 'sender', select: 'username profileImage' },
      { path: 'recipient', select: 'username profileImage' },
      { path: 'group', select: 'name' }
    ]);

    const response = {
      ...populated.toObject(),
      tempId
    };

    // Emit socket event (like group messages do)
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      if (type === 'private') {
        io.to(`user_${recipient}`).emit('private-message', {
          messageData: response
        });
        io.to(`user_${req.userId}`).emit('private-message-sent', {
          messageData: response
        });
      } else {
        io.to(`group_${recipient}`).emit('group-message', {
          message: response,
          groupId: recipient
        });
      }
    }

    res.status(201).json(response);
    
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ 
      message: 'Error saving message',
      error: error.message 
    });
  }
});

// Get conversation partners

// routes/chat.js
router.get('/conversation-partners', authenticate, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const partners = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId, type: 'private' },
            { recipient: userId, type: 'private' }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$recipient", userId] },
                    { $ne: ["$read", true] }
                  ] 
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: "$user._id",
          username: "$user.username",
          email: "$user.email",
          profileImage: "$user.profileImage",
          status: "$user.status",
          lastMessage: {
            _id: "$lastMessage._id",
            content: "$lastMessage.content",
            timestamp: "$lastMessage.timestamp",
            sender: "$lastMessage.sender",
            recipient: "$lastMessage.recipient"
          },
          unreadCount: 1
        }
      },
      {
        $sort: { "lastMessage.timestamp": -1 }
      }
    ]);

    res.json(partners);
  } catch (error) {
    console.error('Error fetching conversation partners:', error);
    res.status(500).json({ message: 'Error fetching conversation history' });
  }
});


  //group chat

// Get all users for group creation
router.get('/users-for-group', authenticate, async (req, res) => {
    try {
      const users = await User.find({
        _id: { $ne: req.userId } // Exclude current user
      }).select('username email profileImage status');
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users for group:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });
  
  // Create a group
  router.post('/create-group', authenticate, async (req, res) => {
    try {
      const { name, members } = req.body;
      
      // Include the creator in the members
      const allMembers = [...new Set([...members, req.userId])];
      
      const group = new Group({
        name,
        creator: req.userId,
        members: allMembers,
        admins: [req.userId]
      });
  
      await group.save();
      
      // Populate the group data
      const populatedGroup = await Group.findById(group._id)
        .populate('creator members admins', 'username email profileImage');
  
      res.status(201).json(populatedGroup);
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ message: 'Error creating group' });
    }
  });


  // Add this to your chat.js routes
  router.post('/mark-as-read', authenticate, async (req, res) => {
    try {
      const { conversationId, type } = req.body;
      
      if (type === 'private') {
        await Message.updateMany(
          {
            recipient: req.userId,
            sender: conversationId,
            read: false
          },
          { $set: { read: true } }
        );
      } else if (type === 'group') {
        await Message.updateMany(
          {
            group: conversationId,
            sender: { $ne: req.userId },
            read: false
          },
          { $set: { read: true } }
        );
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ message: 'Error marking messages as read' });
    }
  });
// chat.js routes
router.get('/unread-counts', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all groups the user is a member of
    const userGroups = await Group.find({ members: userId }).select('_id');
    const groupIds = userGroups.map(g => g._id);

    // Use a single aggregation pipeline for both private and group messages
    const results = await Message.aggregate([
      {
        $match: {
          $or: [
            // Private messages to the user that are unread
            {
              recipient: mongoose.Types.ObjectId(userId),
              read: false,
              type: 'private'
            },
            // Group messages in the user's groups that are unread and not sent by the user
            {
              group: { $in: groupIds },
              sender: { $ne: mongoose.Types.ObjectId(userId) },
              read: false,
              type: 'group'
            }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$type', 'private'] },
              '$sender',
              '$group'
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert the results to the required format
    const unreadCounts = {};
    results.forEach(item => {
      unreadCounts[item._id.toString()] = item.count;
    });

    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

    res.json({ 
      success: true,
      unreadCounts,
      totalUnread 
    });
  } catch (error) {
    console.error('Error getting unread counts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting unread counts' 
    });
  }
});

router.get('/unread-count/:conversationId', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // First check if it's a group conversation
    const isGroup = await Group.exists({ _id: conversationId, members: userId });

    let count;
    if (isGroup) {
      count = await Message.countDocuments({
        group: conversationId,
        sender: { $ne: userId },
        read: false
      });
    } else {
      // Assume it's a private conversation
      count = await Message.countDocuments({
        sender: conversationId,
        recipient: userId,
        read: false
      });
    }

    res.json({ 
      success: true,
      count 
    });
  } catch (error) {
    console.error('Error getting conversation unread count:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting unread count' 
    });
  }
});

// Delete private conversation
router.delete('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // Delete all messages between these two users
    await Message.deleteMany({
      $or: [
        { sender: currentUserId, recipient: userId, type: 'private' },
        { sender: userId, recipient: currentUserId, type: 'private' }
      ]
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Error deleting conversation' });
  }
});

// Delete group conversation (for current user only)
router.delete('/group-conversation/:groupId', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.userId;

    // Remove user from group members
    await Group.findByIdAndUpdate(
      groupId,
      { $pull: { members: currentUserId } },
      { new: true }
    );

    // Notify via socket if needed
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`user_${currentUserId}`).emit('conversation-deleted', { 
        conversationId: groupId,
        type: 'group'
      });
      io.to(`group_${groupId}`).emit('group-member-left', {
        groupId,
        userId: currentUserId
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ message: 'Error leaving group' });
  }
});

module.exports = router;