import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { api } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'following', label: 'Following up' },
  { key: 'objections', label: 'Objections' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Final rejected' },
];

const PropertiesListPage = () => {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/auditor/properties', { params: tab === 'all' ? {} : { status: tab } })
      .then((r) => { if (alive) setItems(r.data?.data?.items || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tab]);

  return (
    <div className="app-shell">
      <TopBar title="My Audits" back={false} />
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-white px-2 py-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === t.key ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <main className="flex-1 overflow-y-auto p-3 pb-24">
        {loading ? (
          <LoadingScreen />
        ) : items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nothing here yet" detail="Switch tabs or start a new audit." />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/auditor/properties/${p.id}`}
                  className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-card hover:border-brand-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {p.propertyCode || 'No ID'} · {p.ownerName}
                      </p>
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default PropertiesListPage;
