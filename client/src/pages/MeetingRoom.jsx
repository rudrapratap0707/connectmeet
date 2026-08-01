import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

  const webrtc = useMemo(() => (joined ? null : null), [joined]); // placeholder to satisfy linter ordering
  const rtc = useWebRTC(joined ? { meetingId, name: user?.name } : { meetingId: null, name: null });

  useEffect(() => {
    if (!joined || !rtc.socket) return;
    const handler = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!chatOpen) setUnreadChat((c) => c + 1);
    };
    rtc.socket.on('chat:message', handler);
    return () => rtc.socket.off('chat:message', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, rtc.socket]);

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
  const handleToggleShare = async () => {
    const ok = await rtc.shareScreen();
    if (ok) setSharing(true);
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
  const activePeer = peerList[0];

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
        {/* Center: active speaker */}
        <div className="max-w-2xl mx-auto mb-8">
          <VideoTile
            stream={activePeer ? activePeer[1].stream : rtc.localStream}
            name={activePeer ? activePeer[1].name : `${user?.name} (you)`}
            muted={!activePeer}
            micOn={activePeer ? activePeer[1].micOn : micOn}
            cameraOn={activePeer ? activePeer[1].cameraOn : camOn}
            isSpeaking
            large
          />
        </div>

        {/* Around: participant cards */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="w-32">
            <VideoTile stream={rtc.localStream} name={`${user?.name} (you)`} muted micOn={micOn} cameraOn={camOn} />
          </div>
          {peerList.map(([socketId, peer]) => (
            <div className="w-32" key={socketId}>
              <VideoTile stream={peer.stream} name={peer.name} micOn={peer.micOn} cameraOn={peer.cameraOn} />
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
            ...peerList.map(([, p]) => ({ name: p.name, micOn: p.micOn, cameraOn: p.cameraOn })),
          ]}
          selfName={user?.name}
          onClose={() => setPeopleOpen(false)}
        />
      )}

      {showMemory && <MeetingMemoryModal onSave={finishLeave} onSkip={() => finishLeave()} />}
    </div>
  );
}
