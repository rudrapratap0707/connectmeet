const MeetingHistory = require('../models/MeetingHistory');

// @route GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const history = await MeetingHistory.find({ user: req.user._id }).sort('-joinedAt').limit(10);

    const collaboratorSet = new Set();
    history.forEach((h) => collaboratorSet.add(h.meetingId));

    res.json({
      user: req.user.toSafeObject(),
      stats: {
        meetingsCompleted: req.user.meetingsCompleted,
        recentConversations: history.map((h) => ({
          meetingId: h.meetingId,
          title: h.title,
          joinedAt: h.joinedAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile };
