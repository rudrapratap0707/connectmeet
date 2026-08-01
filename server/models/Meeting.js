const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    meetingId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    password: { type: String, default: null }, // optional room password, plain (short-lived room code, not a user credential)
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled',
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meeting', meetingSchema);
