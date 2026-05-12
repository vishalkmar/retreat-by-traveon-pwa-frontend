import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Inbox, RefreshCcw, ClipboardCheck, XOctagon } from 'lucide-react';
import { api } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const TABS_BY_PATH = {
  '/officer': { key: 'new', title: 'New properties', empty: 'No new properties to review', icon: Inbox },
  '/officer/follow-up': { key: 'follow-up', title: 'Follow-up', empty: 'No properties awaiting revision', icon: RefreshCcw },
  '/officer/approved': { key: 'approved', title: 'Approved', empty: 'Nothing approved yet', icon: ClipboardCheck },
  '/officer/rejected': { key: 'rejected', title: 'Final rejected', empty: 'No final rejections', icon: XOctagon },
  '/officer/all': { key: 'all', title: 'All properties', empty: 'You have not been assigned any properties', icon: Inbox },
};

const DashboardPage = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const cfg = TABS_BY_PATH[pathname] || TABS_BY_PATH['/officer'];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/officer/properties', { params: { tab: cfg.key } })
      .then((r) => { if (alive) setItems(r.data?.data?.items || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [cfg.key]);

  return (
    <div className="app-shell">
      <TopBar title={cfg.title} back={false} />
      <main className="flex-1 overflow-y-auto p-3 pb-24">
        {pathname === '/officer' && (
          <section className="mb-4 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-4 text-white shadow-card">
            <p className="text-xs uppercase tracking-wider text-brand-100">Signed in as</p>
            <h2 className="mt-1 truncate text-lg font-semibold">{user?.name}</h2>
            <p className="truncate text-xs text-brand-100">{user?.email}</p>
          </section>
        )}

        {loading ? (
          <LoadingScreen />
        ) : items.length === 0 ? (
          <EmptyState icon={cfg.icon} title={cfg.empty} />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((p) => {
              const objections = (p.reviews || []).filter((r) => r.decision === 'rejected').length;
              const approved = (p.reviews || []).filter((r) => r.decision === 'approved').length;
              const pending = (p.reviews || []).filter((r) => r.decision === 'pending').length;
              return (
                <li key={p.id}>
                  <Link
                    to={`/officer/properties/${p.id}`}
                    className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-card hover:border-brand-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{p.name}</p>
                        <p className="truncate text-xs text-slate-500">{p.propertyCode}</p>
                        <p className="truncate text-xs text-slate-500">by {p.auditor?.name}</p>
                      </div>
                      <StatusPill status={p.status} />
                    </div>
                    <div className="mt-2 flex gap-2 text-[10px]">
                      {approved > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">✓ {approved}</span>}
                      {pending > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">… {pending}</span>}
                      {objections > 0 && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">Obj {objections}</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
