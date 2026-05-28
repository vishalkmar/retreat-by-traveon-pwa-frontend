import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import { SECTIONS, DEEP_DIVE_SCHEMA, ROOM_PHOTO_CATEGORIES, SECTION_PHOTO_CATEGORIES } from '../../config.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Textarea } from '../../components/ui/Field.jsx';
import PhotoUploader from '../../components/PhotoUploader.jsx';
import DeepDiveFields from '../../components/DeepDiveFields.jsx';
import RoomsSectionEditor from '../../components/RoomsSectionEditor.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import { usePropertyRoom, useSocket } from '../../context/SocketContext.jsx';

// Single-section editor. Captures everything we need for the section in
// one screen — photos, notes, the structured "deep-dive" fields (former
// Phase 4), and (for the rooms section) per-room records with tagged
// photos. Saves through PUT /auditor/properties/:id/sections/:sectionKey
// with the deep-dive blob serialised into a `deepDiveData` form field.

const SectionEditPage = () => {
  const { id, sectionKey } = useParams();
  const navigate = useNavigate();
  const section = SECTIONS.find((s) => s.key === sectionKey);
  const isRooms = sectionKey === 'rooms';

  const [property, setProperty] = useState(null);
  const [review, setReview] = useState(null);
  const [description, setDescription] = useState('');
  const [existing, setExisting] = useState([]);
  const [removedUrls, setRemovedUrls] = useState([]);
  const [pending, setPending] = useState([]);
  const [deepDive, setDeepDive] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { socket } = useSocket();
  usePropertyRoom(property?.id);

  const minPhotos = (() => {
    const roomMinimum = Math.ceil((Number(property?.numberOfRooms) || 0) * 0.5);
    if (sectionKey === 'trainer') return 2;
    return isRooms ? 0 : 3;
  })();

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/auditor/properties/${id}`);
      const p = r.data?.data?.property;
      setProperty(p);
      const f = (p.fields || []).find((x) => x.sectionKey === sectionKey) || null;
      setReview((p.reviews || []).find((x) => x.sectionKey === sectionKey) || null);
      setDescription(f?.description || '');
      setExisting(f?.photoUrls || []);
      setRemovedUrls([]);
      setPending([]);
      setDeepDive(f?.deepDiveData || {});
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
        toast(payload.review?.decision === 'rejected' ? 'Officer raised an objection' : 'Officer reviewed this section');
        load();
      }
    };
    socket.on('property:field-review', onReview);
    socket.on('property:suggestion', load);
    return () => {
      socket.off('property:field-review', onReview);
      socket.off('property:suggestion', load);
    };
  }, [socket, sectionKey, load]);

  // For the rooms section, eagerly upload any pending per-room photos so
  // by save-time deepDiveData.rooms[*].photos[cat] are all URL arrays.
  const flushPendingRoomPhotos = async () => {
    if (!isRooms) return deepDive;
    const rooms = Array.isArray(deepDive?.rooms) ? deepDive.rooms : [];
    const flushed = [];
    for (const room of rooms) {
      const nextPhotos = { ...(room.photos || {}) };
      const pendingMap = room.pendingPhotos || {};
      for (const catKey of Object.keys(pendingMap)) {
        const files = pendingMap[catKey] || [];
        for (const file of files) {
          const fd = new FormData();
          fd.append('photo', file);
          // eslint-disable-next-line no-await-in-loop
          const r = await api.post(`/auditor/properties/${id}/upload-one`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const url = r.data?.data?.url;
          if (url) {
            nextPhotos[catKey] = [...(nextPhotos[catKey] || []), url];
          }
        }
      }
      flushed.push({ ...room, photos: nextPhotos, pendingPhotos: {} });
    }
    const next = { ...deepDive, rooms: flushed };
    setDeepDive(next);
    return next;
  };

  const validateRooms = (dd) => {
    if (!isRooms) return null;
    const total = Number(property?.numberOfRooms) || 0;
    const required = Math.ceil(total / 2);
    const rooms = dd?.rooms || [];
    if (rooms.length < required) {
      return `Add details for at least ${required} rooms (50% of ${total}). Currently ${rooms.length}.`;
    }
    const catSum = (dd?.categories || []).reduce((s, c) => s + (Number(c.count) || 0), 0);
    if (catSum !== total) {
      return `Room categories add up to ${catSum} but total rooms is ${total}.`;
    }
    for (const [idx, room] of rooms.entries()) {
      if (!room.category?.trim()) return `Room #${idx + 1} is missing a category.`;
      for (const cat of ROOM_PHOTO_CATEGORIES) {
        if (!cat.mandatory) continue;
        const have = (room.photos?.[cat.key] || []).length;
        if (have === 0) return `Room #${idx + 1}: ${cat.label} photo missing.`;
      }
    }
    return null;
  };

  const save = async () => {
    if (!description.trim()) return toast.error('Notes are required');
    const newCount = existing.filter((u) => !removedUrls.includes(u)).length + pending.length;
    if (!isRooms) {
      if (sectionKey === 'cctv' && photoCategories.length < 3) {
        return toast.error('Select at least 3 CCTV coverage areas');
      }
      const missingPhotoCategory = photoCategories?.find((cat, idx) => (
        cat.mandatory && newCount <= idx
      ));
      if (missingPhotoCategory) return toast.error(`${missingPhotoCategory.label} is required`);
      if (newCount < minPhotos) return toast.error(`Add at least ${minPhotos} uploaded photos`);
    }

    setSaving(true);
    try {
      const flushed = await flushPendingRoomPhotos();
      const roomError = validateRooms(flushed);
      if (roomError) {
        toast.error(roomError);
        setSaving(false);
        return;
      }

      const fd = new FormData();
      fd.append('description', description);
      if (removedUrls.length) fd.append('removeUrls', removedUrls.join(','));
      pending.forEach((f) => fd.append('photos', f));
      // Strip the per-room pendingPhotos before sending (they're already URLs now).
      const ddToSend = {
        ...flushed,
        rooms: (flushed.rooms || []).map((r) => {
          const { pendingPhotos: _omit, ...rest } = r;
          return rest;
        }),
      };
      fd.append('deepDiveData', JSON.stringify(ddToSend));

      await api.put(`/auditor/properties/${id}/sections/${sectionKey}`, fd, {
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

  const schema = DEEP_DIVE_SCHEMA[sectionKey] || [];
  const coverageAreas = Array.isArray(deepDive?.coverageAreas) ? deepDive.coverageAreas : [];
  const facilityRequiredPhotos = [
    deepDive?.gymPresent === true && { key: 'gym', label: 'Gym', mandatory: true },
    deepDive?.poolPresent === true && { key: 'pool', label: 'Swimming Pool', mandatory: true },
    deepDive?.yogaShalaPresent === true && { key: 'yoga-shala', label: 'Yoga Shala', mandatory: true },
  ].filter(Boolean);
  const facilityExtraPhotos = Array.from(
    { length: Math.max(0, 3 - facilityRequiredPhotos.length) },
    (_, idx) => ({ key: `facility-extra-${idx + 1}`, label: `Facility image ${idx + 1}`, mandatory: true }),
  );
  const gardenRequiredPhotos = [
    deepDive?.waterFeature === true && { key: 'water-feature', label: 'Fountain / Pond Image', mandatory: true },
    deepDive?.walkingPathAvailable === true && { key: 'walking-path', label: 'Pathway Image', mandatory: true },
    deepDive?.outdoorYoga === true && { key: 'outdoor-yoga', label: 'Yoga Setup Image', mandatory: true },
    deepDive?.organicGarden === true && { key: 'organic-garden', label: 'Plantation Close-up', mandatory: true },
    deepDive?.nightLighting === true && { key: 'night-lighting', label: 'Evening Lighting Image', mandatory: true },
  ].filter(Boolean);
  const gardenExtraPhotos = Array.from(
    { length: Math.max(0, 3 - gardenRequiredPhotos.length) },
    (_, idx) => ({ key: `garden-extra-${idx + 1}`, label: `Garden image ${idx + 1}`, mandatory: true }),
  );
  const photoCategories = (() => {
    if (sectionKey === 'cctv') {
      return coverageAreas.map((area) => ({
        key: `cctv-${String(area).toLowerCase().replace(/\s+/g, '-')}`,
        label: `CCTV coverage: ${area}`,
        mandatory: true,
      }));
    }
    if (sectionKey === 'facilities') return [...facilityRequiredPhotos, ...facilityExtraPhotos];
    if (sectionKey === 'garden') return [...gardenRequiredPhotos, ...gardenExtraPhotos];
    return SECTION_PHOTO_CATEGORIES[sectionKey] || null;
  })();

  return (
    <div className="app-shell">
      <TopBar title={section.label} />
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <p className="text-xs text-slate-500">{section.hint}</p>
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {isRooms
            ? 'Notes required. Add room-wise details and mandatory photos below.'
            : `Notes required + minimum ${minPhotos} uploaded photos for this section. Follow the field-wise capture instructions below.`}
        </p>

        {review?.decision === 'rejected' && review.comment && (
          <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-900">
            <strong className="block">Officer raised an objection:</strong>
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

          {!isRooms && sectionKey !== 'cctv' && sectionKey !== 'facilities' && sectionKey !== 'garden' && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                {sectionKey === 'cctv' ? 'Coverage photos' : 'Section photos'}
              </p>
              {sectionKey === 'cctv' && photoCategories.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-500">
                  Select CCTV coverage areas below to add mandatory image slots.
                </p>
              ) : (
                <PhotoUploader
                  existing={existing.filter((u) => !removedUrls.includes(u))}
                  pending={pending}
                  onAdd={(files) => setPending((p) => [...p, ...files])}
                  onRemoveExisting={locked ? null : (url) => setRemovedUrls((r) => [...r, url])}
                  onRemovePending={(idx) => setPending((p) => p.filter((_, i) => i !== idx))}
                  max={10}
                  minimum={minPhotos}
                  categories={photoCategories}
                  disabled={locked}
                />
              )}
            </div>
          )}

          {/* Rooms section: special per-room editor */}
          {isRooms && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Per-room details
              </p>
              <RoomsSectionEditor
                totalRooms={property?.numberOfRooms || 0}
                value={deepDive}
                onChange={setDeepDive}
                locked={locked}
              />
            </div>
          )}

          {/* Generic deep-dive fields for this section (skipped when empty schema) */}
          {schema.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Deep-dive details
              </p>
              <DeepDiveFields
                schema={schema}
                data={deepDive}
                onChange={setDeepDive}
                disabled={locked}
              />
            </div>
          )}

          {sectionKey === 'cctv' && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Coverage photos
              </p>
              {photoCategories.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-500">
                  Select CCTV coverage areas above to add mandatory image slots.
                </p>
              ) : (
                <PhotoUploader
                  existing={existing.filter((u) => !removedUrls.includes(u))}
                  pending={pending}
                  onAdd={(files) => setPending((p) => [...p, ...files])}
                  onRemoveExisting={locked ? null : (url) => setRemovedUrls((r) => [...r, url])}
                  onRemovePending={(idx) => setPending((p) => p.filter((_, i) => i !== idx))}
                  max={10}
                  minimum={minPhotos}
                  categories={photoCategories}
                  disabled={locked}
                />
              )}
            </div>
          )}

          {sectionKey === 'facilities' && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Facility photos
              </p>
              <PhotoUploader
                existing={existing.filter((u) => !removedUrls.includes(u))}
                pending={pending}
                onAdd={(files) => setPending((p) => [...p, ...files])}
                onRemoveExisting={locked ? null : (url) => setRemovedUrls((r) => [...r, url])}
                onRemovePending={(idx) => setPending((p) => p.filter((_, i) => i !== idx))}
                max={10}
                minimum={minPhotos}
                categories={photoCategories}
                disabled={locked}
              />
            </div>
          )}

          {sectionKey === 'garden' && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Garden photos
              </p>
              <PhotoUploader
                existing={existing.filter((u) => !removedUrls.includes(u))}
                pending={pending}
                onAdd={(files) => setPending((p) => [...p, ...files])}
                onRemoveExisting={locked ? null : (url) => setRemovedUrls((r) => [...r, url])}
                onRemovePending={(idx) => setPending((p) => p.filter((_, i) => i !== idx))}
                max={10}
                minimum={minPhotos}
                categories={photoCategories}
                disabled={locked}
              />
            </div>
          )}

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

export default SectionEditPage;
