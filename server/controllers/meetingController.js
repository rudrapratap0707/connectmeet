const Meeting = require('../models/Meeting');
const MeetingHistory = require('../models/MeetingHistory');
const MeetingMemory = require('../models/MeetingMemory');
const Message = require('../models/Message');
const User = require('../models/User');
const generateMeetingId = require('../utils/generateMeetingId');

const MAX_PARTICIPANTS = 4;

// @route POST /api/meetings
const createMeeting = async (req, res, next) => {
  try {
    const { title, password } = req.body;

    let meetingId = generateMeetingId();
    // guard against the very rare collision
    // eslint-disable-next-line no-await-in-loop
    while (await Meeting.findOne({ meetingId })) {
      meetingId = generateMeetingId();
    }

    const meeting = await Meeting.create({
      meetingId,
      title: title?.trim() || 'Untitled Room',
      host: req.user._id,
      password: password || null,
      status: 'scheduled',
    });

    res.status(201).json({
      meeting: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        host: req.user.name,
        hasPassword: Boolean(meeting.password),
        status: meeting.status,
        createdAt: meeting.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/meetings/:meetingId/join
const joinMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const { password } = req.body;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found. Check the meeting ID or link.' });
    }
    if (meeting.status === 'ended') {
      return res.status(410).json({ message: 'This meeting has already ended.' });
    }
    if (meeting.password && meeting.password !== password) {
      return res.status(401).json({ message: 'Incorrect meeting password.' });
    }
    if (meeting.participants.length >= MAX_PARTICIPANTS && meeting.status === 'active') {
      return res.status(403).json({ message: `This room is full (max ${MAX_PARTICIPANTS} participants).` });
    }

    if (meeting.status === 'scheduled') {
      meeting.status = 'active';
      meeting.startedAt = new Date();
    }

    const alreadyIn = meeting.participants.some((p) => String(p.user) === String(req.user._id));
    if (!alreadyIn) {
      meeting.participants.push({ user: req.user._id, name: req.user.name });
    }
    await meeting.save();

    await MeetingHistory.create({
      meetingId: meeting.meetingId,
      title: meeting.title,
      user: req.user._id,
      joinedAt: new Date(),
      participantCount: meeting.participants.length,
    });

    res.json({
      meeting: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        status: meeting.status,
        participantCount: meeting.participants.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/meetings/:meetingId
const getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId }).populate('host', 'name');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json({
      meeting: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        host: meeting.host?.name,
        status: meeting.status,
        hasPassword: Boolean(meeting.password),
        participantCount: meeting.participants.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/meetings/:meetingId/end
const endMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (String(meeting.host) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the host can end this meeting' });
    }

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    await meeting.save();

    const now = new Date();
    await MeetingHistory.updateMany(
      { meetingId: meeting.meetingId, leftAt: null },
      [
        {
          $set: {
            leftAt: now,
            durationSeconds: { $divide: [{ $subtract: [now, '$joinedAt'] }, 1000] },
          },
        },
      ]
    );

    await User.updateMany(
      { _id: { $in: meeting.participants.map((p) => p.user) } },
      { $inc: { meetingsCompleted: 1 } }
    );

    res.json({ message: 'Meeting ended' });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/meetings/:meetingId/memory
const saveMeetingMemory = async (req, res, next) => {
  try {
    const { discussion = [], decisions = [], actions = [] } = req.body;
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const memory = await MeetingMemory.findOneAndUpdate(
      { meetingId: req.params.meetingId },
      {
        meetingId: req.params.meetingId,
        title: meeting.title,
        discussion,
        decisions,
        actions: actions.map((a) => (typeof a === 'string' ? { text: a, done: false } : a)),
        createdBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ memory });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/meetings/:meetingId/memory
const getMeetingMemory = async (req, res, next) => {
  try {
    const memory = await MeetingMemory.findOne({ meetingId: req.params.meetingId });
    res.json({ memory: memory || null });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/meetings/:meetingId/messages
const getMeetingMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ meetingId: req.params.meetingId }).sort('timestamp');
    res.json({ messages });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/meetings/history/me
const getMyHistory = async (req, res, next) => {
  try {
    const history = await MeetingHistory.find({ user: req.user._id }).sort('-joinedAt').limit(50);
    res.json({ history });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMeeting,
  joinMeeting,
  getMeeting,
  endMeeting,
  saveMeetingMemory,
  getMeetingMemory,
  getMeetingMessages,
  getMyHistory,
  MAX_PARTICIPANTS,
};
