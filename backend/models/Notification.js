const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['notice', 'announcement', 'event', 'file'],
    required: true
  },
  relatedEntity: {
    type: mongoose.Schema.Types.ObjectId
  },
  read: {
    type: Boolean,
    default: false
  },
  isCommunityMember: {
    type: Boolean,
    required: true
  },
  eventData: {
    title: String,
    date: String,
    time: String,
    image: String,
    organizer: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);