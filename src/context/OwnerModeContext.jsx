import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

// The owner app runs in one of two modes at a time — either showing the
// properties an auditor onboarded against the owner's email, or the ones
// the owner self-onboarded. We persist the choice in localStorage so a
// page reload keeps the same view. The mode is a UI-only filter: backend
// data for both modes is fetched from the same authenticated owner.

const STORAGE_KEY = 'pwa.owner.mode';
const VALID = new Set(['auditor', 'self']);
const DEFAULT_MODE = 'auditor';

const Ctx = createContext({
  mode: DEFAULT_MODE,
  setMode: () => {},
});

export const OwnerModeProvider = ({ children }) => {
  const { role, user } = useAuth();
  const [mode, setModeState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_MODE;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return VALID.has(saved) ? saved : DEFAULT_MODE;
  });

  // Reset to default on logout so a new owner doesn't inherit the prior
  // session's mode.
  useEffect(() => {
    if (role !== 'owner' || !user) {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    }
  }, [role, user]);

  const setMode = useCallback((next) => {
    if (!VALID.has(next)) return;
    setModeState(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
  }, []);

  return (
    <Ctx.Provider value={{ mode, setMode }}>
      {children}
    </Ctx.Provider>
  );
};

export const useOwnerMode = () => useContext(Ctx);
