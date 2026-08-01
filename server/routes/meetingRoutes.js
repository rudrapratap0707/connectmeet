const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createMeeting,
  joinMeeting,
  getMeeting,
  endMeeting,
  saveMeetingMemory,
  getMeetingMemory,
  getMeetingMessages,
  getMyHistory,
} = require('../controllers/meetingController');

const router = express.Router();

router.use(protect);

router.post('/', createMeeting);
router.get('/history/me', getMyHistory);
router.get('/:meetingId', getMeeting);
router.post('/:meetingId/join', joinMeeting);
router.patch('/:meetingId/end', endMeeting);
router.post('/:meetingId/memory', saveMeetingMemory);
router.get('/:meetingId/memory', getMeetingMemory);
router.get('/:meetingId/messages', getMeetingMessages);

module.exports = router;
