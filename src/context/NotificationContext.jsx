import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';

// Single source of truth for the in-app notification list. The provider
// fetches the latest 50 on login, then patches the list when the server
// pushes `notification:new` over the socket. Components consume it via the
// `useNotifications()` hook (bell icon, dropdown, page list).

const NotificationCtx = createContext({
  items: [],
  unread: 0,
  loading: false,
  refresh: () => {},
  markRead: () => {},
  markAllRead: () => {},
});

export const NotificationProvider = ({ children }) => {
  const { user, role } = useAuth();
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !role) return;
    setLoading(true);
    try {
      const r = await api.get('/notifications');
      setItems(r.data?.data?.items || []);
      setUnread(r.data?.data?.unread || 0);
    } catch {
      /* swallow — bell will just stay at last known state */
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  // Initial fetch + whenever the logged-in user changes.
  useEffect(() => {
    if (!user || !role) {
      setItems([]);
      setUnread(0);
      return;
    }
    refresh();
  }, [user, role, refresh]);

  // Real-time push from the server. Prepend the new notification and bump
  // unread; de-dupe by id so a race can't double-insert.
  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (payload) => {
      const n = payload?.notification;
      if (!n) return;
      setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]));
      if (!n.readAt) setUnread((u) => u + 1);
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [socket]);

  const markRead = useCallback(async (id) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch { /* best-effort */ }
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setUnread(0);
    try {
      await api.post('/notifications/read-all');
    } catch { /* best-effort */ }
  }, []);

  return (
    <NotificationCtx.Provider value={{ items, unread, loading, refresh, markRead, markAllRead }}>
      {children}
    </NotificationCtx.Provider>
  );
};

export const useNotifications = () => useContext(NotificationCtx);
