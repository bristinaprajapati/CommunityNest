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
  image: {
    type: String,
    default: null
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
  updatedAt: {
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
  },
  timestamps: false // We're manually handling timestamps
});

// Indexes
GroupSchema.index({ members: 1 });
GroupSchema.index({ creator: 1 });
GroupSchema.index({ updatedAt: -1 }); // For sorting groups by activity

// Virtuals
GroupSchema.virtual('lastMessageDetails', {
  ref: 'Message',
  localField: 'lastMessage',
  foreignField: '_id',
  justOne: true
});

GroupSchema.virtual('unreadCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'group',
  count: true,
  match: {
    read: false,
    sender: { $ne: null } // Exclude system messages
  }
});

// Add method to mark messages as read
GroupSchema.methods.markAsRead = async function(userId) {
  const userIdObj = new ObjectId(userId);
  await this.model('Message').updateMany(
    {
      group: this._id,
      sender: { $ne: userIdObj },
      readBy: { $ne: userIdObj }
    },
    { $addToSet: { readBy: userIdObj }, $set: { read: true } }
  );
};

// Update timestamp when group changes
GroupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});


module.exports = mongoose.model('Group', GroupSchema);