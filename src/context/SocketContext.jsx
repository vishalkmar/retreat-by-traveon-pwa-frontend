import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getSocket, closeSocket } from '../services/socket.js';

// Lifts a single Socket.io connection up to the tree so any screen can
// subscribe via useSocket(). The connection is rebuilt whenever the auth
// token changes (login/logout/role-switch).

const SocketCtx = createContext({ socket: null, connected: false });

export const SocketProvider = ({ children }) => {
  const { user, role } = useAuth();
  const [connected, setConnected] = useState(false);
  const sockRef = useRef(null);

  useEffect(() => {
    if (!user || !role) {
      closeSocket();
      sockRef.current = null;
      setConnected(false);
      return;
    }
    const s = getSocket();
    sockRef.current = s;
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    return () => {
      s.off('connect');
      s.off('disconnect');
    };
  }, [user, role]);

  return (
    <SocketCtx.Provider value={{ socket: sockRef.current, connected }}>
      {children}
    </SocketCtx.Provider>
  );
};

export const useSocket = () => useContext(SocketCtx);

// Helper: join/leave a property room while a component is mounted.
export const usePropertyRoom = (propertyId) => {
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !propertyId) return undefined;
    socket.emit('property:join', propertyId);
    return () => socket.emit('property:leave', propertyId);
  }, [socket, propertyId]);
};
