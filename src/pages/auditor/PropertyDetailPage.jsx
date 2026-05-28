import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, MapPin, User, Phone, Mail, BedDouble, IndianRupee, FileCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import { SECTIONS } from '../../config.js';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import Button from '../../components/ui/Button.jsx';
import SectionStatusCard from '../../components/SectionStatusCard.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import PhaseTracker from '../../components/PhaseTracker.jsx';
import { usePropertyRoom, useSocket } from '../../context/SocketContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 text-sm">
    <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="truncate text-slate-800">{value || '—'}</p>
    </div>
  </div>
);

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const { socket } = useSocket();
  const { items: bellItems } = useNotifications();
  usePropertyRoom(property?.id);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/auditor/properties/${id}`);
      setProperty(r.data?.data?.property);
    } catch {
      toast.error('Could not load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onUpdate = () => load();
    const onFieldReview = (payload) => {
      const label = SECTIONS.find((s) => s.key === payload?.sectionKey)?.label || 'A section';
      const decision = payload?.review?.decision === 'rejected' ? 'objection raised' : 'review updated';
      setNotifications((items) => [
        { id: Date.now(), text: `${label}: ${decision}`, at: new Date().toLocaleTimeString() },
        ...items,
      ].slice(0, 5));
      toast(`${label}: ${decision}`);
      load();
    };
    socket.on('property:status', onUpdate);
    socket.on('property:field-review', onFieldReview);
    socket.on('property:suggestion', onUpdate);
    return () => {
      socket.off('property:status', onUpdate);
      socket.off('property:field-review', onFieldReview);
      socket.off('property:suggestion', onUpdate);
    };
  }, [socket, load]);

  if (loading) return <div className="app-shell"><LoadingScreen /></div>;
  if (!property) return null;

  const fieldByKey = Object.fromEntries((property.fields || []).map((f) => [f.sectionKey, f]));
  const reviewByKey = Object.fromEntries((property.reviews || []).map((r) => [r.sectionKey, r]));

  const phase2Needed = !property.propertyCode;
  const phase3Open = property.propertyCode && ['phase1_done', 'in_revision'].includes(property.status);

  return (
    <div className="app-shell">
      <TopBar title="Property" />
      <main className="flex-1 overflow-y-auto p-3 pb-24">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-slate-900">{property.name}</h2>
              <p className="truncate text-xs text-slate-500">{property.propertyCode || 'No Property ID yet'}</p>
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

        <section className="mt-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Phase progress</p>
          <div className="mt-2">
            <PhaseTracker role="auditor" propertyId={property.id} status={property.status} />
          </div>
        </section>

        {(property.officerSuggestion || property.rejectedReason) && (
          <section className="mt-3 space-y-2">
            {property.officerSuggestion && (
              <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">
                <strong className="block">Officer suggestion</strong>
                {property.officerSuggestion}
              </div>
            )}
            {property.rejectedReason && (
              <div className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-900">
                <strong className="block">Final rejected</strong>
                {property.rejectedReason}
              </div>
            )}
          </section>
        )}

        {notifications.length > 0 && (
          <section className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Live notifications</p>
            <div className="mt-2 space-y-1">
              {notifications.map((n) => (
                <p key={n.id} className="text-xs text-amber-900">{n.text} <span className="text-amber-700">{n.at}</span></p>
              ))}
            </div>
          </section>
        )}

        {phase2Needed && (
          <Button
            size="block"
            className="mt-4"
            onClick={() => navigate(`/auditor/properties/${id}/generate-id`)}
          >
            Generate Property ID <ArrowRight size={16} />
          </Button>
        )}

        {phase3Open && (
          <Button
            size="block"
            className="mt-4"
            onClick={() => navigate(`/auditor/properties/${id}/capture`)}
          >
            {property.status === 'in_revision' ? 'Update follow-up' : 'Continue to capture'} <ArrowRight size={16} />
          </Button>
        )}

        {/* Phase 4 has been folded into Phase 3 — the deep-dive fields are
            captured inside each section now, so no separate "Start Phase 4"
            button. The capture button above is the single entry point. */}

        <section className="mt-5">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Sections</p>
          <div className="mt-2 flex flex-col gap-2">
            {SECTIONS.map((s) => {
              const f = fieldByKey[s.key];
              const r = reviewByKey[s.key];
              const canEdit = ['phase1_done', 'in_revision'].includes(property.status) ||
                (r?.decision === 'approved' && r?.approvedForFutureReview);
              // Count unread bell notifications scoped to this exact section
              // so the card shows a NEW badge until the auditor opens it.
              const unread = bellItems.filter(
                (n) => n.propertyId === property.id
                  && !n.readAt
                  && n.data?.sectionKey === s.key,
              ).length;
              return (
                <SectionStatusCard
                  key={s.key}
                  label={s.label}
                  hint={s.hint}
                  required={s.required}
                  photos={(f?.photoUrls || []).length}
                  hasText={!!(f?.description || '').trim()}
                  decision={r?.decision || (f ? 'pending' : 'not_started')}
                  approvedWithObjection={!!r?.approvedForFutureReview}
                  unreadCount={unread}
                  comment={
                    r?.decision === 'rejected' || (r?.decision === 'approved' && r?.approvedForFutureReview)
                      ? r.comment
                      : null
                  }
                  onClick={canEdit && property.propertyCode ? () => navigate(`/auditor/properties/${id}/sections/${s.key}`) : null}
                />
              );
            })}
          </div>
        </section>

        {property.contract?.signedPdfUrl && (
          <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <FileCheck2 size={16} /> Contract signed by owner
            </div>
            <a
              href={property.contract.signedPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-emerald-800 underline"
            >
              View signed PDF
            </a>
          </section>
        )}

      </main>
    </div>
  );
};

export default PropertyDetailPage;
