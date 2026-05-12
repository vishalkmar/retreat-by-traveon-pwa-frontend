import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, getRole, setSession, clearSession } from '../services/api.js';

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(getRole() || null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }
    try {
      const r = await api.get('/auth/me');
      setUser(r.data?.data?.user || null);
      setRole(r.data?.data?.role || getRole());
    } catch {
      clearSession();
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Token from any tab/window — keep state in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'pwa.token' || e.key === 'pwa.role') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const login = (token, nextRole, nextUser) => {
    setSession(token, nextRole);
    setRole(nextRole);
    setUser(nextUser);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthCtx.Provider value={{ user, role, loading, login, logout, refresh, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
