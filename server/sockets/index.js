const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Meeting = require('../models/Meeting');
const MeetingHistory = require('../models/MeetingHistory');

// In-memory presence map: meetingId -> Map(socketId -> { userId, name, cameraOn, micOn })
const rooms = new Map();

const getRoom = (meetingId) => {
  if (!rooms.has(meetingId)) rooms.set(meetingId, new Map());
  return rooms.get(meetingId);
};

const participantsList = (meetingId) => {
  const room = getRoom(meetingId);
  return Array.from(room.entries()).map(([socketId, info]) => ({ socketId, ...info }));
};

function registerSocketHandlers(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    let currentMeetingId = null;

    socket.on('room:join', async ({ meetingId, name }) => {
      try {
        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting || meeting.status === 'ended') {
          socket.emit('room:error', { message: 'This meeting is not available.' });
          return;
        }

        const room = getRoom(meetingId);
        if (room.size >= 4) {
          socket.emit('room:error', { message: 'Room is full (max 4 participants).' });
          return;
        }

        currentMeetingId = meetingId;
        socket.join(meetingId);

        room.set(socket.id, {
          userId: socket.userId,
          name: name || 'Guest',
          cameraOn: true,
          micOn: true,
        });

        // Notify existing users
        socket.to(meetingId).emit('user:joined', {
          socketId: socket.id,
          name,
          userId: socket.userId,
        });

        // Send ONLY existing participants to the new user
        const existingParticipants = participantsList(meetingId).filter(
          (p) => p.socketId !== socket.id
        );
        socket.emit('room:participants', existingParticipants);
      } catch (err) {
        socket.emit('room:error', { message: 'Could not join the room.' });
      }
    });

    // WebRTC signaling relay
    socket.on('webrtc:offer', ({ to, offer }) => {
      io.to(to).emit('webrtc:offer', { from: socket.id, offer });
    });

    socket.on('webrtc:answer', ({ to, answer }) => {
      io.to(to).emit('webrtc:answer', { from: socket.id, answer });
    });

    socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
    });

    socket.on('media:status', ({ cameraOn, micOn }) => {
      if (!currentMeetingId) return;
      const room = getRoom(currentMeetingId);
      const info = room.get(socket.id);
      if (info) {
        info.cameraOn = cameraOn;
        info.micOn = micOn;
      }
      socket.to(currentMeetingId).emit('media:status', { socketId: socket.id, cameraOn, micOn });
    });

    socket.on('screen:share', ({ sharing }) => {
      if (!currentMeetingId) return;
      socket.to(currentMeetingId).emit('screen:share', { socketId: socket.id, sharing });
    });

    socket.on('chat:message', async ({ meetingId, sender, message }) => {
      try {
        const doc = await Message.create({ meetingId, sender, senderId: socket.userId, message });
        io.to(meetingId).emit('chat:message', {
          meetingId,
          sender,
          message,
          timestamp: doc.timestamp,
        });
      } catch (err) {
        socket.emit('room:error', { message: 'Message could not be sent.' });
      }
    });

    const leaveCurrentRoom = async () => {
      if (!currentMeetingId) return;
      const room = getRoom(currentMeetingId);
      room.delete(socket.id);
      socket.to(currentMeetingId).emit('user:left', { socketId: socket.id });
      if (room.size === 0) rooms.delete(currentMeetingId);

      try {
        await MeetingHistory.updateOne(
          { meetingId: currentMeetingId, user: socket.userId, leftAt: null },
          [
            {
              $set: {
                leftAt: '$$NOW',
                durationSeconds: { $divide: [{ $subtract: ['$$NOW', '$joinedAt'] }, 1000] },
              },
            },
          ]
        );
      } catch (err) {
        // best-effort; do not crash the socket handler
      }
      currentMeetingId = null;
    };

    socket.on('room:leave', leaveCurrentRoom);
    socket.on('disconnect', leaveCurrentRoom);
  });
}

module.exports = registerSocketHandlers;