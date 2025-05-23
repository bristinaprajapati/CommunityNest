const mongoose = require('mongoose');

const HiddenConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  hiddenAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HiddenConversation', HiddenConversationSchema);