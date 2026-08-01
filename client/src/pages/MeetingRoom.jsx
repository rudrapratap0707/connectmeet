import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Lock } from 'lucide-react';
import VideoTile from '../components/VideoTile.jsx';
import ControlBar from '../components/ControlBar.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import ParticipantsPanel from '../components/ParticipantsPanel.jsx';
import MeetingMemoryModal from '../components/MeetingMemoryModal.jsx';
import { useWebRTC } from '../hooks/useWebRTC.js';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

export default function MeetingRoom() {
  const { meetingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meetingInfo, setMeetingInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [joined, setJoined] = useState(false);
  const [checking, setChecking] = useState(true);
  const [joining, setJoining] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [showMemory, setShowMemory] = useState(false);

  useEffect(() => {
    api
      .get(`/meetings/${meetingId}`)
      .then(({ data }) => setMeetingInfo(data.meeting))
      .catch(() => setMeetingInfo({ notFound: true }))
      .finally(() => setChecking(false));
  }, [meetingId]);

  // FIX 1: Stable WebRTC hook instantiation without creating new object reference every render
  const rtcParams = useMemo(
    () => ({
      meetingId: joined ? meetingId : null,
      name: joined ? user?.name : null,
    }),
    [joined, meetingId, user?.name]
  );

  const rtc = useWebRTC(rtcParams);

  useEffect(() => {
    if (!joined || !rtc.socket) return;
    const handler = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!chatOpen) setUnreadChat((c) => c + 1);
    };
    rtc.socket.on('chat:message', handler);
    return () => rtc.socket.off('chat:message', handler);
  }, [joined, rtc.socket, chatOpen]);

  useEffect(() => {
    if (chatOpen) setUnreadChat(0);
  }, [chatOpen]);

  useEffect(() => {
    if (!joined) return;
    api.get(`/meetings/${meetingId}/messages`).then(({ data }) => setMessages(data.messages)).catch(() => {});
  }, [joined, meetingId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/meetings/${meetingId}/join`, { password: password || undefined });
      setJoined(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not join meeting');
    } finally {
      setJoining(false);
    }
  };

  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);

  const handleToggleCamera = () => setCamOn(rtc.toggleCamera());
  const handleToggleMic = () => setMicOn(rtc.toggleMic());

  // FIX 2: Correct Screen share toggle state tracking
  const handleToggleShare = async () => {
    if (sharing) {
      // User clicked stop sharing
      setSharing(false);
      return;
    }
    const ok = await rtc.shareScreen();
    setSharing(Boolean(ok));
  };

  const handleSend = (text) => rtc.sendChatMessage(user?.name, text);
  const handleLeave = () => setShowMemory(true);

  const finishLeave = async ({ discussion = [], decisions = [], actions = [] } = {}) => {
    try {
      if (discussion.length || decisions.length || actions.length) {
        await api.post(`/meetings/${meetingId}/memory`, { discussion, decisions, actions });
      }
    } catch {
      // best-effort save
    }
    navigate('/workspace');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-obsidian text-pearl flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (meetingInfo?.notFound) {
    return (
      <div className="min-h-screen bg-obsidian text-pearl flex flex-col items-center justify-center gap-3">
        <p className="text-lg font-semibold">Meeting not found</p>
        <button onClick={() => navigate('/join')} className="text-coral hover:underline text-sm">
          Try another meeting ID
        </button>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-obsidian text-pearl flex flex-col items-center justify-center px-6">
        <div className="glass-panel rounded-xl2 p-8 w-full max-w-sm shadow-panel text-center">
          <h1 className="text-xl font-bold">{meetingInfo?.title || 'Meeting'}</h1>
          <p className="text-xs text-pearl/40 mt-1">Hosted by {meetingInfo?.host || 'a teammate'}</p>

          {meetingInfo?.hasPassword && (
            <div className="mt-5 text-left">
              <label className="text-xs text-pearl/50 mb-1 flex items-center gap-1">
                <Lock size={12} /> Meeting password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-graphite/70 border border-pearl/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-coral"
              />
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={joining}
            className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-coral text-obsidian font-semibold hover:brightness-110 transition disabled:opacity-60"
          >
            {joining && <Loader2 size={16} className="animate-spin" />}
            Join now
          </button>
        </div>
      </div>
    );
  }

  const peerList = Object.entries(rtc.peers);

  // Deduplicate peers by key (socketId)
  const uniquePeers = Array.from(
    new Map(peerList.map(([id, peer]) => [id, peer])).entries()
  );

  // Active remote peer (if someone else is in room)
  const activePeerEntry = uniquePeers[0];
  const activePeerSocketId = activePeerEntry ? activePeerEntry[0] : null;
  const activePeer = activePeerEntry ? activePeerEntry[1] : null;

  // Grid list filter: excludes activePeer from grid to avoid duplicate tiles
  const gridPeers = uniquePeers.filter(
    ([id]) => id !== activePeerSocketId
  );

  return (
    <div className="min-h-screen bg-obsidian text-pearl relative pb-32">
      <header className="px-6 py-5 text-center">
        <h1 className="text-lg font-bold">{meetingInfo?.title}</h1>
        <p className="text-xs text-pearl/40 mt-0.5">{meetingId}</p>
      </header>

      {rtc.error && (
        <div className="mx-auto max-w-md bg-coral/10 border border-coral/30 text-coral text-sm rounded-lg px-4 py-3 text-center mb-6">
          {rtc.error}
        </div>
      )}

      <main className="px-6 max-w-5xl mx-auto">
        {/* Main Stage: Shows active remote peer or local user if alone */}
        <div className="max-w-2xl mx-auto mb-8">
          <VideoTile
            stream={activePeer ? activePeer.stream : rtc.localStream}
            name={activePeer ? activePeer.name : `${user?.name} (you)`}
            muted={!activePeer}
            micOn={activePeer ? activePeer.micOn : micOn}
            cameraOn={activePeer ? activePeer.cameraOn : camOn}
            isSpeaking
            large
          />
        </div>

        {/* FIX 3: No duplicates - Grid includes non-active peers + local user */}
        <div className="flex flex-wrap justify-center gap-4">
          {/* Always show local user in grid when someone else is on stage */}
          {activePeer && (
            <div className="w-32">
              <VideoTile
                stream={rtc.localStream}
                name={`${user?.name} (you)`}
                muted
                micOn={micOn}
                cameraOn={camOn}
              />
            </div>
          )}

          {/* Render remaining peers */}
          {gridPeers.map(([socketId, peer]) => (
            <div className="w-32" key={socketId}>
              <VideoTile
                stream={peer.stream}
                name={peer.name}
                micOn={peer.micOn}
                cameraOn={peer.cameraOn}
              />
            </div>
          ))}
        </div>
      </main>

      <ControlBar
        micOn={micOn}
        cameraOn={camOn}
        sharing={sharing}
        chatOpen={chatOpen}
        peopleOpen={peopleOpen}
        unreadChat={unreadChat}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleShare={handleToggleShare}
        onToggleChat={() => {
          setChatOpen((v) => !v);
          setPeopleOpen(false);
        }}
        onTogglePeople={() => {
          setPeopleOpen((v) => !v);
          setChatOpen(false);
        }}
        onLeave={handleLeave}
      />

      {chatOpen && (
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          onClose={() => setChatOpen(false)}
          selfName={user?.name}
        />
      )}

      {peopleOpen && (
        <ParticipantsPanel
          participants={[
            { name: `${user?.name}`, micOn, cameraOn: camOn, isHost: false },
            ...uniquePeers.map(([, p]) => ({ name: p.name, micOn: p.micOn, cameraOn: p.cameraOn })),
          ]}
          selfName={user?.name}
          onClose={() => setPeopleOpen(false)}
        />
      )}

      {showMemory && <MeetingMemoryModal onSave={finishLeave} onSkip={() => finishLeave()} />}
    </div>
  );
}