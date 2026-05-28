import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2, Camera, ChevronDown, ChevronUp, Image as ImageIcon,
  Plus, Trash2, Upload, Check, X, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';

const FIVE_MB = 5 * 1024 * 1024;

/*
  Final Listing Images — runs after a property is approved. Auditor picks an
  approved property, opens the section they want to populate (Entrance,
  Reception, Rooms, …), and uploads / live-captures as many photos as needed.

  Minimum 3 slots per section by default, with an "Add more" button so there's
  no real cap. Each slot supports either Live Capture (back camera) or Upload
  from device. Photos > 5 MB are compressed on-device before they hit the API.
*/

const blobToImage = (blob) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
  img.src = url;
});

const canvasToBlob = (canvas, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

const compressIfBig = async (file) => {
  if (file.size <= FIVE_MB) return file;
  const img = await blobToImage(file);
  const canvas = document.createElement('canvas');
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  let blob = null;
  for (const q of [0.82, 0.72, 0.62, 0.52, 0.42]) {
    blob = await canvasToBlob(canvas, q);
    if (blob && blob.size <= FIVE_MB) break;
  }
  return blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file;
};

const ListingImagesPage = () => {
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [sections, setSections] = useState([]);
  const [grouped, setGrouped] = useState({});       // sectionKey -> ListingImage[]
  const [openSection, setOpenSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProperty, setLoadingProperty] = useState(false);

  // Load eligible properties once
  useEffect(() => {
    let alive = true;
    api.get('/auditor/listing-images/properties')
      .then((r) => { if (alive) setProperties(r.data?.data?.items || []); })
      .catch((err) => toast.error(apiMessage(err, 'Could not load properties')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // When property changes, fetch its sections + existing images
  useEffect(() => {
    if (!selectedId) {
      setSections([]); setGrouped({}); setOpenSection('');
      return;
    }
    let alive = true;
    setLoadingProperty(true);
    api.get(`/auditor/listing-images/${selectedId}`)
      .then((r) => {
        if (!alive) return;
        const d = r.data?.data || {};
        setSections(d.sections || []);
        setGrouped(d.images || {});
        // Auto-expand the first section so the user has something to look at.
        if (d.sections?.length) setOpenSection(d.sections[0].key);
      })
      .catch((err) => toast.error(apiMessage(err, 'Could not load images')))
      .finally(() => { if (alive) setLoadingProperty(false); });
    return () => { alive = false; };
  }, [selectedId]);

  const refresh = async () => {
    if (!selectedId) return;
    try {
      const r = await api.get(`/auditor/listing-images/${selectedId}`);
      const d = r.data?.data || {};
      setGrouped(d.images || {});
    } catch {/* swallow */ }
  };

  const onUploaded = () => refresh();

  return (
    <div className="app-shell">
      <TopBar title="Final Listing Images" />
      <main className="flex-1 overflow-y-auto p-4 pb-24">

        {/* Property dropdown — only approved properties */}
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Property
        </label>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loading}
          >
            <option value="">
              {loading ? 'Loading approved properties…' : '— Select an approved property —'}
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.propertyCode ? ` · ${p.propertyCode}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {!loading && properties.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">
            No approved properties yet. Once a property is approved by the officer, it shows up here.
          </p>
        )}

        {/* Sections */}
        {selectedId && (
          <div className="mt-6 space-y-3">
            {loadingProperty ? (
              <div className="grid place-items-center py-10">
                <Loader2 size={20} className="animate-spin text-brand-700" />
              </div>
            ) : (
              sections.map((s) => (
                <SectionPanel
                  key={s.key}
                  propertyId={selectedId}
                  section={s}
                  images={grouped[s.key] || []}
                  open={openSection === s.key}
                  onToggle={() => setOpenSection(openSection === s.key ? '' : s.key)}
                  onChanged={onUploaded}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// One collapsible section. Renders existing thumbnails + the "live or upload"
// row of slots (minimum 3, expandable with "Add more").
// ───────────────────────────────────────────────────────────────────────────────
const SectionPanel = ({ propertyId, section, images, open, onToggle, onChanged }) => {
  const [slots, setSlots] = useState(() => [
    { id: 1, file: null, preview: null, mode: 'upload' },
    { id: 2, file: null, preview: null, mode: 'upload' },
    { id: 3, file: null, preview: null, mode: 'upload' },
  ]);
  const nextSlotId = useRef(4);
  const [uploading, setUploading] = useState(false);

  // Revoke previews on unmount or slot replacement.
  useEffect(() => () => {
    slots.forEach((s) => s.preview && URL.revokeObjectURL(s.preview));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addSlot = (mode = 'upload') => {
    setSlots((cur) => [
      ...cur,
      { id: nextSlotId.current++, file: null, preview: null, mode },
    ]);
  };

  const setSlot = (id, patch) => {
    setSlots((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSlot = (id) => {
    setSlots((cur) => {
      const target = cur.find((s) => s.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      const next = cur.filter((s) => s.id !== id);
      return next.length ? next : [{ id: nextSlotId.current++, file: null, preview: null, mode: 'upload' }];
    });
  };

  const onFilePicked = async (id, file) => {
    if (!file) return;
    const ready = await compressIfBig(file);
    const preview = URL.createObjectURL(ready);
    setSlot(id, { file: ready, preview });
  };

  const submit = async () => {
    const filled = slots.filter((s) => s.file);
    if (filled.length === 0) {
      toast.error('Pick or capture at least one photo first.');
      return;
    }
    setUploading(true);
    try {
      // Group by capture mode so each batch is tagged correctly server-side.
      const byMode = { live: [], upload: [] };
      filled.forEach((s) => { byMode[s.mode === 'live' ? 'live' : 'upload'].push(s.file); });

      for (const mode of ['live', 'upload']) {
        const files = byMode[mode];
        if (!files.length) continue;
        const fd = new FormData();
        fd.append('sectionKey', section.key);
        fd.append('captureMode', mode);
        files.forEach((f) => fd.append('photos', f));
        // eslint-disable-next-line no-await-in-loop
        await api.post(`/auditor/listing-images/${propertyId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(`Saved ${filled.length} photo${filled.length > 1 ? 's' : ''}`);
      // Reset slots back to a clean 3
      slots.forEach((s) => s.preview && URL.revokeObjectURL(s.preview));
      setSlots([
        { id: nextSlotId.current++, file: null, preview: null, mode: 'upload' },
        { id: nextSlotId.current++, file: null, preview: null, mode: 'upload' },
        { id: nextSlotId.current++, file: null, preview: null, mode: 'upload' },
      ]);
      onChanged?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const removeSaved = async (imageId) => {
    try {
      await api.delete(`/auditor/listing-images/${propertyId}/${imageId}`);
      toast.success('Removed');
      onChanged?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not remove'));
    }
  };

  const filledCount = slots.filter((s) => s.file).length;

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white shadow-card ${open ? 'border-brand-300' : 'border-slate-100'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <ImageIcon size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">{section.label}</div>
            <div className="text-[11px] text-slate-500">
              {images.length} saved · {section.required ? 'Required' : 'Optional'}
            </div>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-4">
          {/* Already-saved thumbnails */}
          {images.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Already saved ({images.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <SavedThumb key={img.id} img={img} onRemove={() => removeSaved(img.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Upload slots */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              New uploads
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => (
                <UploadSlot
                  key={slot.id}
                  slot={slot}
                  onPick={(file) => onFilePicked(slot.id, file)}
                  onMode={(mode) => setSlot(slot.id, { mode })}
                  onClear={() => {
                    if (slot.preview) URL.revokeObjectURL(slot.preview);
                    setSlot(slot.id, { file: null, preview: null });
                  }}
                  onRemoveSlot={() => removeSlot(slot.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addSlot('upload')}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700"
            >
              <Plus size={13} /> Add upload
            </button>
            <button
              type="button"
              onClick={() => addSlot('live')}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700"
            >
              <Camera size={13} /> Add live capture
            </button>
            <span className="ml-auto text-[11px] text-slate-500">
              {filledCount} ready to upload
            </span>
          </div>

          <Button
            size="block"
            loading={uploading}
            disabled={filledCount === 0}
            onClick={submit}
            className="bg-brand-700 hover:bg-brand-800 text-white"
          >
            <Upload size={16} /> Save {filledCount > 0 ? `${filledCount} photo${filledCount > 1 ? 's' : ''}` : 'photos'}
          </Button>
        </div>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// One thumbnail of an already-saved image with a remove button.
// ───────────────────────────────────────────────────────────────────────────────
const SavedThumb = ({ img, onRemove }) => {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
      <img src={img.url} alt="" className="h-full w-full object-cover" />
      <span className="absolute left-1 top-1 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
        Saved
      </span>
      {confirming ? (
        <div className="absolute inset-0 grid place-items-center bg-black/55">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onRemove}
              className="grid h-7 w-7 place-items-center rounded-full bg-rose-600 text-white"
              aria-label="Confirm remove"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="grid h-7 w-7 place-items-center rounded-full bg-white text-slate-700"
              aria-label="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white shadow"
          aria-label="Remove"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// One upload slot — supports "Live capture" via input capture=environment or
// plain file picker. Switching modes between the two is one tap.
// ───────────────────────────────────────────────────────────────────────────────
const UploadSlot = ({ slot, onPick, onMode, onClear, onRemoveSlot }) => {
  const inputRef = useRef(null);

  const openPicker = () => inputRef.current?.click();

  if (slot.file && slot.preview) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl border border-brand-200 bg-brand-50">
        <img src={slot.preview} alt="" className="h-full w-full object-cover" />
        <span className="absolute left-1 top-1 rounded-full bg-brand-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          {slot.mode === 'live' ? 'Live' : 'Ready'}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white shadow"
          aria-label="Clear"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-2 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // `capture=environment` cue tells mobile browsers to prefer the rear
        // camera. When the user has chosen 'live' we force this; otherwise
        // we leave it unset so the regular file picker opens.
        {...(slot.mode === 'live' ? { capture: 'environment' } : {})}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onPick(f);
        }}
      />

      <div className="flex w-full justify-center gap-1 text-[10px]">
        <button
          type="button"
          onClick={() => onMode('upload')}
          className={`rounded-full px-2 py-0.5 font-semibold ${slot.mode === 'upload' ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => onMode('live')}
          className={`rounded-full px-2 py-0.5 font-semibold ${slot.mode === 'live' ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Live
        </button>
      </div>

      <button
        type="button"
        onClick={openPicker}
        className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-slate-200"
        aria-label={slot.mode === 'live' ? 'Open camera' : 'Pick file'}
      >
        {slot.mode === 'live' ? <Camera size={18} /> : <ImageIcon size={18} />}
      </button>
      <p className="text-[10px] leading-tight text-slate-500">
        {slot.mode === 'live' ? 'Tap to capture' : 'Tap to upload'}
      </p>

      {/* "x" to drop the slot entirely (so we can shrink below the default 3) */}
      <button
        type="button"
        onClick={onRemoveSlot}
        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-slate-600"
        aria-label="Remove slot"
        title="Remove this slot"
      >
        <X size={11} />
      </button>
    </div>
  );
};

export default ListingImagesPage;
