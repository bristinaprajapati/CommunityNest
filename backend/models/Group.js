const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  creator: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    type: ObjectId,
    ref: 'Message'
  }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
GroupSchema.index({ members: 1 });
GroupSchema.index({ creator: 1 });

// Add virtual for unread counts
GroupSchema.virtual('unreadCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'group',
  count: true
});

// Add method to mark messages as read
GroupSchema.methods.markAsRead = async function(userId) {
  const userIdObj = new ObjectId(userId);
  await Message.updateMany(
    {
      group: this._id,
      sender: { $ne: userIdObj },
      readBy: { $ne: userIdObj }
    },
    { $addToSet: { readBy: userIdObj } }
  );
};

module.exports = mongoose.model('Group', GroupSchema);