const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    meetingId: { type: String, required: true, index: true },
    sender: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true, maxlength: 2000 },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Message', messageSchema);
