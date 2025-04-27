const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authenticate = require('./authenticate');

// Get all notifications for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'username name email') // Populate sender with needed fields
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      read: false
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          recipient: req.userId
        },
        { $set: { read: true } },
        { new: true }
      );
  
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or unauthorized'
        });
      }
  
      res.json({
        success: true,
        notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  });

  router.delete('/:id', authenticate, async (req, res) => {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.userId
      });
  
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or unauthorized'
        });
      }
  
      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  });

module.exports = router;