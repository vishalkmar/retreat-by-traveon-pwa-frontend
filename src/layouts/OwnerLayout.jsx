import { Outlet } from 'react-router-dom';
import { Home, ClipboardList, Sparkles, User, AlertOctagon } from 'lucide-react';
import BottomNav from '../components/shell/BottomNav.jsx';
import { useOwnerMode } from '../context/OwnerModeContext.jsx';

// The owner app shows a different bottom-nav per mode:
//   - auditor mode: Home / Properties / Profile  (read-only experience over
//     properties an auditor onboarded against this owner's email)
//   - self mode:    Home / Properties / Onboard / Objections / Profile
//     (full Phase 1-4 control over properties the owner self-onboards)
//
// The mode itself is selected from the dashboard's mode toggle.

const NAV_BY_MODE = {
  auditor: [
    { to: '/owner', label: 'Home', icon: Home, end: true },
    { to: '/owner/properties', label: 'Properties', icon: ClipboardList },
    { to: '/owner/profile', label: 'Profile', icon: User },
  ],
  self: [
    { to: '/owner', label: 'Home', icon: Home, end: true },
    { to: '/owner/properties', label: 'Properties', icon: ClipboardList },
    { to: '/owner/self/new', label: 'Onboard', icon: Sparkles },
    { to: '/owner/objections', label: 'Objections', icon: AlertOctagon },
    { to: '/owner/profile', label: 'Profile', icon: User },
  ],
};

const OwnerLayout = () => {
  // We deliberately never hide the bottom nav — the owner should always be
  // able to escape a deep capture screen back to Home / Properties / etc.
  const { mode } = useOwnerMode();
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Outlet />
      <BottomNav items={NAV_BY_MODE[mode] || NAV_BY_MODE.auditor} />
    </div>
  );
};

export default OwnerLayout;
