import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getSocket, closeSocket } from '../services/socket.js';

// Lifts a single Socket.io connection up to the tree so any screen can
// subscribe via useSocket(). The connection is rebuilt whenever the auth
// token changes (login/logout/role-switch). We store the socket in state so
// consumers re-render the moment it is available — a ref would silently
// hand them `null` on the first mount.

const SocketCtx = createContext({ socket: null, connected: false });

export const SocketProvider = ({ children }) => {
  const { user, role } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user || !role) {
      closeSocket();
      setSocket(null);
      setConnected(false);
      return undefined;
    }
    const s = getSocket();
    setSocket(s);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setConnected(true);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [user, role]);

  return (
    <SocketCtx.Provider value={{ socket, connected }}>
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
