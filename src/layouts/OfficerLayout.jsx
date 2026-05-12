import { Outlet, useLocation } from 'react-router-dom';
import { Inbox, RefreshCcw, ClipboardCheck, XOctagon, User } from 'lucide-react';
import BottomNav from '../components/shell/BottomNav.jsx';

const TABS = [
  { to: '/officer', label: 'New', icon: Inbox, end: true },
  { to: '/officer/follow-up', label: 'Follow-up', icon: RefreshCcw },
  { to: '/officer/approved', label: 'Approved', icon: ClipboardCheck },
  { to: '/officer/rejected', label: 'Final rejected', icon: XOctagon },
  { to: '/officer/profile', label: 'Profile', icon: User },
];

const OfficerLayout = () => {
  const { pathname } = useLocation();
  // Hide bottom nav on the deep review screen so reviewers can focus.
  const showNav = !/\/officer\/properties\/.+/.test(pathname);
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Outlet />
      {showNav && <BottomNav items={TABS} />}
    </div>
  );
};

export default OfficerLayout;
