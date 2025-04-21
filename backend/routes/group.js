// routes/group.js
const express = require('express');
const router = express.Router();
const authenticate = require('./authenticate');
const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// Create a new group
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    // Validate members
    const memberIds = [...new Set([...members, req.userId])]; // Include creator and remove duplicates
    
    // Create group
    const group = new Group({
      name,
      description,
      creator: req.userId,
      members: memberIds,
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

// Get all groups for current user
// In your group routes (backend)
router.get('/', authenticate, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate('creator members admins', 'username profileImage')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' }
      })
      .lean(); // Convert to plain JS objects
    
    // Ensure _id is included
    const response = groups.map(group => ({
      ...group,
      id: group._id // Add id alias if needed
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

// Remove members from group
router.delete('/:groupId/members', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;

    // Validate input
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    if (!members || !Array.isArray(members)) {  // Fixed missing parenthesis
      return res.status(400).json({ message: 'Members array is required' });
    }

    // Check if user is an admin of the group
    const group = await Group.findOne({
      _id: groupId,
      admins: req.userId
    });

    if (!group) {
      return res.status(403).json({ 
        message: 'Not authorized or group not found' 
      });
    }

    // Prevent removing the last admin
    const willRemoveAdmin = group.admins.some(adminId => 
      members.includes(adminId.toString())
    );
    
    if (willRemoveAdmin && group.admins.length <= 1) {
      return res.status(400).json({ 
        message: 'Cannot remove the only admin' 
      });
    }

    // Update the group
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      {
        $pull: { 
          members: { $in: members },
          admins: { $in: members }
        }
      },
      { new: true }
    ).populate('members admins', 'username profileImage');

    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error removing members:', error);
    res.status(500).json({ 
      message: 'Error removing members',
      error: error.message 
    });
  }
});

/// Get group messages
router.get('/:groupId/messages', authenticate, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if user is a member of the group
    const isMember = await Group.exists({
      _id: groupId,
      members: req.userId
    });

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const messages = await Message.find({ 
      group: groupId,
      type: 'group'
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username profileImage')
    .populate('group', 'name');

    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ 
      message: 'Error fetching group messages',
      error: error.message 
    });
  }
});



// Send message to group
router.post('/:groupId/messages', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    // Check if user is a member of the group
    const isMember = await Group.exists({
      _id: req.params.groupId,
      members: req.userId
    });

    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Create and save message
    const message = new Message({
      sender: req.userId,
      group: req.params.groupId,
      content,
      type: 'group',
      timestamp: new Date()
    });

    const savedMessage = await message.save();
    
    // Update group's last message
    await Group.findByIdAndUpdate(req.params.groupId, {
      lastMessage: savedMessage._id
    });

    // Populate sender details
    const populatedMessage = await Message.populate(savedMessage, [
      { path: 'sender', select: 'username profileImage' },
      { path: 'group', select: 'name' }
    ]);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error saving group message:', error);
    res.status(500).json({ message: 'Error saving group message' });
  }
});

module.exports = router;