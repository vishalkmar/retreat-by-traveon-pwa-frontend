import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import { ROOM_PHOTO_CATEGORIES, SECTIONS } from '../../config.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import SectionStatusCard from '../../components/SectionStatusCard.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import { usePropertyRoom, useSocket } from '../../context/SocketContext.jsx';

// Phase 3 capture grid. Lists every section with its current state (photo
// count, notes, officer's decision/comment). Tapping a section opens its
// editor. Submit button enabled once all required sections have content.

const CapturePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { socket } = useSocket();
  usePropertyRoom(property?.id);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/auditor/properties/${id}`);
      setProperty(r.data?.data?.property);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not load'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onUpdate = () => load();
    socket.on('property:field-review', onUpdate);
    socket.on('property:status', onUpdate);
    socket.on('property:suggestion', onUpdate);
    return () => {
      socket.off('property:field-review', onUpdate);
      socket.off('property:status', onUpdate);
      socket.off('property:suggestion', onUpdate);
    };
  }, [socket, load]);

  const fieldByKey = useMemo(() => {
    const m = {};
    (property?.fields || []).forEach((f) => { m[f.sectionKey] = f; });
    return m;
  }, [property]);

  const reviewByKey = useMemo(() => {
    const m = {};
    (property?.reviews || []).forEach((r) => { m[r.sectionKey] = r; });
    return m;
  }, [property]);

  const minPhotosForSection = (sectionKey) => {
    const roomMinimum = Math.ceil((Number(property?.numberOfRooms) || 0) * 0.5);
    if (sectionKey === 'trainer') return 2;
    return sectionKey === 'rooms' ? 0 : 3;
  };

  const roomsCompletion = (field) => {
    const total = Number(property?.numberOfRooms) || 0;
    const required = Math.ceil(total / 2);
    const rooms = Array.isArray(field?.deepDiveData?.rooms) ? field.deepDiveData.rooms : [];
    const categories = Array.isArray(field?.deepDiveData?.categories) ? field.deepDiveData.categories : [];
    const categoryTotal = categories.reduce((sum, cat) => sum + (Number(cat.count) || 0), 0);
    const photoCount = rooms.reduce((sum, room) => (
      sum + ROOM_PHOTO_CATEGORIES.reduce((inner, cat) => (
        inner + ((room.photos?.[cat.key] || []).length)
      ), 0)
    ), 0);
    const complete = rooms.length >= required
      && categoryTotal === total
      && rooms.every((room) => (
        room.category?.trim()
        && ROOM_PHOTO_CATEGORIES.every((cat) => (room.photos?.[cat.key] || []).length > 0)
      ));
    return { complete, photoCount, required };
  };

  const allRequiredFilled = SECTIONS
    .filter((s) => s.required)
    .every((s) => {
      const f = fieldByKey[s.key];
      if (!f || !(f.description || '').trim()) return false;
      if (s.key === 'rooms') return roomsCompletion(f).complete;
      return (f.photoUrls || []).length >= minPhotosForSection(s.key);
    });

  const submit = async () => {
    setSubmitting(true);
    try {
      const r = await api.post(`/auditor/properties/${id}/submit`);
      setProperty(r.data?.data?.property);
      toast.success('Submitted for review');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not submit'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="app-shell"><LoadingScreen /></div>;
  if (!property) return null;

  const locked = ['phase3_submitted', 'in_review', 'approved', 'contract_sent', 'contract_signed', 'completed', 'rejected']
    .includes(property.status);

  return (
    <div className="app-shell">
      <TopBar title="Phase 3 · Capture" />
      <main className="flex-1 overflow-y-auto p-3 pb-28">
        <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{property.name}</p>
              <p className="truncate text-xs text-slate-500">{property.propertyCode}</p>
            </div>
            <StatusPill status={property.status} />
          </div>
          {property.officerSuggestion && (
            <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
              <strong className="block">Officer suggestion</strong>
              {property.officerSuggestion}
            </div>
          )}
          {property.rejectedReason && (
            <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-900">
              <strong className="block">Final rejected:</strong>
              {property.rejectedReason}
            </div>
          )}
        </section>

        <p className="mt-4 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Sections {locked && '(read only)'}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {SECTIONS.map((s) => {
            const f = fieldByKey[s.key];
            const r = reviewByKey[s.key];
            const canEdit = !locked || (r?.decision === 'approved' && r?.approvedForFutureReview);
            const roomState = s.key === 'rooms' ? roomsCompletion(f) : null;
            return (
              <SectionStatusCard
                key={s.key}
                label={s.label}
                hint={s.key === 'rooms' ? `${s.hint} Minimum room entries: ${roomState.required}.` : `${s.hint} Minimum photos: ${minPhotosForSection(s.key)}.`}
                required={s.required}
                photos={s.key === 'rooms' ? roomState.photoCount : (f?.photoUrls || []).length}
                hasText={!!(f?.description || '').trim()}
                decision={r?.decision || (f ? 'pending' : 'not_started')}
                approvedWithObjection={!!r?.approvedForFutureReview}
                comment={
                  r?.decision === 'rejected' || (r?.decision === 'approved' && r?.approvedForFutureReview)
                    ? r.comment
                    : null
                }
                onClick={canEdit ? () => navigate(`/auditor/properties/${id}/sections/${s.key}`) : null}
              />
            );
          })}
        </div>

        {!locked && (
          <div className="mt-6">
            <Button
              size="block"
              onClick={submit}
              loading={submitting}
              disabled={!allRequiredFilled}
            >
              <Send size={16} /> {property.status === 'in_revision' ? 'Save follow-up' : 'Submit for review'}
            </Button>
            {!allRequiredFilled && (
              <p className="mt-2 text-center text-[11px] text-rose-600">
                Fill every required section with notes and the required minimum live uploaded photos.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CapturePage;
