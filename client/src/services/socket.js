import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: {
        token: localStorage.getItem('cm_token'),
      },
    });
  }

  return socket;
};

export const connectSocket = () => {
  const s = getSocket();

  s.auth = {
    token: localStorage.getItem('cm_token'),
  };

  if (!s.connected) {
    s.connect();
  }

  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};