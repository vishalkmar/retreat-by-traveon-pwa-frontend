import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, AlertCircle, CheckCircle2, ImagePlus, ChevronRight, FileSignature, Bell } from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import Button from '../../components/ui/Button.jsx';
import StatCardGrid from '../../components/StatCardGrid.jsx';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unread } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingContracts, setPendingContracts] = useState(0);

  useEffect(() => {
    let alive = true;
    api.get('/auditor/properties')
      .then((r) => { if (alive) setItems(r.data?.data?.items || []); })
      .catch((err) => toast.error(apiMessage(err, 'Could not load properties')))
      .finally(() => { if (alive) setLoading(false); });

    api.get('/auditor/contracts')
      .then((r) => { if (alive) setPendingContracts((r.data?.data?.pending || []).length); })
      .catch(() => {});

    return () => { alive = false; };
  }, []);

  const buckets = {
    inRevision: items.filter((p) => ['in_revision', 'phase4_in_revision'].includes(p.status)),
    inFlight: items.filter((p) => ['draft', 'phase1_done', 'phase3_submitted', 'in_review', 'approved', 'phase4_submitted'].includes(p.status)),
    done: items.filter((p) => ['final_approved', 'contract_sent', 'contract_signed', 'completed'].includes(p.status)),
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

        <div className="mt-5">
          <StatCardGrid items={[
            { label: 'In flight',  value: buckets.inFlight.length,   icon: ClipboardList,  iconCls: 'bg-blue-50 text-blue-700',     to: '/auditor/properties' },
            { label: 'Objections', value: buckets.inRevision.length, icon: AlertCircle,    iconCls: 'bg-rose-50 text-rose-700',     to: '/auditor/objections', badge: buckets.inRevision.length > 0 ? buckets.inRevision.length : null },
            { label: 'Approved',   value: buckets.done.length,       icon: CheckCircle2,   iconCls: 'bg-emerald-50 text-emerald-700', to: '/auditor/properties?status=completed' },
            { label: 'Inbox',      value: unread,                    icon: Bell,           iconCls: 'bg-sky-50 text-sky-700',         to: '/auditor/notifications', badge: unread > 0 ? unread : null },
          ]} />
        </div>

        {/* Quick action — incoming contracts awaiting release to owner */}
        <Link
          to="/auditor/contracts"
          className={`mt-4 flex items-center gap-3 rounded-2xl border bg-gradient-to-br from-amber-50 to-white p-4 shadow-card hover:border-amber-300 ${
            pendingContracts > 0 ? 'border-amber-300' : 'border-amber-100'
          }`}
        >
          <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <FileSignature size={20} />
            {pendingContracts > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                {pendingContracts}
              </span>
            )}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-slate-900">
              {pendingContracts > 0 ? 'Contracts to send' : 'Incoming contracts'}
            </span>
            <span className="block text-xs text-slate-500">
              {pendingContracts > 0
                ? `${pendingContracts} contract${pendingContracts > 1 ? 's' : ''} awaiting your release to the owner`
                : 'Review approved contracts before forwarding to owners.'}
            </span>
          </span>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>

        {/* Quick action — final listing images for approved properties */}
        <Link
          to="/auditor/listing-images"
          className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-card hover:border-emerald-300"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <ImagePlus size={20} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-slate-900">Upload listing images</span>
            <span className="block text-xs text-slate-500">
              Add section-tagged photos for any approved property.
            </span>
          </span>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>

        {buckets.inRevision.length > 0 && (
          <Section title="Needs your attention" items={buckets.inRevision} />
        )}
        <Section title="In flight" items={buckets.inFlight} loading={loading} />
        {buckets.done.length > 0 && <Section title="Approved" items={buckets.done} />}
      </main>
    </div>
  );
};

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
