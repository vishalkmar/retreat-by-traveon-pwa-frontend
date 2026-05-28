import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Inbox, CheckCircle2, XOctagon, Trophy, ChevronRight, Phone, Calendar,
  Clock, AlertCircle, Loader2, MessageCircle,
} from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import TopBar from '../../components/shell/TopBar.jsx';
import toast from 'react-hot-toast';

const TAB_BY_PATH = {
  '/salesperson':      'pending',
  '/salesperson/yes':  'owner_yes',
  '/salesperson/lost': 'not_converted',
  '/salesperson/won':  'converted',
};

const TAB_TITLE = {
  pending:        { title: 'Pending leads',  icon: Inbox },
  owner_yes:      { title: 'Confirmed',      icon: CheckCircle2 },
  not_converted:  { title: 'Not converted',  icon: XOctagon },
  converted:      { title: 'Converted',      icon: Trophy },
};

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : '—');
const fmtRelative = (v) => {
  if (!v) return '';
  const d = new Date(v);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return `${Math.floor(diff / 86400)} d ago`;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const statusFilter = TAB_BY_PATH[pathname] || 'pending';
  // owner_no leads are folded into the "pending" tab so the salesperson can
  // re-request another date from there.
  const statusesToFetch = statusFilter === 'pending' ? ['pending', 'owner_no'] : [statusFilter];

  const [items, setItems] = useState([]);
  const [buckets, setBuckets] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        statusesToFetch.map((s) => api.get('/salesperson/leads', { params: { status: s } })),
      );
      const merged = results.flatMap((r) => r.data?.data?.items || []);
      // De-dupe in case of overlap and sort by created date desc
      const seen = new Set();
      const unique = merged.filter((l) => {
        if (seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(unique);
      setBuckets(results[0]?.data?.data?.buckets || {});
    } catch (err) {
      toast.error(apiMessage(err, 'Could not load leads'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pathname]);

  const cfg = TAB_TITLE[statusFilter];

  return (
    <div className="app-shell">
      <TopBar title="Sales leads" back={false} />
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <section className="rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-900 p-5 text-white shadow-card">
          <p className="text-xs uppercase tracking-wider text-emerald-100">Welcome back</p>
          <h2 className="mt-1 text-xl font-semibold">{user?.name || 'Salesperson'}</h2>
          <p className="mt-1 text-xs text-emerald-100">{user?.email}</p>
        </section>

        <section className="mt-5 grid grid-cols-4 gap-2">
          <StatCard tone="text-amber-700 bg-amber-50"   icon={Inbox}        label="Pending" value={(buckets.pending || 0) + (buckets.owner_no || 0)} />
          <StatCard tone="text-emerald-700 bg-emerald-50" icon={CheckCircle2} label="Confirmed" value={buckets.owner_yes || 0} />
          <StatCard tone="text-rose-700 bg-rose-50"     icon={XOctagon}     label="Lost"   value={buckets.not_converted || 0} />
          <StatCard tone="text-violet-700 bg-violet-50" icon={Trophy}       label="Won"    value={buckets.converted || 0} />
        </section>

        <h3 className="mt-6 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          {cfg && <cfg.icon size={14} />} {cfg?.title}
        </h3>
        {loading ? (
          <div className="grid place-items-center py-10">
            <Loader2 size={20} className="animate-spin text-emerald-700" />
          </div>
        ) : items.length === 0 ? (
          <p className="mt-3 px-1 text-sm text-slate-400">No leads here yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {items.map((lead) => <LeadRow key={lead.id} lead={lead} />)}
          </ul>
        )}
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

const StatusBadge = ({ status }) => {
  const map = {
    pending:       { tone: 'bg-amber-100 text-amber-800',     label: 'Pending' },
    owner_yes:     { tone: 'bg-emerald-100 text-emerald-800', label: 'Owner: Yes' },
    owner_no:      { tone: 'bg-rose-100 text-rose-800',       label: 'Owner: No' },
    not_converted: { tone: 'bg-slate-100 text-slate-700',     label: 'Not converted' },
    converted:     { tone: 'bg-violet-100 text-violet-800',   label: 'Converted' },
  };
  const c = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.tone}`}>
      {c.label}
    </span>
  );
};

const LeadRow = ({ lead }) => (
  <li>
    <Link
      to={`/salesperson/leads/${lead.id}`}
      className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-card hover:border-emerald-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="truncate font-semibold text-slate-900">{lead.customerName}</p>
            {lead.iteration > 1 && (
              <span className="rounded-full bg-sky-100 text-sky-800 px-1.5 py-0.5 text-[9px] font-bold">
                RE-REQ #{lead.iteration}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1"><Phone size={11} /> {lead.customerPhone}</span>
            <span className="inline-flex items-center gap-1"><Calendar size={11} /> {fmtDate(lead.requestedDate)}</span>
            <span className="inline-flex items-center gap-1"><Clock size={11} /> {fmtRelative(lead.createdAt)}</span>
          </div>
          {lead.package?.name && (
            <p className="mt-1 truncate text-xs text-slate-700">
              <span className="text-slate-400">Package:</span> {lead.package.name}
            </p>
          )}
        </div>
        <StatusBadge status={lead.status} />
      </div>
      <div className="mt-2 flex items-center justify-end text-emerald-700 text-xs font-semibold">
        View <ChevronRight size={14} />
      </div>
    </Link>
  </li>
);

export default DashboardPage;
