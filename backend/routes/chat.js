
const express = require('express');
const router = express.Router();
const authenticate = require('./authenticate');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

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

// Save a message (updated route)
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { recipient, content, type = 'private', group } = req.body;

    // Validate the request
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if (type === 'private' && !recipient) {
      return res.status(400).json({ message: 'Recipient is required for private messages' });
    }

    if (type === 'group' && !group) {
      return res.status(400).json({ message: 'Group ID is required for group messages' });
    }

    // Create the message
    const messageData = {
      sender: req.userId,
      content,
      type,
      timestamp: new Date()
    };

    if (type === 'private') {
      messageData.recipient = recipient;
    } else {
      messageData.group = group;
    }

    const message = new Message(messageData);
    await message.save();
    
    // Populate the message with sender/recipient/group details
    const populatedMessage = await Message.populate(message, [
      { path: 'sender', select: 'username profileImage' },
      { path: 'recipient', select: 'username profileImage' },
      { path: 'group', select: 'name' }
    ]);

    res.status(201).json(populatedMessage);
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




  

module.exports = router;

