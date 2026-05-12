import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, ChevronDown, ChevronUp, RefreshCcw, ShieldCheck, ShieldX, User, MapPin, Phone, Mail, BedDouble, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import { SECTIONS } from '../../config.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Textarea } from '../../components/ui/Field.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import ChatThread from '../../components/ChatThread.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import { usePropertyRoom, useSocket } from '../../context/SocketContext.jsx';

// The officer's review console. Every section is an accordion: tap to
// expand, view photos+notes, mark approved/objection. A red mark surfaces a
// comment textarea before the request fires. Bottom of screen has the
// suggestion box + Final Approve / Final Reject.

const Photos = ({ urls }) => {
  if (!urls?.length) return <p className="text-xs text-slate-400">No photos uploaded.</p>;
  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.map((u) => (
        <a key={u} href={u} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-xl bg-slate-100">
          <img src={u} alt="" className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
};

const SectionReview = ({ propertyId, section, field, review, locked, onChange }) => {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(review?.comment || '');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [busy, setBusy] = useState(false);

  const decision = review?.decision || (field ? 'pending' : 'not_started');

  const decide = async (next) => {
    if (next === 'rejected' && !showRejectInput) {
      setShowRejectInput(true);
      setOpen(true);
      return;
    }
    if (next === 'rejected' && !comment.trim()) {
      toast.error('Please add a comment explaining the objection');
      return;
    }
    setBusy(true);
    try {
      const r = await api.patch(
        `/officer/properties/${propertyId}/fields/${section.key}/decision`,
        { decision: next, comment: next === 'rejected' ? comment.trim() : null }
      );
      onChange?.(r.data?.data);
      toast.success(next === 'approved' ? 'Marked approved' : 'Objection raised');
      setShowRejectInput(false);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save'));
    } finally {
      setBusy(false);
    }
  };

  const decisionPill =
    decision === 'approved' ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Approved</span>
    : decision === 'rejected' ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Objection</span>
    : decision === 'pending' ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Pending</span>
    : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Empty</span>;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-3 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{section.label}</p>
            {section.required && <span className="text-[9px] font-bold text-rose-500">REQ</span>}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span>{(field?.photoUrls || []).length} photos</span>
            <span>{(field?.description || '').trim() ? '· notes ✓' : '· no notes'}</span>
            {decisionPill}
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-100 px-3 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Auditor notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
              {(field?.description || '').trim() || <span className="text-slate-400">No notes provided.</span>}
            </p>
          </div>
          <Photos urls={field?.photoUrls || []} />

          {showRejectInput && (
            <Field label="Objection note">
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What needs to change?"
              />
            </Field>
          )}

          {!locked && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide('approved')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Check size={16} /> Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide('rejected')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
              <X size={16} /> Raise objection
              </button>
            </div>
          )}

          <details className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs">
            <summary className="cursor-pointer font-semibold text-slate-600">Discuss this section</summary>
            <ChatThread endpoint="/officer" propertyId={propertyId} sectionKey={section.key} className="mt-2 !shadow-none" />
          </details>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 text-sm">
    <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="truncate text-slate-800">{value || '—'}</p>
    </div>
  </div>
);

const PropertyReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState('');
  const [busySuggestion, setBusySuggestion] = useState(false);
  const [finalRejectReason, setFinalRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [busyFinal, setBusyFinal] = useState(false);
  const { socket } = useSocket();
  usePropertyRoom(property?.id);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/officer/properties/${id}`);
      const p = r.data?.data?.property;
      setProperty(p);
      setSuggestion(p?.officerSuggestion || '');
    } catch {
      toast.error('Could not load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const handler = () => load();
    socket.on('property:status', handler);
    socket.on('property:field-updated', handler);
    socket.on('property:suggestion', handler);
    return () => {
      socket.off('property:status', handler);
      socket.off('property:field-updated', handler);
      socket.off('property:suggestion', handler);
    };
  }, [socket, load]);

  const fieldByKey = useMemo(() => Object.fromEntries((property?.fields || []).map((f) => [f.sectionKey, f])), [property]);
  const reviewByKey = useMemo(() => Object.fromEntries((property?.reviews || []).map((r) => [r.sectionKey, r])), [property]);

  const canFinalize = useMemo(() => {
    if (!property) return false;
    const required = SECTIONS.filter((s) => s.required).map((s) => s.key);
    return required.every((k) => reviewByKey[k]?.decision === 'approved') &&
      !Object.values(reviewByKey).some((r) => r.decision === 'rejected');
  }, [property, reviewByKey]);

  const saveSuggestion = async () => {
    setBusySuggestion(true);
    try {
      await api.put(`/officer/properties/${id}/suggestion`, { suggestion });
      toast.success('Suggestion saved');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save'));
    } finally {
      setBusySuggestion(false);
    }
  };

  const finalApprove = async () => {
    setBusyFinal(true);
    try {
      const r = await api.post(`/officer/properties/${id}/approve`);
      setProperty(r.data?.data?.property);
      toast.success('Approved · contract emailed to owner');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not approve'));
    } finally {
      setBusyFinal(false);
    }
  };

  const followUp = async () => {
    setBusyFinal(true);
    try {
      const r = await api.post(`/officer/properties/${id}/follow-up`, { suggestion });
      setProperty(r.data?.data?.property);
      toast.success('Moved to follow-up');
      navigate('/officer/follow-up', { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, 'Could not move to follow-up'));
    } finally {
      setBusyFinal(false);
    }
  };

  const finalReject = async () => {
    if (!finalRejectReason.trim()) {
      toast.error('Provide a rejection reason');
      return;
    }
    setBusyFinal(true);
    try {
      const r = await api.post(`/officer/properties/${id}/reject`, { reason: finalRejectReason.trim() });
      setProperty(r.data?.data?.property);
      toast.success('Property rejected');
      setShowRejectModal(false);
      navigate('/officer/rejected', { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, 'Could not reject'));
    } finally {
      setBusyFinal(false);
    }
  };

  if (loading) return <div className="app-shell"><LoadingScreen /></div>;
  if (!property) return null;

  const locked = ['approved', 'contract_sent', 'contract_signed', 'completed', 'rejected'].includes(property.status);

  return (
    <div className="app-shell">
      <TopBar title="Review property" />
      <main className="flex-1 overflow-y-auto p-3 pb-24">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-slate-900">{property.name}</h2>
              <p className="truncate text-xs text-slate-500">{property.propertyCode}</p>
              <p className="truncate text-xs text-slate-500">Audited by {property.auditor?.name}</p>
            </div>
            <StatusPill status={property.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <InfoRow icon={MapPin} label="Address" value={property.address} />
            <InfoRow icon={BedDouble} label="Rooms" value={property.numberOfRooms} />
            <InfoRow icon={User} label="Owner" value={property.ownerName} />
            <InfoRow icon={Mail} label="Owner email" value={property.ownerEmail} />
            <InfoRow icon={Phone} label="Owner phone" value={property.ownerPhone} />
            <InfoRow icon={IndianRupee} label="Pricing" value={property.pricing} />
          </div>
        </section>

        <p className="mt-5 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Review sections</p>
        <div className="mt-2 flex flex-col gap-2">
          {SECTIONS.map((s) => (
            <SectionReview
              key={s.key}
              propertyId={property.id}
              section={s}
              field={fieldByKey[s.key]}
              review={reviewByKey[s.key]}
              locked={locked}
              onChange={() => load()}
            />
          ))}
        </div>

        <section className="mt-5">
          <Field label="Final suggestion / notes (visible to auditor)">
            <Textarea
              rows={3}
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Anything the auditor or owner should know…"
              disabled={locked}
            />
          </Field>
          {!locked && (
            <Button size="sm" variant="secondary" className="mt-2" onClick={saveSuggestion} loading={busySuggestion}>
              Save suggestion
            </Button>
          )}
        </section>

        {!locked && (
          <section className="mt-6 grid grid-cols-3 gap-2">
            <Button
              variant="primary"
              size="block"
              disabled={!canFinalize}
              onClick={finalApprove}
              loading={busyFinal}
              className="!bg-emerald-600 hover:!bg-emerald-700"
            >
              <ShieldCheck size={16} /> Approved
            </Button>
            <Button
              variant="secondary"
              size="block"
              onClick={followUp}
              loading={busyFinal}
            >
              <RefreshCcw size={16} /> Following up
            </Button>
            <Button
              variant="danger"
              size="block"
              onClick={() => setShowRejectModal(true)}
              loading={busyFinal}
            >
              <ShieldX size={16} /> Reject
            </Button>
            {!canFinalize && (
              <p className="col-span-3 text-center text-[11px] text-slate-500">
                Approved unlocks once every required section is marked approved and no objections remain.
              </p>
            )}
          </section>
        )}

        <section className="mt-6">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">General discussion</p>
          <ChatThread endpoint="/officer" propertyId={property.id} sectionKey="general" className="mt-2" />
        </section>

        {showRejectModal && (
          <div className="fixed inset-0 z-30 flex items-end bg-black/50 sm:items-center sm:justify-center">
            <div className="w-full max-w-md rounded-t-2xl bg-white p-4 sm:rounded-2xl">
              <p className="font-semibold text-slate-900">Reject this property?</p>
              <p className="mt-1 text-xs text-slate-500">
                The auditor will be notified and the property will move to final rejected. This cannot be undone.
              </p>
              <Field label="Reason" hint="Required">
                <Textarea
                  rows={4}
                  value={finalRejectReason}
                  onChange={(e) => setFinalRejectReason(e.target.value)}
                />
              </Field>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="md" onClick={() => setShowRejectModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="danger" size="md" onClick={finalReject} loading={busyFinal} className="flex-1">
                  Final reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PropertyReviewPage;
