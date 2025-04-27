const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const Community = require('../models/Community');
const User = require('../models/User');
const authenticate = require('./authenticate');

// In routes/notice.js
const sendNoticeNotifications = async (io, notice, userId, communityId) => {
  try {
    const [community, sender] = await Promise.all([
      Community.findById(communityId).populate('members'),
      User.findById(userId)
    ]);

    // Only send to community members (excluding sender)
    await Promise.all(community.members.map(async member => {
      if (member._id.toString() !== userId.toString()) {
        const notification = new Notification({
          recipient: member._id,
          sender: userId,
          message: `New Notice: ${notice.content.substring(0, 50)}...`,
          type: 'notice',
          relatedEntity: notice._id,
          isCommunityMember: true,
          noticeData: {
            content: notice.content,
            community: community.name
          }
        });
        
        await notification.save();
        
        const notificationData = notification.toObject();
        notificationData.sender = {
          _id: sender._id,
          username: sender.username,
          name: sender.name
        };
        
        io.to(`user_${member._id}`).emit('new-notification', notificationData);
      }
    }));
  } catch (error) {
    console.error('Error sending notice notifications:', error);
  }
};

// Get all notices for community
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('communityDetails.communityId', 'members admin');

    let communityId;
    if (user.status === 'community') {
      communityId = user.managedCommunity;
    } else if (user.communityDetails?.length > 0) {
      communityId = user.communityDetails[0].communityId;
    }

    if (!communityId) {
      return res.json({ success: true, notices: [] });
    }

    const notices = await Notice.find({ communityId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username');

    res.json({ success: true, notices });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching notices',
      error: error.message 
    });
  }
});


router.put('/:id', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const { id } = req.params;
    const io = req.app.get('io');
    
    if (!content || content.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Notice content must be at least 5 characters" 
      });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    if (user.status !== 'community') {
      return res.status(403).json({ 
        success: false, 
        message: "Only community admins can update notices" 
      });
    }

    const notice = await Notice.findOneAndUpdate(
      { 
        _id: id,
        communityId: user.managedCommunity,
        createdBy: req.userId 
      },
      { content },
      { new: true }
    ).populate('createdBy', 'username');

    if (!notice) {
      return res.status(404).json({ 
        success: false, 
        message: "Notice not found or unauthorized" 
      });
    }

    // Send update notifications
    await sendNoticeNotifications(
      io, 
      notice, 
      req.userId, 
      user.managedCommunity,
      true // isUpdate flag
    );

    res.json({ 
      success: true, 
      notice,
      message: "Notice updated successfully"
    });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating notice',
      error: error.message 
    });
  }
});

// Create new notice - 
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, createNotification } = req.body;
    
    if (!content || content.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Notice content must be at least 5 characters" 
      });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    if (user.status !== 'community') {
      return res.status(403).json({ 
        success: false, 
        message: "Only community admins can publish notices" 
      });
    }

    if (!user.managedCommunity) {
      return res.status(400).json({ 
        success: false, 
        message: "No community assigned to this admin" 
      });
    }

    const notice = new Notice({
      content,
      createdBy: req.userId,
      communityId: user.managedCommunity
    });

    await notice.save();
    
    // Get populated notice for response
    const populatedNotice = await Notice.findById(notice._id)
      .populate('createdBy', 'username');

    // Send notifications if requested
    if (createNotification) {
      try {
        const io = req.app.get('io');
        await sendNoticeNotifications(io, notice, req.userId, user.managedCommunity);
      } catch (notifError) {
        console.error("Notification error (non-critical):", notifError);
      }
    }

    res.json({ 
      success: true, 
      notice: populatedNotice,
      message: "Notice published successfully"
    });
  }  catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating notice',
      error: error.message 
    });
  }
});

// Delete notice
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.userId);
    
    if (!user || user.status !== 'community') {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const notice = await Notice.findOneAndDelete({
      _id: id,
      communityId: user.managedCommunity,
      createdBy: req.userId
    });

    if (!notice) {
      return res.status(404).json({ 
        success: false, 
        message: "Notice not found or unauthorized" 
      });
    }

    res.json({ 
      success: true, 
      message: "Notice deleted successfully" 
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting notice',
      error: error.message 
    });
  }
});


module.exports = router;