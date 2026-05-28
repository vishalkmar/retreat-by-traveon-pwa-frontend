import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

// Lives inside TopBar. Routes the user to their role-specific notifications
// page; the badge shows up only while there are unread items so finalized
// users don't see a persistent red dot.

const ROUTE_BY_ROLE = {
  auditor: '/auditor/notifications',
  officer: '/officer/notifications',
  owner: '/owner/notifications',
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { unread } = useNotifications();
  const target = ROUTE_BY_ROLE[role];
  if (!target) return null;
  return (
    <button
      type="button"
      onClick={() => navigate(target)}
      className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
      aria-label="Notifications"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
