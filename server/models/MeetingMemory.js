const mongoose = require('mongoose');

const meetingMemorySchema = new mongoose.Schema(
  {
    meetingId: { type: String, required: true, index: true },
    title: { type: String, default: 'Untitled Meeting' },
    discussion: [{ type: String }],
    decisions: [{ type: String }],
    actions: [
      {
        text: { type: String, required: true },
        done: { type: Boolean, default: false },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeetingMemory', meetingMemorySchema);
