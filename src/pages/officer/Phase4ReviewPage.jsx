import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layers, ChevronDown, ChevronUp, Check, X, Loader2, Trophy,
  AlertCircle, ArrowLeft, ShieldCheck, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';

/*
  Officer-side Phase 4 review. Reads the same schema as the auditor so the
  presentation is consistent. Officer can:
   - approve each section individually
   - reject a section with feedback (auditor sees this in objections)
   - send the whole submission back for revision (PHASE4_IN_REVISION)
   - final-approve once every required section is approved
     → contract PDF gets generated and Task-3 flow takes over
*/

const formatValue = (field, value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (field.type === 'bool') return value ? 'Yes' : 'No';
  if (field.type === 'multi') return Array.isArray(value) ? value.join(', ') : value;
  return String(value);
};

const Phase4ReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState('');
  const [feedbackDraft, setFeedbackDraft] = useState({}); // sectionKey -> string
  // Track which action is in flight by section + decision so a click on
  // Approve doesn't also spin the Reject button (they previously shared a
  // single `busyKey` and animated together).
  const [busyAction, setBusyAction] = useState({ key: '', decision: '' });
  const [finalising, setFinalising] = useState(false);
  const [sendingBack, setSendingBack] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/officer/phase4/${id}`);
      setBundle(r.data?.data);
      const b = r.data?.data;
      const firstPending = b.sections.find((s) => {
        const row = b.data?.[s.key];
        return !row || row.status !== 'approved';
      });
      if (firstPending) setOpenKey(firstPending.key);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not load Phase 4'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) {
    return (
      <div className="app-shell">
        <TopBar title="Phase 4 review" />
        <main className="flex-1 grid place-items-center"><Loader2 size={20} className="animate-spin text-amber-700" /></main>
      </div>
    );
  }
  if (!bundle) return null;

  const { property, sections, schema, data } = bundle;
  const status = property.status;
  const canDecide = ['phase4_submitted', 'phase4_in_revision'].includes(status);

  const decide = async (sectionKey, decision) => {
    const body = { decision };
    if (decision === 'rejected') {
      const fb = (feedbackDraft[sectionKey] || '').trim();
      if (!fb) { toast.error('Feedback is required for rejection'); return; }
      body.feedback = fb;
    }
    setBusyAction({ key: sectionKey, decision });
    try {
      await api.post(`/officer/phase4/${id}/sections/${sectionKey}/decide`, body);
      toast.success(`Section ${decision}`);
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'Action failed'));
    } finally {
      setBusyAction({ key: '', decision: '' });
    }
  };

  const sendBack = async () => {
    if (!confirm('Send the whole submission back to the auditor for revision?')) return;
    setSendingBack(true);
    try {
      await api.post(`/officer/phase4/${id}/send-back`);
      toast.success('Sent back to auditor');
      navigate('/officer');
    } catch (err) {
      toast.error(apiMessage(err, 'Action failed'));
    } finally {
      setSendingBack(false);
    }
  };

  const finalApprove = async () => {
    if (!confirm('Final approve this property? Contract PDF will be generated.')) return;
    setFinalising(true);
    try {
      await api.post(`/officer/phase4/${id}/final-approve`);
      toast.success('Final approved. Upload the contract from Contracts.');
      navigate('/officer');
    } catch (err) {
      toast.error(apiMessage(err, 'Action failed'));
    } finally {
      setFinalising(false);
    }
  };

  const required = sections.filter((s) => s.required);
  const allApproved = required.every((s) => data?.[s.key]?.status === 'approved');
  const noPendingOptional = sections
    .filter((s) => !s.required)
    .every((s) => !data?.[s.key] || data[s.key].status !== 'pending');
  const canFinal = canDecide && allApproved && noPendingOptional;

  return (
    <div className="app-shell">
      <TopBar title="Phase 4 review" />
      <main className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">

        {/* Header */}
        <section className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 p-4 text-white shadow-card">
          <p className="text-xs uppercase tracking-wider text-amber-100">Phase 4 · CRM deep-dive</p>
          <h2 className="mt-1 text-lg font-semibold leading-snug">{property.name}</h2>
          <p className="mt-1 text-xs text-amber-100">
            {property.propertyCode || 'No ID'} · status: {status.replace(/_/g, ' ')}
          </p>
          {property.auditor && (
            <p className="mt-1 text-[11px] text-amber-100">
              Auditor: {property.auditor.name} · {property.auditor.email}
            </p>
          )}
        </section>

        {!canDecide && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              This Phase 4 submission is in a state where you cannot edit it
              right now ({status.replace(/_/g, ' ')}).
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-2.5">
          {sections.map((s) => {
            const saved = data?.[s.key];
            const open = openKey === s.key;
            const fields = schema[s.key] || [];
            const tone = saved?.status === 'approved' ? 'emerald'
              : saved?.status === 'rejected' ? 'rose'
              : saved ? 'amber' : 'slate';
            const toneClass = {
              emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              rose:    'bg-rose-50 text-rose-700 border-rose-200',
              amber:   'bg-amber-50 text-amber-700 border-amber-200',
              slate:   'bg-slate-50 text-slate-600 border-slate-200',
            }[tone];
            return (
              <div key={s.key} className={`overflow-hidden rounded-2xl border bg-white shadow-card ${open ? 'border-amber-300' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? '' : s.key)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-xl border ${toneClass}`}>
                    <Layers size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{s.label}</span>
                      {s.required && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                          Required
                        </span>
                      )}
                      {saved && (
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${toneClass}`}>
                          {saved.status}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {saved ? `Filled · rev #${saved.iteration}` : 'Not filled yet'}
                    </div>
                  </div>
                  {open ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                </button>

                {open && (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                    {saved ? (
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {fields.map((f) => (
                          <div key={f.key} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                            <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{f.label}</dt>
                            <dd className="text-slate-900 mt-0.5 break-words">{formatValue(f, saved.data?.[f.key])}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Auditor hasn't filled this section yet.</p>
                    )}

                    {saved?.status === 'rejected' && saved.feedback && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                        <p className="text-[11px] font-bold uppercase text-rose-700 mb-1">Existing feedback</p>
                        {saved.feedback}
                      </div>
                    )}

                    {canDecide && saved && (
                      <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                        <p className="text-[11px] font-semibold uppercase text-slate-600">Officer decision</p>
                        <textarea
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Feedback for the auditor (required for reject)"
                          value={feedbackDraft[s.key] || ''}
                          onChange={(e) => setFeedbackDraft((cur) => ({ ...cur, [s.key]: e.target.value }))}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="md"
                            variant="danger"
                            loading={busyAction.key === s.key && busyAction.decision === 'rejected'}
                            disabled={busyAction.key === s.key && busyAction.decision === 'approved'}
                            onClick={() => decide(s.key, 'rejected')}
                          >
                            <X size={14} /> Reject
                          </Button>
                          <Button
                            size="md"
                            variant="primary"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            loading={busyAction.key === s.key && busyAction.decision === 'approved'}
                            disabled={busyAction.key === s.key && busyAction.decision === 'rejected'}
                            onClick={() => decide(s.key, 'approved')}
                          >
                            <Check size={14} /> Approve
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canDecide && (
          <div className="sticky bottom-2 z-10 grid grid-cols-2 gap-2">
            <Button
              size="md"
              variant="secondary"
              className="border-rose-200 text-rose-700"
              loading={sendingBack}
              onClick={sendBack}
            >
              <RotateCcw size={14} /> Send back
            </Button>
            <Button
              size="md"
              variant="primary"
              className="bg-violet-700 hover:bg-violet-800 text-white"
              disabled={!canFinal}
              loading={finalising}
              onClick={finalApprove}
            >
              <Trophy size={14} /> Final approve
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Phase4ReviewPage;
