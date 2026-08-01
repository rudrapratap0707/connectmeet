import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Lock, Pin, Maximize2, Monitor } from 'lucide-react';
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

  // Pinning / Selected Peer State
  const [selectedPeerId, setSelectedPeerId] = useState(null);

  useEffect(() => {
    api
      .get(`/meetings/${meetingId}`)
      .then(({ data }) => setMeetingInfo(data.meeting))
      .catch(() => setMeetingInfo({ notFound: true }))
      .finally(() => setChecking(false));
  }, [meetingId]);

  // Stable WebRTC params
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

  const handleToggleShare = async () => {
    if (sharing) {
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

  // Fullscreen toggle on double click
  const handleDoubleClick = (e) => {
    if (e.currentTarget.requestFullscreen) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        e.currentTarget.requestFullscreen().catch(() => {});
      }
    }
  };

  const peerList = Object.entries(rtc.peers);

  // Key-level deduplication
  const uniquePeers = useMemo(
    () => Array.from(new Map(peerList.map(([id, peer]) => [id, peer])).entries()),
    [peerList]
  );

  // 1. IMPROVEMENT: Reset selectedPeerId if pinned peer leaves the meeting
  useEffect(() => {
    if (selectedPeerId && !uniquePeers.some(([id]) => id === selectedPeerId)) {
      setSelectedPeerId(null);
    }
  }, [uniquePeers, selectedPeerId]);

  // 2. IMPROVEMENT: Screen Share Priority Auto-Focus
  const sharingPeerEntry = useMemo(
    () => uniquePeers.find(([, peer]) => peer.isSharing),
    [uniquePeers]
  );

  const activePeerSocketId = useMemo(() => {
    // Priority A: Local Screen Share
    if (sharing) return 'local-share';
    // Priority B: Remote Peer Screen Share
    if (sharingPeerEntry) return sharingPeerEntry[0];
    // Priority C: User explicitly pinned peer
    if (selectedPeerId && uniquePeers.some(([id]) => id === selectedPeerId)) return selectedPeerId;
    // Priority D: First remote peer
    return uniquePeers[0]?.[0] || null;
  }, [sharing, sharingPeerEntry, selectedPeerId, uniquePeers]);

  const activePeer = useMemo(() => {
    if (activePeerSocketId === 'local-share') return null;
    return uniquePeers.find(([id]) => id === activePeerSocketId)?.[1];
  }, [activePeerSocketId, uniquePeers]);

  // Filmstrip list containing all peers (excluding currently focused peer)
  const gridPeers = useMemo(
    () => uniquePeers.filter(([id]) => id !== activePeerSocketId),
    [uniquePeers, activePeerSocketId]
  );

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

  return (
    <div className="min-h-screen bg-obsidian text-pearl relative flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header */}
      <header className="px-6 py-3 flex items-center justify-between border-b border-pearl/5 bg-graphite/30 backdrop-blur-md">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">
            {meetingInfo?.title || 'ConnectMeet'}
            <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live
            </span>
          </h1>
          <p className="text-xs text-pearl/40">{meetingId}</p>
        </div>
        <div className="text-xs text-pearl/50 flex items-center gap-2">
          <span>🔒 End-to-End Encrypted</span>
        </div>
      </header>

      {rtc.error && (
        <div className="mx-auto max-w-md bg-coral/10 border border-coral/30 text-coral text-xs rounded-lg px-4 py-2 text-center mt-2">
          {rtc.error}
        </div>
      )}

      {/* Main Stage (Google Meet Layout) */}
      <main className="flex-1 flex flex-col p-4 max-w-6xl w-full mx-auto justify-between gap-4 relative">
        {/* Stage Area */}
        <div
          className="flex-1 min-h-[360px] max-h-[580px] relative rounded-2xl overflow-hidden border border-pearl/10 bg-graphite/40 shadow-2xl transition-all duration-300"
          onDoubleClick={handleDoubleClick}
        >
          <VideoTile
            stream={
              sharing
                ? rtc.screenStream || rtc.localStream
                : activePeer
                ? activePeer.stream
                : rtc.localStream
            }
            name={
              sharing
                ? `${user?.name} (Presenting)`
                : activePeer
                ? activePeer.isSharing
                  ? `${activePeer.name} (Presenting)`
                  : activePeer.name
                : `${user?.name} (you)`
            }
            muted={sharing || !activePeer}
            micOn={activePeer ? activePeer.micOn : micOn}
            cameraOn={sharing ? true : activePeer ? activePeer.cameraOn : camOn}
            // 3. IMPROVEMENT: Dynamic speaker highlight (driven by audio activity)
            isSpeaking={activePeer ? Boolean(activePeer.isSpeaking) : Boolean(rtc.isSpeaking)}
            large
          />

          {/* Pin/Presentation Indicator Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-obsidian/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 text-pearl/90 border border-pearl/10">
            {sharing || activePeer?.isSharing ? (
              <>
                <Monitor size={13} className="text-emerald-400 animate-pulse" />
                <span>
                  {sharing ? 'You are presenting' : `${activePeer?.name} is presenting`}
                </span>
              </>
            ) : (
              <>
                <Pin size={12} className="text-coral" />
                <span>{activePeer ? activePeer.name : `${user?.name} (Pinned)`}</span>
              </>
            )}
          </div>

          <div
            className="absolute top-4 right-4 z-10 opacity-0 hover:opacity-100 transition-opacity bg-obsidian/70 backdrop-blur-md p-2 rounded-lg text-pearl/80 cursor-pointer"
            title="Double click video for fullscreen"
          >
            <Maximize2 size={14} />
          </div>
        </div>

        {/* 4. IMPROVEMENT: Google Meet Floating Picture-in-Picture Self Preview */}
        <div className="absolute bottom-20 right-6 z-20 w-44 h-28 rounded-xl overflow-hidden border-2 border-pearl/20 shadow-2xl hover:scale-105 transition-transform cursor-pointer bg-obsidian">
          <VideoTile
            stream={rtc.localStream}
            name={`${user?.name} (You)`}
            muted
            micOn={micOn}
            cameraOn={camOn}
            isSpeaking={Boolean(rtc.isSpeaking)}
          />
        </div>

        {/* Bottom Filmstrip Grid (Remote Peers Only) */}
        <div className="flex items-center justify-center gap-3 overflow-x-auto py-2 px-1 scrollbar-none pr-48">
          {gridPeers.map(([socketId, peer]) => (
            <div
              key={socketId}
              className={`w-36 h-24 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 transform hover:scale-105 ${
                selectedPeerId === socketId ? 'border-coral shadow-lg' : 'border-pearl/10 hover:border-pearl/40'
              }`}
              onClick={() => setSelectedPeerId(socketId)}
              title={`Click to focus on ${peer.name}`}
            >
              <VideoTile
                stream={peer.stream}
                name={peer.name}
                micOn={peer.micOn}
                cameraOn={peer.cameraOn}
                isSpeaking={Boolean(peer.isSpeaking)}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Control Bar */}
      <div className="pb-4">
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
      </div>

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