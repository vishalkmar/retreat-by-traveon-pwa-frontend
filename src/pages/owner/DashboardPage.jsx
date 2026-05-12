import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, FileSignature, LogOut } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const DashboardPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/owner/properties')
      .then((r) => { if (alive) setItems(r.data?.data?.items || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="app-shell">
      <TopBar title="My Properties" back={false} />
      <main className="flex-1 overflow-y-auto p-4 pb-12">
        <section className="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-5 text-white shadow-card">
          <p className="text-xs uppercase tracking-wider text-rose-100">Welcome</p>
          <h2 className="mt-1 text-xl font-semibold">{user?.name || 'Property Owner'}</h2>
          <p className="mt-1 text-xs text-rose-100">{user?.email}</p>
        </section>

        <h3 className="mt-6 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Contracts</h3>
        {loading ? (
          <LoadingScreen />
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title="Nothing here yet"
            detail="When your property is approved, the contract will appear here."
          />
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {items.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/owner/properties/${p.propertyCode}`}
                  className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-card hover:border-rose-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">{p.propertyCode}</p>
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {p.contract?.signedPdfUrl
                      ? 'Signed copy uploaded ✓'
                      : p.contract?.sentAt
                      ? 'Awaiting your signature'
                      : 'Contract preparing…'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
