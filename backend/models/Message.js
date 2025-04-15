const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  read: {
    type: Boolean,
    default: false
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
  toObject: {
    virtuals: true
  }
});

// Indexes
MessageSchema.index({ sender: 1, recipient: 1 });
MessageSchema.index({ recipient: 1, sender: 1 });

// Virtuals
MessageSchema.virtual('senderObj', {
  ref: 'User',
  localField: 'sender',
  foreignField: '_id',
  justOne: true
});

MessageSchema.virtual('recipientObj', {
  ref: 'User',
  localField: 'recipient',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Message', MessageSchema);