// Generates a human-friendly meeting id like "abc-defg-hij"
const CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789';

const randomChunk = (length) => {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return out;
};

const generateMeetingId = () => `${randomChunk(3)}-${randomChunk(4)}-${randomChunk(3)}`;

module.exports = generateMeetingId;
