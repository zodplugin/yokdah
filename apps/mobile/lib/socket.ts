import { io } from 'socket.io-client';
import { getBaseUrl } from './api';

const socket = io(getBaseUrl(), {
  autoConnect: false,
  transports: ['websocket'],
});

export const connectSocket = (userId: string) => {
  if (!socket.connected) {
    socket.auth = { userId };
    socket.connect();
    console.log('Socket connecting...');
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('Socket disconnected');
  }
};

export default socket;
