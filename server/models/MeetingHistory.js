const mongoose = require('mongoose');

const meetingHistorySchema = new mongoose.Schema(
  {
    meetingId: { type: String, required: true, index: true },
    title: { type: String, default: 'Untitled Meeting' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    participantCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeetingHistory', meetingHistorySchema);
