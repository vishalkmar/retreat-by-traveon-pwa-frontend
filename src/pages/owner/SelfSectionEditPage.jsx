import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import { SECTIONS } from '../../config.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Textarea } from '../../components/ui/Field.jsx';
import PhotoUploader from '../../components/PhotoUploader.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import { usePropertyRoom, useSocket } from '../../context/SocketContext.jsx';

// Owner-side mirror of auditor/SectionEditPage. Same UX, the only thing
// that differs is the API base.

const SelfSectionEditPage = () => {
  const { id, sectionKey } = useParams();
  const navigate = useNavigate();
  const section = SECTIONS.find((s) => s.key === sectionKey);
  const [property, setProperty] = useState(null);
  const [field, setField] = useState(null);
  const [review, setReview] = useState(null);
  const [description, setDescription] = useState('');
  const [existing, setExisting] = useState([]);
  const [removedUrls, setRemovedUrls] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { socket } = useSocket();
  usePropertyRoom(property?.id);

  const minPhotos = (() => {
    const roomMinimum = Math.ceil((Number(property?.numberOfRooms) || 0) * 0.5);
    return sectionKey === 'rooms' ? Math.max(3, roomMinimum || 3) : 3;
  })();

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/owner/properties/by-id/${id}`);
      const p = r.data?.data?.property;
      setProperty(p);
      const f = (p.fields || []).find((x) => x.sectionKey === sectionKey) || null;
      setField(f);
      setReview((p.reviews || []).find((x) => x.sectionKey === sectionKey) || null);
      setDescription(f?.description || '');
      setExisting(f?.photoUrls || []);
      setRemovedUrls([]);
      setPending([]);
    } catch {
      toast.error('Could not load');
    } finally {
      setLoading(false);
    }
  }, [id, sectionKey]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onReview = (payload) => {
      if (payload?.sectionKey === sectionKey) {
        toast(payload.review?.decision === 'rejected' ? 'Reviewer raised an objection' : 'Reviewer reviewed this section');
        load();
      }
    };
    socket.on('property:field-review', onReview);
    return () => { socket.off('property:field-review', onReview); };
  }, [socket, sectionKey, load]);

  const save = async () => {
    if (!description.trim()) return toast.error('Notes are required');
    const newCount = existing.filter((u) => !removedUrls.includes(u)).length + pending.length;
    if (newCount < minPhotos) return toast.error(`Add at least ${minPhotos} uploaded photos`);

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('description', description);
      if (removedUrls.length) fd.append('removeUrls', removedUrls.join(','));
      pending.forEach((f) => fd.append('photos', f));

      await api.put(`/owner/self-properties/${id}/sections/${sectionKey}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Saved');
      navigate(-1);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  if (!section) return null;
  if (loading) return <div className="app-shell"><LoadingScreen /></div>;

  const futureReviewOpen = review?.decision === 'approved' && review?.approvedForFutureReview;
  const locked = !futureReviewOpen && ['phase3_submitted', 'in_review', 'approved', 'contract_sent', 'contract_signed', 'completed', 'rejected']
    .includes(property?.status);

  return (
    <div className="app-shell">
      <TopBar title={section.label} />
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <p className="text-xs text-slate-500">{section.hint}</p>
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          Instruction: notes required, minimum {minPhotos} live uploaded photos required for this field.
        </p>

        {review?.decision === 'rejected' && review.comment && (
          <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-900">
            <strong className="block">Reviewer raised an objection:</strong>
            {review.comment}
          </div>
        )}

        {review?.decision === 'approved' && review.approvedForFutureReview && review.comment && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <strong className="block">Approved with a note to fix later:</strong>
            {review.comment}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <Field label="Notes / description">
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe the ${section.label.toLowerCase()} in detail.`}
              disabled={locked}
            />
          </Field>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Photos
            </p>
            <PhotoUploader
              existing={existing.filter((u) => !removedUrls.includes(u))}
              pending={pending}
              onAdd={(files) => setPending((p) => [...p, ...files])}
              onRemoveExisting={locked ? null : (url) => setRemovedUrls((r) => [...r, url])}
              onRemovePending={(idx) => setPending((p) => p.filter((_, i) => i !== idx))}
              max={sectionKey === 'rooms' ? Math.max(50, minPhotos) : 10}
              minimum={minPhotos}
            />
          </div>

          {!locked && (
            <Button size="block" onClick={save} loading={saving}>
              <Save size={16} /> Save section
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default SelfSectionEditPage;
