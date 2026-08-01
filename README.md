# ConnectMeet

**Meetings are not rooms. They are moments.**

ConnectMeet is a real-time video collaboration workspace built on the MERN
stack. Beyond video calling, it treats every meeting as a persistent context
that keeps track of live people, notes, decisions, and follow-up actions —
the **Meeting Memory** feature.

---

## Tech stack

**Frontend:** React (Vite), Tailwind CSS, React Router, Axios, Socket.IO
Client, native WebRTC, Lucide icons, React Hot Toast

**Backend:** Node.js, Express, Socket.IO, JWT, bcrypt, MongoDB + Mongoose

**Video/audio:** Peer-to-peer WebRTC (mesh topology), signaled over Socket.IO.
No third-party media server. Designed and tested for **2–4 participants per
room** (a browser mesh scales poorly past that — see "Scaling" below).

No Firebase, Cloudinary, AWS S3, or SQL is used anywhere in this project.

---

## ⚠️ Before you do anything else

An earlier draft of this project's planning notes contained a **live MongoDB
Atlas username and password** pasted in plain text. If that credential is
still active:

1. Log into MongoDB Atlas → Database Access.
2. Rotate/reset the password for that database user immediately.
3. Never commit real `.env` files or paste credentials into chats, tickets,
   or docs — use `.env.example` as a template and keep the real `.env` local
   and gitignored (already set up in this repo).

---

## Project structure

```
connectmeet/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # VideoTile, ControlBar, ChatPanel, etc.
│   │   ├── pages/          # Landing, Login, Workspace, MeetingRoom, etc.
│   │   ├── hooks/          # useWebRTC.js — the WebRTC mesh engine
│   │   ├── context/        # AuthContext
│   │   ├── services/       # api.js (axios), socket.js (socket.io-client)
│   │   └── App.jsx
│   ├── .env.example
│   └── vercel.json
│
├── server/                 # Express + Socket.IO backend
│   ├── config/db.js
│   ├── controllers/        # authController, meetingController, userController
│   ├── models/             # User, Meeting, Message, MeetingHistory, MeetingMemory
│   ├── routes/
│   ├── middleware/         # auth.js (JWT), errorHandler.js
│   ├── sockets/index.js    # WebRTC signaling + chat + presence
│   ├── utils/
│   ├── .env.example
│   └── server.js
│
├── render.yaml              # Backend deploy config for Render
└── README.md
```

---

## Getting started locally

### 1. Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB instance)

### 2. Backend

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN
npm install
npm start          # or: npm run dev (with nodemon)
```

The API runs on `http://localhost:5000` by default. Health check:
`GET http://localhost:5000/api/health`.

### 3. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

### 4. Try it
Open two browser windows (or one normal + one incognito) at
`http://localhost:5173`, register two different accounts, create a meeting
in one, and join it with the meeting ID/link in the other. Camera and mic
permissions will be requested by the browser.

---

## Environment variables

**server/.env**

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_ORIGIN` | Comma-separated allowed CORS origins (your frontend URL) |

**client/.env**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend REST API |
| `VITE_SOCKET_URL` | Base URL of the backend Socket.IO server |

---

## Architecture

### Authentication
- Register/login issue a JWT signed with `JWT_SECRET`.
- The token is stored in `localStorage` on the client and attached as a
  `Bearer` header via an axios interceptor.
- Protected REST routes use `middleware/auth.js`; a 401 anywhere clears the
  stored session and redirects to `/login`.
- The same JWT is used to authenticate the Socket.IO handshake
  (`io.use` middleware in `sockets/index.js`), so signaling and REST share
  one identity.

### Video calling (WebRTC mesh)
```
Browser A                                    Browser B
   |                                              |
   |---- Socket.IO: offer/answer/ICE (signaling)->|
   |<---------------------------------------------|
   |                                               |
   |============ Peer-to-peer media (WebRTC) =====|
```
- `useWebRTC.js` on the client creates one `RTCPeerConnection` per remote
  participant, using Google's public STUN servers for NAT traversal.
- Socket.IO is used **only** for signaling (SDP offers/answers and ICE
  candidates) and presence — actual audio/video never touches the server.
- Screen sharing replaces the outgoing video track on each peer connection
  via `getDisplayMedia()` + `RTCRtpSender.replaceTrack()`.

### Real-time events (Socket.IO)
`room:join`, `room:participants`, `user:joined`, `user:left`,
`webrtc:offer` / `webrtc:answer` / `webrtc:ice-candidate`, `media:status`,
`screen:share`, `chat:message`, `room:leave`.

### Meeting Memory
When a participant leaves a room, the client shows a short modal to capture
**Discussion**, **Decisions**, and **Actions** as free-text lists. These are
saved to the `MeetingMemory` collection (upserted by `meetingId`) and can be
retrieved later via `GET /api/meetings/:meetingId/memory`.

### Data model (MongoDB collections)
- **Users** — name, email, hashed password, meetings completed
- **Meetings** — meetingId, title, host, participants, optional password, status
- **Messages** — meetingId, sender, message, timestamp (in-meeting chat)
- **MeetingHistory** — per-user join/leave records used for the timeline view
- **MeetingMemory** — discussion / decisions / actions per meeting

---

## Deployment

### Frontend → Vercel
1. Import the `client/` directory as a new Vercel project.
2. Framework preset: Vite (auto-detected via `vercel.json`).
3. Set environment variables `VITE_API_URL` and `VITE_SOCKET_URL` to your
   deployed backend's URL.
4. Deploy.

### Backend → Render
1. Create a new Web Service pointed at this repo, root directory `server`
   (a starter `render.yaml` is included at the repo root for Blueprint
   deploys).
2. Build command: `npm install`. Start command: `npm start`.
3. Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` (your Vercel URL) as
   environment variables in the Render dashboard.
4. Deploy, then update the frontend's `VITE_API_URL` / `VITE_SOCKET_URL` to
   point at the Render service URL.

---

## Known limitations / scaling notes

- The WebRTC layer is a **full mesh**, intentionally capped at 4
  participants per room (enforced both client- and server-side). Mesh
  bandwidth/CPU cost grows with each additional peer, so this is not meant
  to scale to large meetings.
- To support larger rooms in the future, swap the mesh in `useWebRTC.js` for
  an SFU (e.g. LiveKit or mediasoup) — the signaling channel, auth, chat,
  and Meeting Memory layers don't need to change.
- Presence state (who's in which room) is kept in server memory
  (`sockets/index.js`); a multi-instance deployment would need to move this
  to Redis or a similar shared store.

---

## Design system

| Token | Hex | Usage |
|---|---|---|
| Obsidian Black | `#0B0B0F` | Background |
| Pearl White | `#F4F1EA` | Primary text |
| Electric Coral | `#FF5C5C` | Actions, live/recording indicators |
| Acid Lime | `#C7FF3D` | Status, online, completed |
| Deep Violet | `#5B2EFF` | Intelligence/AI-adjacent features |
| Graphite | `#25252D` | Secondary surfaces |
