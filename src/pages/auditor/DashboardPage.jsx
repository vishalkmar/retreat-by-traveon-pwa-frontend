import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/auditor/properties')
      .then((r) => { if (alive) setItems(r.data?.data?.items || []); })
      .catch((err) => toast.error(apiMessage(err, 'Could not load properties')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const buckets = {
    inRevision: items.filter((p) => p.status === 'in_revision'),
    inFlight: items.filter((p) => ['draft', 'phase1_done', 'phase3_submitted', 'in_review'].includes(p.status)),
    done: items.filter((p) => ['approved', 'contract_sent', 'contract_signed', 'completed'].includes(p.status)),
  };

  return (
    <div className="app-shell">
      <TopBar title="My Audits" back={false} />
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-card">
          <p className="text-xs uppercase tracking-wider text-brand-100">Welcome back</p>
          <h2 className="mt-1 text-xl font-semibold">{user?.name || 'Auditor'}</h2>
          <p className="mt-1 text-xs text-brand-100">{user?.email}</p>
          <Button
            variant="secondary"
            size="md"
            className="mt-4 w-full bg-white/95 text-brand-800"
            onClick={() => navigate('/auditor/properties/new')}
          >
            <Plus size={16} /> Start a new audit
          </Button>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-2">
          <StatCard icon={ClipboardList} label="In flight" value={buckets.inFlight.length} tone="text-blue-700 bg-blue-50" />
          <StatCard icon={AlertCircle} label="Objections" value={buckets.inRevision.length} tone="text-rose-700 bg-rose-50" />
          <StatCard icon={CheckCircle2} label="Approved" value={buckets.done.length} tone="text-emerald-700 bg-emerald-50" />
        </section>

        {buckets.inRevision.length > 0 && (
          <Section title="Needs your attention" items={buckets.inRevision} />
        )}
        <Section title="In flight" items={buckets.inFlight} loading={loading} />
        {buckets.done.length > 0 && <Section title="Approved" items={buckets.done} />}
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
    <div className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>
      <Icon size={16} />
    </div>
    <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    <p className="text-[11px] text-slate-500">{label}</p>
  </div>
);

const Section = ({ title, items, loading }) => (
  <section className="mt-6">
    <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
      {title}
    </h3>
    {loading ? (
      <p className="mt-2 px-1 text-sm text-slate-400">Loading…</p>
    ) : items.length === 0 ? (
      <p className="mt-2 px-1 text-sm text-slate-400">Nothing here yet.</p>
    ) : (
      <ul className="mt-2 flex flex-col gap-2">
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
                    {p.propertyCode || 'No ID yet'} · {p.ownerName}
                  </p>
                </div>
                <StatusPill status={p.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default DashboardPage;
