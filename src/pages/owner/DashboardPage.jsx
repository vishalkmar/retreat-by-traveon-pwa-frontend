import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ClipboardList, ShieldCheck, BellRing, Phone, Calendar,
  CheckCircle2, XOctagon, Loader2, Inbox, ChevronRight, ArrowRight,
  AlertOctagon, FileSignature, Bell,
} from 'lucide-react';
import StatCardGrid from '../../components/StatCardGrid.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useOwnerMode } from '../../context/OwnerModeContext.jsx';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : '—');
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString() : '—');

// The owner home is mode-aware:
//   - Auditor mode: read-only view of properties an auditor onboarded
//     against this owner's email. Same email = same data.
//   - Self mode: full onboarding controls + the owner's own properties.
//
// The mode toggle at the top swaps both the dashboard contents and the
// bottom-nav (handled by OwnerLayout).

const DashboardPage = () => {
  const { user } = useAuth();
  const { mode, setMode } = useOwnerMode();
  const [props, setProps] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);

  // Refetch whenever the mode changes so each tab loads its scoped list.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/owner/properties', { params: { source: mode } })
      .then((r) => { if (alive) setProps(r.data?.data?.items || []); })
      .catch((err) => { if (alive) toast.error(apiMessage(err, 'Could not load')); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [mode]);

  useEffect(() => {
    let alive = true;
    api.get('/owner/leads')
      .then((r) => { if (alive) setLeads(r.data?.data?.items || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingLeads(false); });
    return () => { alive = false; };
  }, []);

  const pendingLeads = leads.filter((l) => l.status === 'pending').length;
  const recentProps = props.slice(0, 5);

  const respondToLead = async (lead, decision, note) => {
    try {
      const r = await api.post(`/owner/leads/${lead.id}/respond`, { decision, note });
      const updated = r.data?.data?.lead;
      setLeads((cur) => cur.map((l) => (l.id === lead.id ? updated : l)));
      toast.success(decision === 'yes' ? 'Marked as available' : 'Marked as not available');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save response'));
    }
  };

  const isSelf = mode === 'self';
  const { unread } = useNotifications();

  // Pre-compute counts for the stats grid below the welcome banner.
  const inProgress = props.filter((p) => !['rejected', 'completed', 'contract_signed'].includes(p.status)).length;
  const awaitingSign = props.filter((p) => p.status === 'contract_sent').length;
  const live = props.filter((p) => p.status === 'completed').length;
  const objections = props.filter((p) => ['in_revision', 'phase4_in_revision'].includes(p.status)).length;

  const stats = isSelf
    ? [
      { label: 'In progress',  value: inProgress,   icon: ClipboardList, iconCls: 'bg-emerald-50 text-emerald-700', to: '/owner/properties' },
      { label: 'Objections',   value: objections,   icon: AlertOctagon,  iconCls: 'bg-rose-50 text-rose-700',       to: '/owner/objections', badge: objections > 0 ? objections : null },
      { label: 'Awaiting sign',value: awaitingSign, icon: FileSignature, iconCls: 'bg-amber-50 text-amber-700',     to: '/owner/properties' },
      { label: 'Live',         value: live,         icon: Sparkles,      iconCls: 'bg-violet-50 text-violet-700',    to: '/owner/properties' },
    ]
    : [
      { label: 'Linked',       value: props.length, icon: ShieldCheck,   iconCls: 'bg-rose-50 text-rose-700',        to: '/owner/properties' },
      { label: 'Awaiting sign',value: awaitingSign, icon: FileSignature, iconCls: 'bg-amber-50 text-amber-700',      to: '/owner/properties' },
      { label: 'Live',         value: live,         icon: Sparkles,      iconCls: 'bg-violet-50 text-violet-700',    to: '/owner/properties' },
      { label: 'Inbox',        value: unread,       icon: Bell,          iconCls: 'bg-sky-50 text-sky-700',          to: '/owner/notifications', badge: unread > 0 ? unread : null },
    ];

  return (
    <div className="app-shell">
      <TopBar title="Owner dashboard" back={false} />
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <section className={`rounded-2xl bg-gradient-to-br p-5 text-white shadow-card ${
          isSelf ? 'from-emerald-500 to-emerald-700' : 'from-rose-500 to-rose-700'
        }`}>
          <p className="text-xs uppercase tracking-wider opacity-80">Welcome</p>
          <h2 className="mt-1 text-xl font-semibold">{user?.name || 'Property Owner'}</h2>
          <p className="mt-1 text-xs opacity-90">{user?.email}</p>
        </section>

        <div className="mt-4">
          <StatCardGrid items={stats} />
        </div>

        <div className="mt-4">
          <ModeSwitcher mode={mode} setMode={setMode} />
        </div>

        {isSelf && (
          <Link
            to="/owner/self/new"
            className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-4 hover:border-emerald-400"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Self-onboard a property</p>
                <p className="text-[11px] text-emerald-700">Run the whole flow yourself — review goes straight to centralize.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-emerald-700" />
          </Link>
        )}

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isSelf ? 'Self-onboarded properties' : 'Auditor-linked properties'}
            </h3>
            <Link to="/owner/properties" className={`text-[11px] font-semibold ${isSelf ? 'text-emerald-700' : 'text-rose-700'}`}>
              See all
            </Link>
          </div>
          {loading ? (
            <div className="grid place-items-center py-8">
              <Loader2 size={20} className={`animate-spin ${isSelf ? 'text-emerald-700' : 'text-rose-700'}`} />
            </div>
          ) : recentProps.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={isSelf ? 'No self-onboarded properties yet' : 'No linked properties yet'}
              detail={
                isSelf
                  ? 'Tap "Self-onboard a property" above to get started.'
                  : `Properties your auditor adds against ${user?.email || 'your email'} will appear here automatically.`
              }
            />
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {recentProps.map((p) => {
                const target = isSelf
                  ? `/owner/self/${p.id}`
                  : (p.propertyCode ? `/owner/properties/${p.propertyCode}` : '#');
                return (
                  <li key={p.id}>
                    <Link
                      to={target}
                      className={`block rounded-2xl border border-slate-100 bg-white p-4 shadow-card ${
                        isSelf ? 'hover:border-emerald-200' : 'hover:border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{p.name}</p>
                          <p className="truncate text-xs text-slate-500">
                            {p.propertyCode || 'No ID yet'}
                          </p>
                        </div>
                        <StatusPill status={p.status} />
                      </div>
                      {p.contract && (
                        <p className="mt-2 text-xs text-slate-500">
                          {p.contract.signedPdfUrl
                            ? 'Signed copy uploaded ✓'
                            : p.contract.sentAt
                              ? 'Awaiting your signature'
                              : 'Contract preparing…'}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-6">
          <h3 className="inline-flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <BellRing size={14} /> Availability requests
            {pendingLeads > 0 && (
              <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white">{pendingLeads}</span>
            )}
          </h3>
          {loadingLeads ? (
            <div className="grid place-items-center py-8">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : leads.length === 0 ? (
            <EmptyState icon={Inbox} title="No requests yet" detail="Customer enquiries will land here." />
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {leads.slice(0, 4).map((lead) => (
                <LeadCard key={lead.id} lead={lead} onRespond={respondToLead} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

const ModeSwitcher = ({ mode, setMode }) => (
  <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-2 shadow-card">
    <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      Switch dashboard mode
    </p>
    <div className="grid grid-cols-2 gap-2">
      <ModeButton
        active={mode === 'auditor'}
        onClick={() => setMode('auditor')}
        icon={ShieldCheck}
        title="Auditor mode"
        desc="Properties added by an auditor against your email."
        activeCls="border-rose-300 bg-rose-50 text-rose-900"
      />
      <ModeButton
        active={mode === 'self'}
        onClick={() => setMode('self')}
        icon={Sparkles}
        title="Self-onboard"
        desc="Properties you onboard yourself."
        activeCls="border-emerald-300 bg-emerald-50 text-emerald-900"
      />
    </div>
  </section>
);

const ModeButton = ({ active, onClick, icon: Icon, title, desc, activeCls }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
      active ? activeCls : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
    }`}
  >
    <div className="flex items-center gap-1.5">
      <Icon size={14} />
      <span className="text-xs font-bold">{title}</span>
      {active && <ArrowRight size={12} className="ml-auto" />}
    </div>
    <p className="mt-1 text-[10px] leading-snug opacity-80">{desc}</p>
  </button>
);

const LeadCard = ({ lead, onRespond }) => {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const respond = async (decision) => {
    setBusy(true);
    await onRespond(lead, decision, note);
    setShowNote(false); setNote('');
    setBusy(false);
  };

  const status = lead.status;
  const isPending = status === 'pending';
  const phoneTel = lead.customerPhone?.replace(/\s/g, '');

  return (
    <li className={`rounded-2xl border bg-white p-4 shadow-card ${isPending ? 'border-amber-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{lead.customerName}</p>
          <p className="truncate text-xs text-slate-500 mt-0.5">{lead.package?.name || 'Package'}</p>
        </div>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          isPending ? 'bg-amber-100 text-amber-800'
          : status === 'owner_yes' ? 'bg-emerald-100 text-emerald-800'
          : status === 'owner_no' ? 'bg-rose-100 text-rose-800'
          : 'bg-slate-100 text-slate-700'
        }`}>
          {isPending ? 'NEW' : status === 'owner_yes' ? 'YES' : status === 'owner_no' ? 'NO' : status.toUpperCase()}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <a href={`tel:${phoneTel}`} className="inline-flex items-center gap-2 text-slate-700 truncate">
          <Phone size={13} className="text-rose-600" /> {lead.customerPhone}
        </a>
        <span className="inline-flex items-center gap-2 text-slate-700">
          <Calendar size={13} className="text-rose-600" /> {fmtDate(lead.requestedDate)}
        </span>
      </div>

      {isPending && !showNote && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="primary" size="md" className="bg-emerald-600 hover:bg-emerald-700 text-white" loading={busy} onClick={() => respond('yes')}>
            <CheckCircle2 size={15} /> Yes
          </Button>
          <Button variant="danger" size="md" onClick={() => setShowNote(true)}>
            <XOctagon size={15} /> No
          </Button>
        </div>
      )}

      {isPending && showNote && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <textarea
            rows={2}
            className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional reason…"
          />
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => { setShowNote(false); setNote(''); }}>Cancel</Button>
            <Button variant="danger" size="md" className="flex-1" loading={busy} onClick={() => respond('no')}>Confirm No</Button>
          </div>
        </div>
      )}

      {!isPending && (
        <p className="mt-3 text-[11px] text-slate-500">
          Responded {fmtDateTime(lead.ownerRespondedAt)}
          {lead.ownerNote ? ` · "${lead.ownerNote}"` : ''}
        </p>
      )}
    </li>
  );
};

export default DashboardPage;
