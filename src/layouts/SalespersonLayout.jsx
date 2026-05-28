import { Outlet } from 'react-router-dom';
import { Inbox, CheckCircle2, XOctagon, Trophy, User } from 'lucide-react';
import BottomNav from '../components/shell/BottomNav.jsx';

const TABS = [
  { to: '/salesperson', label: 'Pending', icon: Inbox, end: true },
  { to: '/salesperson/yes', label: 'Confirmed', icon: CheckCircle2 },
  { to: '/salesperson/lost', label: 'Not converted', icon: XOctagon },
  { to: '/salesperson/won', label: 'Converted', icon: Trophy },
  { to: '/salesperson/profile', label: 'Profile', icon: User },
];

const SalespersonLayout = () => (
  // Bottom nav is always visible so the salesperson can flip tabs from
  // inside a lead detail without back-stepping.
  <div className="flex min-h-[100dvh] flex-col">
    <Outlet />
    <BottomNav items={TABS} />
  </div>
);

export default SalespersonLayout;
