import { useAuth } from '../../context/AuthContext.jsx';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';

const ProfilePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <TopBar title="Profile" back={false} />
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <section className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-xl font-semibold text-rose-800">
            {(user?.name || '?').slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{user?.name || 'Owner'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            {user?.phone && <p className="truncate text-xs text-slate-500">{user.phone}</p>}
            <p className="mt-1 text-[11px] uppercase tracking-wider text-rose-700">Property Owner</p>
          </div>
        </section>

        <Button variant="danger" size="block" onClick={logout} className="mt-8">
          Sign out
        </Button>
      </main>
    </div>
  );
};

export default ProfilePage;
