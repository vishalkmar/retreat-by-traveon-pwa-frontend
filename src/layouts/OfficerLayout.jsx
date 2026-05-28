import { Outlet } from 'react-router-dom';
import { Inbox, RefreshCcw, ClipboardCheck, XOctagon, User, Layers, FileSignature } from 'lucide-react';
import BottomNav from '../components/shell/BottomNav.jsx';

const TABS = [
  { to: '/officer', label: 'New', icon: Inbox, end: true },
  { to: '/officer/phase4', label: 'Phase 4', icon: Layers },
  { to: '/officer/contracts', label: 'Contracts', icon: FileSignature },
  { to: '/officer/follow-up', label: 'Follow-up', icon: RefreshCcw },
  { to: '/officer/approved', label: 'Approved', icon: ClipboardCheck },
  { to: '/officer/rejected', label: 'Rejected', icon: XOctagon },
  { to: '/officer/profile', label: 'Profile', icon: User },
];

const OfficerLayout = () => (
  // Bottom nav stays visible across every officer screen — including deep
  // review and Phase 4 — so the officer can jump tabs without back-stepping.
  <div className="flex min-h-[100dvh] flex-col">
    <Outlet />
    <BottomNav items={TABS} />
  </div>
);

export default OfficerLayout;
