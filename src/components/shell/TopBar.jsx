import { ArrowLeft, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationBell from '../NotificationBell.jsx';

const TopBar = ({ title, back, action }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, role } = useAuth();

  // Hide back arrow on the role's root screen.
  const showBack = back ?? !['/auditor', '/officer', '/owner', '/'].includes(location.pathname);
  // Suppress the bell inside the notifications page itself to avoid infinite
  // self-navigation, and on the public landing screen.
  const onNotificationsPage = /\/(auditor|officer|owner|salesperson)\/notifications$/.test(location.pathname);
  const showBell = role && !onNotificationsPage;

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-white px-3 py-3 safe-top">
      {showBack ? (
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-slate-700 hover:bg-slate-100"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
      ) : (
        <div className="h-9 w-9" />
      )}
      <h1 className="flex-1 truncate text-base font-semibold text-slate-900">{title}</h1>
      {showBell && <NotificationBell />}
      {action || (
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="rounded-full p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      )}
    </header>
  );
};

export default TopBar;
