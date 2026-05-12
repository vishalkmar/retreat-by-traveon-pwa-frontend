import { Outlet, useLocation } from 'react-router-dom';
import { Home, ClipboardList, AlertOctagon, User } from 'lucide-react';
import BottomNav from '../components/shell/BottomNav.jsx';

const TABS = [
  { to: '/auditor', label: 'Home', icon: Home, end: true },
  { to: '/auditor/properties', label: 'Audits', icon: ClipboardList },
  { to: '/auditor/objections', label: 'Objections', icon: AlertOctagon },
  { to: '/auditor/profile', label: 'Profile', icon: User },
];

const AuditorLayout = () => {
  const { pathname } = useLocation();
  // Hide bottom nav on deep capture screens to keep focus on the form.
  const showNav = !/\/auditor\/properties\/.+\/(capture|generate-id|sections\/.+)/.test(pathname);
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Outlet />
      {showNav && <BottomNav items={TABS} />}
    </div>
  );
};

export default AuditorLayout;
