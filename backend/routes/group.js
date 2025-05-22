// routes/group.js
const express = require('express');
const router = express.Router();
const authenticate = require('./authenticate');
const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');

//create group
// In your backend group routes
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, members } = req.body;
    
    // Include the creator in the members
    const memberIds = [...new Set([...members, req.userId])];
    
    const group = new Group({
      name,
      creator: req.userId,
      members: memberIds,
      admins: [req.userId]
    });

    await group.save();
    
    // Populate all necessary fields before returning
    const populatedGroup = await Group.findById(group._id)
      .populate('creator members admins', 'username profileImage')
      .lean();

    // Emit socket event to all members
    if (req.app.get('io')) {
      const io = req.app.get('io');
      memberIds.forEach(memberId => {
        io.to(`user_${memberId}`).emit('group-created', populatedGroup);
      });
    }

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Error creating group' });
  }
});
// Get all groups for current user

router.get('/', authenticate, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate('creator members admins', 'username profileImage')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' }
      })
      .lean(); 
    
    // Ensure _id is included
    const response = groups.map(group => ({
      ...group,
      id: group._id 
    }));
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Error fetching groups' });
  }
});

// Get group details
router.get('/:groupId', authenticate, async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.groupId,
      members: req.userId
    }).populate('creator members admins', 'username email profileImage');

    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Error fetching group' });
  }
});

// Update group
router.put('/:groupId', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const group = await Group.findOneAndUpdate(
      {
        _id: req.params.groupId,
        admins: req.userId
      },
      { name, description },
      { new: true }
    ).populate('creator members admins', 'username email profileImage');

    if (!group) {
      return res.status(404).json({ message: 'Group not found or not authorized' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Error updating group' });
  }
});

// Add members to group
router.post('/:groupId/members', authenticate, async (req, res) => {
  try {
    const { members } = req.body;
    
    const group = await Group.findOneAndUpdate(
      {
        _id: req.params.groupId,
        admins: req.userId
      },
      { $addToSet: { members: { $each: members } } },
      { new: true }
    ).populate('creator members admins', 'username email profileImage');

    if (!group) {
      return res.status(404).json({ message: 'Group not found or not authorized' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error adding members:', error);
    res.status(500).json({ message: 'Error adding members' });
  }
});

// In routes/group.js - Update the remove members route
router.delete('/:groupId/members', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body; // Extract memberId from request body
    
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid group ID format' });
    }

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: 'Invalid member ID format' });
    }

    // Check if requester is admin
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.admins.includes(req.userId)) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    // Prevent removing creator
    if (group.creator.toString() === memberId) {
      return res.status(403).json({ message: 'Cannot remove group creator' });
    }

    // Remove the member from the group
   // In the remove members route
const updatedGroup = await Group.findByIdAndUpdate(
  groupId,
  {
    $pull: { 
      members: memberId,
      admins: memberId 
    }
  },
  { new: true }
)
.populate('members admins', 'username profileImage')
.populate({
  path: 'lastMessage',
  populate: { path: 'sender', select: 'username profileImage' }
});

    // Emit socket events
    if (req.app.get('io')) {
      const io = req.app.get('io');
      
      // Notify all group members
      io.to(`group_${groupId}`).emit('group-updated', updatedGroup);
      
      // Notify the removed user specifically
      io.to(`user_${memberId}`).emit('removed-from-group', {
        groupId,
        userId: memberId
      });
    }

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ 
      message: 'Error removing member',
      error: error.message 
    });
  }
});


/// Get group messages
router.get('/:groupId/messages', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { before } = req.query; // For pagination

    // Check membership
    const isMember = await Group.exists({
      _id: groupId,
      members: req.userId
    });

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Build query
    const query = { 
      group: groupId,
      type: 'group'
    };

    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('sender', 'username profileImage')
      .lean();

    res.json(messages.reverse()); // Return oldest first for proper display
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

router.post('/:groupId/messages', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const groupId = req.params.groupId;
    
    // Verify user is member of group
    const group = await Group.findOne({
      _id: groupId,
      members: req.userId
    });
    
    if (!group) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }
    
    // Create message
    const message = new Message({
      sender: req.userId,
      group: groupId,
      content,
      type: 'group'
    });
    
    await message.save();
    
    // Update group's last message
    await Group.findByIdAndUpdate(groupId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });
    
    // Populate sender info
    const populatedMessage = await Message.populate(message, {
      path: 'sender',
      select: 'username profileImage'
    });
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error adding group message:', error);
    res.status(500).json({ message: 'Error adding message' });
  }
});
// Mark group messages as read
router.post('/:groupId/mark-read', authenticate, async (req, res) => {
  try {
    await Message.updateMany(
      {
        group: req.params.groupId,
        sender: { $ne: req.userId },
        readBy: { $ne: req.userId }
      },
      { $addToSet: { readBy: req.userId } }
    );
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking group messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

// Add this new endpoint
router.get('/user/unread-counts', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // Get all groups the user is in
    const groups = await Group.find({ members: userId }).select('_id');

    // Get unread counts for each group
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          group: { $in: groups.map(g => g._id) },
          sender: { $ne: mongoose.Types.ObjectId(userId) },
          readBy: { $ne: mongoose.Types.ObjectId(userId) }
        }
      },
      {
        $group: {
          _id: '$group',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const counts = {};
    unreadCounts.forEach(item => {
      counts[item._id.toString()] = item.count;
    });

    res.json({ 
      success: true,
      unreadCounts: counts 
    });
  } catch (error) {
    console.error('Error getting group unread counts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting unread counts' 
    });
  }
});

// Get unread count for a group
router.get('/:groupId/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      group: req.params.groupId,
      sender: { $ne: req.userId },
      readBy: { $ne: req.userId }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error getting unread count' });
  }
});
module.exports = router;