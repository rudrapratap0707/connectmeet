import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Manages a full-mesh WebRTC setup for small rooms (2-4 people), using
// Socket.IO purely as the signaling channel. Media itself is peer-to-peer.
export function useWebRTC({ meetingId, name }) {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({}); // socketId -> { stream, name, cameraOn, micOn }
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const peerConnections = useRef({}); // socketId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);

  const createPeerConnection = useCallback((socketId, remoteName) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc:ice-candidate', { to: socketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setPeers((prev) => ({
        ...prev,
        [socketId]: {
          ...(prev[socketId] || { name: remoteName, cameraOn: true, micOn: true }),
          stream: event.streams[0],
        },
      }));
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        removePeer(socketId);
      }
    };

    peerConnections.current[socketId] = pc;
    return pc;
  }, []);

  const removePeer = (socketId) => {
    const pc = peerConnections.current[socketId];
    if (pc) {
      pc.close();
      delete peerConnections.current[socketId];
    }
    setPeers((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        const socket = connectSocket();
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          socket.emit('room:join', { meetingId, name });
        });

        socket.on('room:participants', (list) => {
          list.forEach(({ socketId, name: peerName }) => {
            const pc = createPeerConnection(socketId, peerName);
            setPeers((prev) => ({ ...prev, [socketId]: { ...(prev[socketId] || {}), name: peerName, cameraOn: true, micOn: true } }));
            pc.createOffer()
              .then((offer) => pc.setLocalDescription(offer).then(() => offer))
              .then((offer) => socket.emit('webrtc:offer', { to: socketId, offer }));
          });
        });

        socket.on('user:joined', ({ socketId, name: peerName }) => {
          setPeers((prev) => ({ ...prev, [socketId]: { ...(prev[socketId] || {}), name: peerName, cameraOn: true, micOn: true } }));
        });

        socket.on('webrtc:offer', async ({ from, offer }) => {
          const pc = peerConnections.current[from] || createPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc:answer', { to: from, answer });
        });

        socket.on('webrtc:answer', async ({ from, answer }) => {
          const pc = peerConnections.current[from];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('webrtc:ice-candidate', async ({ from, candidate }) => {
          const pc = peerConnections.current[from];
          if (pc && candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              // ignore benign race errors on candidate add
            }
          }
        });

        socket.on('user:left', ({ socketId }) => removePeer(socketId));

        socket.on('media:status', ({ socketId, cameraOn, micOn }) => {
          setPeers((prev) => ({
            ...prev,
            [socketId]: { ...(prev[socketId] || {}), cameraOn, micOn },
          }));
        });

        socket.on('room:error', ({ message }) => setError(message));
      } catch (err) {
        setError('Could not access camera or microphone. Please check permissions.');
      }
    };

    init();

    return () => {
      active = false;
      const socket = socketRef.current;
      if (socket) {
        socket.emit('room:leave');
        socket.removeAllListeners();
      }
      Object.keys(peerConnections.current).forEach(removePeer);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    getSocket().emit('media:status', { cameraOn: track.enabled, micOn: stream.getAudioTracks()[0]?.enabled ?? true });
    return track.enabled;
  }, []);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const track = stream.getAudioTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    getSocket().emit('media:status', { micOn: track.enabled, cameraOn: stream.getVideoTracks()[0]?.enabled ?? true });
    return track.enabled;
  }, []);

  const shareScreen = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });

      getSocket().emit('screen:share', { sharing: true });

      screenTrack.onended = () => {
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender && camTrack) sender.replaceTrack(camTrack);
        });
        getSocket().emit('screen:share', { sharing: false });
      };

      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const sendChatMessage = useCallback(
    (sender, message) => {
      getSocket().emit('chat:message', { meetingId, sender, message });
    },
    [meetingId]
  );

  return {
    localStream,
    peers,
    connected,
    error,
    toggleCamera,
    toggleMic,
    shareScreen,
    sendChatMessage,
    socket: socketRef.current,
  };
}
