import { useMemo, useState } from 'react';
import { Plus, Trash2, AlertOctagon, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import PhotoUploader from './PhotoUploader.jsx';
import DeepDiveFields from './DeepDiveFields.jsx';
import { ROOM_CATEGORY_OPTIONS, ROOM_PHOTO_CATEGORIES, ROOM_DETAIL_FIELDS } from '../config.js';

/*
  Rooms section is the most structured of all sections. The auditor must:

  1. Confirm the total room count (locked, comes from property.numberOfRooms)
  2. Break the total into categories ("Deluxe — 2 rooms", "Standard — 3 …")
     and the sum must equal the total room count.
  3. Add per-room records for at least 50% of the rooms. Each record has
     mandatory tagged photo captures (entrance / washroom / bedsheet) plus
     optional ones (TV / almirah), an isWindow toggle, room size, A/C, etc.
  4. Confirm the total number of window-rooms at the section level.

  The component is fully controlled — parent owns the entire `value` blob
  and gets a flat `onChange` callback. The blob lives inside
  PropertyField.deepDiveData and is sent up alongside the regular section
  description + photo upload.

  Per-room photos are sent through a separate uploader inside each room
  card; the parent collects them in a flat list and forwards into the
  multipart payload (photos[]) plus tags each url by category in the
  per-room record so the officer can preview them tagged.
*/

const defaultRoomRecord = (idx) => ({
  // local id to keep keys stable across re-renders
  rid: `room-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
  category: '',
  price: null,
  isWindow: false,
  sizeSqft: null,
  washroomType: '',
  hotWater: false,
  ac: false,
  heater: false,
  wifi: false,
  // photos: { [categoryKey]: [url, ...] }  → existing already-uploaded URLs
  // pendingPhotos: { [categoryKey]: File[] } → new files queued for upload
  photos: {},
  pendingPhotos: {},
});

const RoomsSectionEditor = ({ totalRooms, value, onChange, locked }) => {
  const [openRoom, setOpenRoom] = useState(null);
  const total = Math.max(1, Number(totalRooms) || 1);
  const required = Math.ceil(total / 2);

  // Normalize the controlled value so renderers always see arrays.
  const v = useMemo(() => ({
    categories: Array.isArray(value?.categories) ? value.categories : [],
    rooms: Array.isArray(value?.rooms) ? value.rooms : [],
    windowRooms: typeof value?.windowRooms === 'number' ? value.windowRooms : 0,
  }), [value]);

  const patch = (next) => onChange?.({ ...(value || {}), ...next });

  const categoryTotal = v.categories.reduce((s, c) => s + (Number(c.count) || 0), 0);
  const categoriesOk = categoryTotal === total;
  const roomsOk = v.rooms.length >= required;

  // --- Categories ---------------------------------------------------------
  const selectedCategories = v.categories.map((c) => c.name).filter(Boolean);
  const toggleCategory = (name) => {
    const exists = selectedCategories.includes(name);
    patch({
      categories: exists
        ? v.categories.filter((c) => c.name !== name)
        : [...v.categories, { name, count: '' }],
    });
  };
  const updateCategoryCount = (name, count) =>
    patch({ categories: v.categories.map((c) => (c.name === name ? { ...c, count } : c)) });

  // --- Per-room records ---------------------------------------------------
  const addRoom = () => {
    if (v.rooms.length >= total) return;
    const next = defaultRoomRecord(v.rooms.length);
    patch({ rooms: [...v.rooms, next] });
    setOpenRoom(next.rid);
  };
  const updateRoom = (rid, patchObj) =>
    patch({ rooms: v.rooms.map((r) => (r.rid === rid ? { ...r, ...patchObj } : r)) });
  const removeRoom = (rid) =>
    patch({ rooms: v.rooms.filter((r) => r.rid !== rid) });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header — locked total + tally */}
      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Room count</p>
        <div className="mt-2 grid grid-cols-1 gap-2 text-center">
          <Stat label="Total rooms" value={total} hint="from property basics" tone="slate" />
        </div>
        <p className="mt-2 text-[11px] font-medium text-slate-500">
          Add details for at least {required} rooms. Room category counts must total {total}.
        </p>
      </div>

      {/* Window rooms — section-level free integer */}
      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rooms with a window</span>
          <input
            type="number"
            min={0}
            max={total}
            disabled={locked}
            value={v.windowRooms === 0 && value?.windowRooms === undefined ? '' : v.windowRooms}
            onChange={(e) => {
              const raw = e.target.value;
              const num = raw === '' ? 0 : Math.max(0, Math.min(total, parseInt(raw, 10) || 0));
              patch({ windowRooms: num });
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            placeholder={`0 – ${total}`}
          />
        </label>
      </div>

      {/* Categories editor */}
      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Select room categories
        </p>
        {v.categories.length === 0 && (
          <p className="text-xs italic text-slate-400">
            No categories yet. Add at least one (e.g. Deluxe — 2 rooms) so the sum matches {total}.
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ROOM_CATEGORY_OPTIONS.map((name) => {
            const on = selectedCategories.includes(name);
            return (
              <button
                key={name}
                type="button"
                disabled={locked}
                onClick={() => toggleCategory(name)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  on
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
                } disabled:opacity-50`}
              >
                {name}
              </button>
            );
          })}
        </div>
        <div className="mt-3 space-y-2">
          {v.categories.map((c) => (
            <label key={c.name} className="grid grid-cols-[1fr_6rem] items-center gap-2">
              <span className="text-sm font-medium text-slate-700">{c.name}</span>
              <input
                type="number"
                min={0}
                placeholder="# rooms"
                disabled={locked}
                value={c.count ?? ''}
                onChange={(e) => updateCategoryCount(c.name, e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-right disabled:bg-slate-50"
              />
            </label>
          ))}
        </div>
        {v.categories.length > 0 && !categoriesOk && (
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
            <AlertOctagon size={11} /> Categories add up to {categoryTotal}, need {total}.
          </p>
        )}
      </div>

      {/* Per-room records */}
      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Room details
            </p>
            <p className="text-[11px] text-slate-500">
              Capture at least <strong>{required}</strong> rooms (50% of {total}). You've added{' '}
              <strong>{v.rooms.length}</strong>.
            </p>
          </div>
          {!locked && (
            <button
              type="button"
              onClick={addRoom}
              disabled={v.rooms.length >= total}
              className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              <Plus size={11} /> Add room {v.rooms.length + 1}
            </button>
          )}
        </div>

        {v.rooms.length === 0 ? (
          <p className="text-xs italic text-slate-400">
            No rooms detailed yet. Tap "Add room {v.rooms.length + 1}" to start.
          </p>
        ) : (
          <div className="space-y-2">
            {v.rooms.map((room, idx) => (
              <RoomCard
                key={room.rid}
                index={idx + 1}
                room={room}
                open={openRoom === room.rid}
                onToggle={() => setOpenRoom((cur) => (cur === room.rid ? null : room.rid))}
                onChange={(p) => updateRoom(room.rid, p)}
                onRemove={() => removeRoom(room.rid)}
                locked={locked}
                categoryOptions={selectedCategories}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RoomCard = ({ index, room, open, onToggle, onChange, onRemove, locked, categoryOptions = [] }) => {
  const [openPhoto, setOpenPhoto] = useState(null);
  const mandatoryMissing = ROOM_PHOTO_CATEGORIES
    .filter((c) => c.mandatory)
    .filter((c) => {
      const ex = (room.photos?.[c.key] || []).length;
      const pn = (room.pendingPhotos?.[c.key] || []).length;
      return ex + pn === 0;
    })
    .map((c) => c.label);
  const ready = mandatoryMissing.length === 0 && !!room.category?.trim();

  const roomDetailSchema = ROOM_DETAIL_FIELDS.map((field) => (
    field.key === 'category'
      ? { ...field, type: 'select', options: categoryOptions }
      : field
  ));

  const detailFieldsValue = ROOM_DETAIL_FIELDS.reduce((acc, f) => {
    acc[f.key] = room[f.key];
    return acc;
  }, {});

  const patchDetailFields = (next) => onChange(next);

  return (
    <div className={`rounded-2xl border bg-white ${ready ? 'border-emerald-200' : 'border-slate-200'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            Room #{index} {room.category ? `· ${room.category}` : ''}
          </p>
          <p className="text-[11px] text-slate-500">
            {ready
              ? 'Ready'
              : `Missing: ${[
                  !room.category?.trim() && 'category',
                  ...mandatoryMissing.map((l) => `${l} photo`),
                ].filter(Boolean).join(', ')}`}
          </p>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-100 px-3 py-3">
          {/* Photo categories */}
          <div className="space-y-3">
            {ROOM_PHOTO_CATEGORIES.map((cat) => (
              <RoomPhotoBlock
                key={cat.key}
                cat={cat}
                existing={room.photos?.[cat.key] || []}
                pending={room.pendingPhotos?.[cat.key] || []}
                onAdd={(files) => onChange({
                  pendingPhotos: {
                    ...(room.pendingPhotos || {}),
                    [cat.key]: [...(room.pendingPhotos?.[cat.key] || []), ...files],
                  },
                })}
                onRemoveExisting={locked ? null : (url) => onChange({
                  photos: {
                    ...(room.photos || {}),
                    [cat.key]: (room.photos?.[cat.key] || []).filter((u) => u !== url),
                  },
                })}
                onRemovePending={(i) => onChange({
                  pendingPhotos: {
                    ...(room.pendingPhotos || {}),
                    [cat.key]: (room.pendingPhotos?.[cat.key] || []).filter((_, idx) => idx !== i),
                  },
                })}
                locked={locked}
                open={openPhoto === cat.key}
                onToggle={() => setOpenPhoto((cur) => (cur === cat.key ? null : cat.key))}
              />
            ))}
          </div>

          {/* Structured fields */}
          <DeepDiveFields
            schema={roomDetailSchema}
            data={detailFieldsValue}
            onChange={patchDetailFields}
            disabled={locked}
          />

          {!locked && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
            >
              <Trash2 size={11} /> Remove this room
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const RoomPhotoBlock = ({ cat, existing, pending, onAdd, onRemoveExisting, onRemovePending, locked, open, onToggle }) => {
  const count = existing.length + pending.length;
  return (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
    >
      <span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          <Camera size={11} /> {cat.label}{cat.mandatory && <span className="text-rose-500">*</span>}
        </span>
        <span className={`mt-0.5 block text-[11px] font-medium ${count > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          {count > 0 ? `${count} uploaded` : cat.mandatory ? 'Mandatory' : 'Optional'}
        </span>
      </span>
      {open ? <ChevronUp size={15} className="shrink-0 text-slate-400" /> : <ChevronDown size={15} className="shrink-0 text-slate-400" />}
    </button>
    {open && (
      <div className="border-t border-slate-100 p-3">
        <PhotoUploader
          existing={existing}
          pending={pending}
          onAdd={onAdd}
          onRemoveExisting={onRemoveExisting}
          onRemovePending={onRemovePending}
          max={5}
          minimum={cat.mandatory ? 1 : 0}
          disabled={locked}
        />
      </div>
    )}
  </div>
  );
};

const Stat = ({ label, value, hint, tone }) => {
  const toneCls = {
    slate: 'bg-slate-50 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }[tone] || 'bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-xl px-2 py-2 ${toneCls}`}>
      <p className="text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {hint && <p className="text-[10px] opacity-80">{hint}</p>}
    </div>
  );
};

export default RoomsSectionEditor;
