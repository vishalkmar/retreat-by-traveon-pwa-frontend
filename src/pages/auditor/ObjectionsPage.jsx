import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';
import { api } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const ObjectionsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/auditor/properties', { params: { status: 'objections' } })
      .then((r) => { if (alive) setItems(r.data?.data?.items || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="app-shell">
      <TopBar title="Objections" back={false} />
      <main className="flex-1 overflow-y-auto p-3 pb-24">
        {loading ? (
          <LoadingScreen />
        ) : items.length === 0 ? (
          <EmptyState icon={AlertOctagon} title="No objections" detail="Nothing flagged by an officer right now." />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((p) => {
              const objections = (p.reviews || []).filter((r) => r.decision === 'rejected');
              return (
                <li key={p.id}>
                  <Link
                    to={`/auditor/properties/${p.id}`}
                    className="block rounded-2xl border border-rose-100 bg-white p-4 shadow-card hover:border-rose-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{p.name}</p>
                        <p className="truncate text-xs text-slate-500">{p.propertyCode}</p>
                      </div>
                      <StatusPill status={p.status} />
                    </div>
                    {objections.length > 0 && (
                      <p className="mt-2 text-xs text-rose-700">
                        {objections.length} objection{objections.length > 1 ? 's' : ''} need follow-up.
                      </p>
                    )}
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

export default ObjectionsPage;
