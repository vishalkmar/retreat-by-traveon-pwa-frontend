import { Outlet } from 'react-router-dom';
import { Home, ClipboardList, AlertOctagon, User } from 'lucide-react';
import BottomNav from '../components/shell/BottomNav.jsx';

const TABS = [
  { to: '/auditor', label: 'Home', icon: Home, end: true },
  { to: '/auditor/properties', label: 'Audits', icon: ClipboardList },
  { to: '/auditor/objections', label: 'Objections', icon: AlertOctagon },
  { to: '/auditor/profile', label: 'Profile', icon: User },
];

const AuditorLayout = () => (
  // Bottom nav is always visible so the auditor can switch tabs even from
  // inside a deep capture/section screen.
  <div className="flex min-h-[100dvh] flex-col">
    <Outlet />
    <BottomNav items={TABS} />
  </div>
);

export default AuditorLayout;
