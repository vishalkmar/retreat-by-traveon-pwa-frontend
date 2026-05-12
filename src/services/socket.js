import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config.js';
import { getToken } from './api.js';

let socket = null;

export const getSocket = () => {
  if (socket && socket.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
