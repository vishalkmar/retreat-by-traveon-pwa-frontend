import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Sparkles, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import { api } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import PhaseTracker from '../../components/PhaseTracker.jsx';
import { useOwnerMode } from '../../context/OwnerModeContext.jsx';

// Properties list scoped to the active owner mode:
//   - Self mode    → owner is the auditor of their own property, so the
//                    full status pipeline tabs (All / Active / Following up
//                    / Objections / Pending review / Completed / Rejected)
//                    mirror what the auditor UI shows.
//   - Auditor mode → properties an auditor onboarded against this owner's
//                    email. The owner can't do audit work here, so we only
//                    surface lifecycle buckets that affect them.

const SELF_TABS = [
  { key: 'all',            label: 'All' },
  { key: 'active',         label: 'Active' },
  { key: 'pending_review', label: 'Pending review' },
  { key: 'following',      label: 'Following up' },
  { key: 'objections',     label: 'Objections' },
  { key: 'completed',      label: 'Completed' },
  { key: 'rejected',       label: 'Rejected' },
];

const AUDITOR_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'In progress' },
  { key: 'completed', label: 'Contract' },
  { key: 'rejected',  label: 'Rejected' },
];

const PropertiesListPage = () => {
  const { mode, setMode } = useOwnerMode();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('all');

  // Reset to "all" whenever the user flips between modes so an unfamiliar
  // tab from the other mode isn't carried over.
  useEffect(() => { setStatusTab('all'); }, [mode]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = { source: mode };
    if (statusTab !== 'all') params.status = statusTab;
    api.get('/owner/properties', { params })
      .then((r) => { if (alive) setItems(r.data?.data?.items || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [mode, statusTab]);

  const isSelf = mode === 'self';
  const tabs = isSelf ? SELF_TABS : AUDITOR_TABS;

  return (
    <div className="app-shell">
      <TopBar title={isSelf ? 'Self-onboarded' : 'Auditor-linked'} back={false} />

      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-3 py-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
          isSelf ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
        }`}>
          {isSelf ? <Sparkles size={12} /> : <ShieldCheck size={12} />}
          {isSelf ? 'Self mode' : 'Auditor mode'}
        </span>
        <button
          type="button"
          onClick={() => setMode(isSelf ? 'auditor' : 'self')}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          <ArrowLeftRight size={12} /> Switch to {isSelf ? 'auditor' : 'self'} mode
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-white px-2 py-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatusTab(t.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusTab === t.key
                ? isSelf ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-3 pb-24">
        {isSelf && statusTab === 'all' && (
          <Link
            to="/owner/self/new"
            className="mb-3 flex items-center justify-between rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-4 hover:border-emerald-400"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Self-onboard a property</p>
                <p className="text-[11px] text-emerald-700">Review goes straight to centralize.</p>
              </div>
            </div>
          </Link>
        )}

        {loading ? (
          <LoadingScreen />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={
              statusTab === 'all'
                ? (isSelf ? 'No self-onboarded properties yet' : 'Nothing linked yet')
                : `No properties in "${tabs.find((t) => t.key === statusTab)?.label}"`
            }
            detail={
              isSelf
                ? 'Tap "Self-onboard a property" above to get started.'
                : 'When your auditor onboards a property against your email, it will appear here automatically.'
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((p) => {
              const target = isSelf
                ? `/owner/self/${p.id}`
                : (p.propertyCode ? `/owner/properties/${p.propertyCode}` : null);
              const card = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {p.propertyCode || 'No ID yet'}
                      </p>
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                  <div className="mt-3">
                    <PhaseTracker role={isSelf ? 'owner-self' : 'owner'} propertyId={p.id} propertyCode={p.propertyCode} status={p.status} />
                  </div>
                </>
              );
              return (
                <li key={p.id}>
                  {target ? (
                    <Link
                      to={target}
                      className={`block rounded-2xl border border-slate-100 bg-white p-4 shadow-card ${
                        isSelf ? 'hover:border-emerald-200' : 'hover:border-rose-200'
                      }`}
                    >
                      {card}
                    </Link>
                  ) : (
                    <div className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-card opacity-90">
                      {card}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default PropertiesListPage;
