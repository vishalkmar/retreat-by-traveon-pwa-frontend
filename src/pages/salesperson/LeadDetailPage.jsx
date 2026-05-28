import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Phone, Mail, Calendar, Clock, MessageCircle, AlertCircle,
  CheckCircle2, XOctagon, RotateCcw, Loader2, Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString() : '—');
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString() : '—');

const STATUS_MAP = {
  pending:       { tone: 'bg-amber-100 text-amber-800',     label: 'Pending owner response' },
  owner_yes:     { tone: 'bg-emerald-100 text-emerald-800', label: 'Owner confirmed (Yes)' },
  owner_no:      { tone: 'bg-rose-100 text-rose-800',       label: 'Owner declined (No)' },
  not_converted: { tone: 'bg-slate-100 text-slate-700',     label: 'Not converted' },
  converted:     { tone: 'bg-violet-100 text-violet-800',   label: 'Converted' },
};

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lostReason, setLostReason] = useState('');
  const [showLostForm, setShowLostForm] = useState(false);
  const [showReReqForm, setShowReReqForm] = useState(false);
  const [reqDate, setReqDate] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/salesperson/leads/${id}`);
      setLead(r.data?.data?.lead);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not load lead'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const action = async (url, body, successMsg) => {
    setBusy(true);
    try {
      const r = await api.post(url, body || {});
      setLead(r.data?.data?.lead);
      toast.success(successMsg);
      return r;
    } catch (err) {
      toast.error(apiMessage(err, 'Action failed'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <TopBar title="Lead" />
        <main className="flex-1 grid place-items-center"><Loader2 size={20} className="animate-spin text-emerald-700" /></main>
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="app-shell">
        <TopBar title="Lead" />
        <main className="flex-1 grid place-items-center p-4">
          <p className="text-sm text-rose-600">Lead not found.</p>
        </main>
      </div>
    );
  }

  const status = STATUS_MAP[lead.status] || STATUS_MAP.pending;
  const canMarkLost = ['pending', 'owner_yes', 'owner_no'].includes(lead.status);
  const canReRequest = lead.status === 'owner_no';
  const canMarkWon = lead.status === 'owner_yes';
  const customerPhoneTel = lead.customerPhone?.replace(/\s/g, '');

  return (
    <div className="app-shell">
      <TopBar title={`Lead #${lead.id}`} />
      <main className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
        {/* Header card */}
        <section className="rounded-2xl bg-white p-4 shadow-card border border-slate-100">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{lead.customerName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Submitted {fmtDateTime(lead.createdAt)}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${status.tone}`}>
              {status.label}
            </span>
          </div>

          {lead.iteration > 1 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-800 px-2.5 py-1 text-[11px] font-semibold">
              <RotateCcw size={12} /> Re-request #{lead.iteration}
              {lead.parent && <span className="ml-1 text-sky-500">· prev date {fmtDate(lead.parent.requestedDate)}</span>}
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <a href={`tel:${customerPhoneTel}`} className="inline-flex items-center gap-2 text-slate-700">
              <Phone size={14} className="text-emerald-700" /> {lead.customerPhone}
            </a>
            {lead.customerEmail && (
              <a href={`mailto:${lead.customerEmail}`} className="inline-flex items-center gap-2 text-slate-700 truncate">
                <Mail size={14} className="text-emerald-700" /> <span className="truncate">{lead.customerEmail}</span>
              </a>
            )}
            <span className="inline-flex items-center gap-2 text-slate-700">
              <Calendar size={14} className="text-emerald-700" /> {fmtDate(lead.requestedDate)}
            </span>
          </div>

          {lead.notes && (
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p className="text-[11px] font-semibold uppercase text-slate-500 mb-0.5">Customer note</p>
              {lead.notes}
            </div>
          )}
        </section>

        {/* Package card */}
        {lead.package && (
          <section className="rounded-2xl bg-white p-4 shadow-card border border-slate-100">
            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-1">Package</p>
            <p className="font-semibold text-slate-900">{lead.package.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {lead.package.currency} {Number(lead.package.priceFrom).toLocaleString()} ·{' '}
              {lead.package.durationDays}d / {lead.package.durationNights}n
            </p>
          </section>
        )}

        {/* Owner response card */}
        <section className="rounded-2xl bg-white p-4 shadow-card border border-slate-100">
          <p className="text-[11px] font-semibold uppercase text-slate-500 mb-2">Owner response</p>
          {lead.ownerRespondedAt ? (
            <div>
              <p className="text-sm">
                {lead.status === 'owner_yes' ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Date available
                  </span>
                ) : (
                  <span className="text-rose-700 font-semibold inline-flex items-center gap-1.5">
                    <XOctagon size={15} /> Owner declined the date
                  </span>
                )}
                <span className="ml-2 text-xs text-slate-500">{fmtDateTime(lead.ownerRespondedAt)}</span>
              </p>
              {lead.ownerNote && (
                <p className="mt-2 text-xs text-slate-700 italic border-l-4 border-slate-200 pl-3">
                  {lead.ownerNote}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-amber-700 inline-flex items-center gap-2">
              <Clock size={14} /> Waiting on owner …
            </p>
          )}
        </section>

        {/* Action buttons */}
        {(canMarkLost || canReRequest || canMarkWon) && (
          <section className="rounded-2xl bg-white p-4 shadow-card border border-slate-100 space-y-3">
            <p className="text-[11px] font-semibold uppercase text-slate-500">Actions</p>

            {canReRequest && !showReReqForm && (
              <Button
                size="block"
                variant="primary"
                onClick={() => setShowReReqForm(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                <RotateCcw size={15} /> Request another date
              </Button>
            )}

            {showReReqForm && (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase text-sky-800">Suggest another date</p>
                <input
                  type="date"
                  className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
                  value={reqDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setReqDate(e.target.value)}
                />
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Note for the owner (optional)"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => { setShowReReqForm(false); setReqDate(''); setReqNotes(''); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1 bg-sky-600 hover:bg-sky-700"
                    loading={busy}
                    onClick={async () => {
                      if (!reqDate) { toast.error('Pick a date'); return; }
                      const r = await action(
                        `/salesperson/leads/${lead.id}/request-another-date`,
                        { requestedDate: reqDate, notes: reqNotes },
                        'New date requested',
                      );
                      const newId = r?.data?.data?.lead?.id;
                      setShowReReqForm(false);
                      if (newId && newId !== lead.id) navigate(`/salesperson/leads/${newId}`);
                    }}
                  >
                    Send request
                  </Button>
                </div>
              </div>
            )}

            {canMarkWon && (
              <Button
                size="block"
                variant="primary"
                className="bg-violet-600 hover:bg-violet-700 text-white"
                loading={busy}
                onClick={() => action(`/salesperson/leads/${lead.id}/converted`, {}, 'Marked as converted')}
              >
                <Trophy size={15} /> Mark as converted
              </Button>
            )}

            {canMarkLost && !showLostForm && (
              <Button
                size="block"
                variant="danger"
                onClick={() => setShowLostForm(true)}
              >
                <XOctagon size={15} /> Mark not converted
              </Button>
            )}

            {showLostForm && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase text-rose-800">Reason (required)</p>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="e.g. budget mismatch, customer went silent…"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => { setShowLostForm(false); setLostReason(''); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    className="flex-1"
                    loading={busy}
                    onClick={async () => {
                      if (!lostReason.trim()) { toast.error('Reason is required'); return; }
                      await action(
                        `/salesperson/leads/${lead.id}/not-converted`,
                        { reason: lostReason },
                        'Marked not converted',
                      );
                      setShowLostForm(false);
                      setLostReason('');
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {lead.status === 'not_converted' && lead.lostReason && (
          <section className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
            <p className="text-[11px] font-semibold uppercase text-rose-800 mb-1">Lost reason</p>
            <p className="text-sm text-rose-900">{lead.lostReason}</p>
          </section>
        )}

        {/* Voice call log */}
        {lead.voiceCalls?.length > 0 && (
          <section className="rounded-2xl bg-white p-4 shadow-card border border-slate-100">
            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-2">Voice call activity</p>
            <ul className="space-y-2 text-xs">
              {lead.voiceCalls.map((vc) => (
                <li key={vc.id} className="flex items-center gap-2 text-slate-700">
                  <Phone size={11} className="text-emerald-700" />
                  Called {vc.recipientRole} <span className="text-slate-400">·</span>
                  <span className="font-mono">{vc.recipientPhone}</span>
                  <span className="ml-auto text-slate-400">{fmtDateTime(vc.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Follow-up chain */}
        {lead.followUps?.length > 0 && (
          <section className="rounded-2xl bg-white p-4 shadow-card border border-slate-100">
            <p className="text-[11px] font-semibold uppercase text-slate-500 mb-2">Re-requests from this lead</p>
            <ul className="space-y-1 text-sm">
              {lead.followUps.map((fu) => (
                <li key={fu.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/salesperson/leads/${fu.id}`)}
                    className="text-sky-700 hover:underline"
                  >
                    #{fu.id} · date {fmtDate(fu.requestedDate)} · {fu.status}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

export default LeadDetailPage;
