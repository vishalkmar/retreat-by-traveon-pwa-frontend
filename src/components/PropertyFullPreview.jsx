import {
  DEEP_DIVE_SCHEMA,
  ROOM_DETAIL_FIELDS,
  ROOM_PHOTO_CATEGORIES,
  SECTION_PHOTO_CATEGORIES,
  SECTIONS,
} from '../config.js';

const formatLabel = (key) => key
  .replace(/([A-Z])/g, ' $1')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (ch) => ch.toUpperCase());

const formatValue = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return Object.entries(value)
    .map(([key, entry]) => `${formatLabel(key)}: ${formatValue(entry)}`)
    .join(', ');
  return String(value);
};

const Photos = ({ urls, labelled = false }) => {
  const visible = (urls || []).filter(Boolean);
  if (!visible.length) return <p className="text-xs text-slate-400">No photos uploaded.</p>;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {visible.map((item, idx) => {
        const src = typeof item === 'string' ? item : item.url;
        const label = typeof item === 'string' ? `Photo ${idx + 1}` : item.label;
        return (
          <a
            key={`${src}-${idx}`}
            href={src}
            target="_blank"
            rel="noreferrer"
            className="overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-100"
          >
            <img src={src} alt={label || ''} className="aspect-square w-full object-cover" />
            {labelled && (
              <span className="block truncate bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                {label}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
};

const DetailGrid = ({ title, rows }) => {
  const visible = rows.filter((row) => {
    const v = row.value;
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
  });
  if (!visible.length) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visible.map((row) => (
          <div key={row.label} className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{row.label}</p>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-xs font-medium text-slate-800">
              {formatValue(row.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const sectionPhotoGroups = (sectionKey, field) => {
  const urls = field?.photoUrls || [];
  const data = field?.deepDiveData || {};
  let categories = SECTION_PHOTO_CATEGORIES[sectionKey] || null;

  if (sectionKey === 'cctv') {
    const coverageAreas = Array.isArray(data.coverageAreas) ? data.coverageAreas : [];
    categories = coverageAreas.map((area) => ({ label: `CCTV coverage: ${area}` }));
  }

  if (sectionKey === 'facilities') {
    const required = [
      data.gymPresent === true && { label: 'Gym' },
      data.poolPresent === true && { label: 'Swimming Pool' },
      data.yogaShalaPresent === true && { label: 'Yoga Shala' },
    ].filter(Boolean);
    const extras = Array.from(
      { length: Math.max(0, 3 - required.length) },
      (_, idx) => ({ label: `Facility image ${idx + 1}` }),
    );
    categories = [...required, ...extras];
  }

  if (sectionKey === 'garden') {
    const required = [
      data.waterFeature === true && { label: 'Fountain / Pond Image' },
      data.walkingPathAvailable === true && { label: 'Pathway Image' },
      data.outdoorYoga === true && { label: 'Yoga Setup Image' },
      data.organicGarden === true && { label: 'Plantation Close-up' },
      data.nightLighting === true && { label: 'Evening Lighting Image' },
    ].filter(Boolean);
    const extras = Array.from(
      { length: Math.max(0, 3 - required.length) },
      (_, idx) => ({ label: `Garden image ${idx + 1}` }),
    );
    categories = [...required, ...extras];
  }

  return urls.map((url, idx) => ({
    label: categories?.[idx]?.label || `Photo ${idx + 1}`,
    url,
  }));
};

const RoomDetails = ({ data }) => {
  const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
  const categories = Array.isArray(data?.categories) ? data.categories : [];

  return (
    <div className="space-y-3">
      <DetailGrid
        title="Room summary"
        rows={[
          { label: 'Room categories', value: categories.map((cat) => `${cat.name}: ${cat.count || 0}`).join(', ') },
          { label: 'Rooms with window', value: data?.windowRooms },
          { label: 'Housekeeping frequency', value: data?.housekeepingFrequency },
        ]}
      />

      {rooms.length === 0 ? (
        <p className="text-xs text-slate-400">No individual room details captured.</p>
      ) : (
        <div className="space-y-3">
          {rooms.map((room, idx) => {
            const photoItems = ROOM_PHOTO_CATEGORIES.flatMap((cat) => (
              (room.photos?.[cat.key] || []).map((url) => ({ label: cat.label, url }))
            ));
            const detailRows = ROOM_DETAIL_FIELDS.map((field) => ({
              label: field.label,
              value: room[field.key],
            }));

            return (
              <div key={room.rid || idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">
                  Room #{idx + 1}{room.category ? ` - ${room.category}` : ''}
                </p>
                <div className="mt-3 space-y-3">
                  <DetailGrid title="Room details" rows={detailRows} />
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Room photos
                    </p>
                    <Photos urls={photoItems} labelled />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const DeepDive = ({ sectionKey, data }) => {
  if (!data || Object.keys(data).length === 0) return null;
  if (sectionKey === 'rooms') return <RoomDetails data={data} />;

  const schema = DEEP_DIVE_SCHEMA[sectionKey] || [];
  const schemaRows = schema.map((field) => ({
    label: field.label,
    value: data[field.key],
  }));
  const extraRows = Object.entries(data)
    .filter(([key]) => !schema.some((field) => field.key === key))
    .filter(([key]) => !['rooms', 'categories', 'pendingPhotos'].includes(key))
    .map(([key, value]) => ({ label: formatLabel(key), value }));

  return <DetailGrid title="Structured details" rows={[...schemaRows, ...extraRows]} />;
};

const PropertyFullPreview = ({ fields = [] }) => {
  const fieldByKey = Object.fromEntries(fields.map((field) => [field.sectionKey, field]));
  const captured = SECTIONS.filter((section) => fieldByKey[section.key]);

  if (!captured.length) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Full property preview</p>
        <p className="mt-3 text-xs text-slate-500">No sections captured.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Full property preview ({captured.length})
      </p>
      {captured.map((section) => {
        const field = fieldByKey[section.key];
        return (
          <article key={section.key} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{section.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {(field.photoUrls || []).length} section photo{(field.photoUrls || []).length === 1 ? '' : 's'}
                </p>
              </div>
              {section.required && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Required
                </span>
              )}
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
                  {(field.description || '').trim() || <span className="text-slate-400">No notes provided.</span>}
                </p>
              </div>

              {section.key !== 'rooms' && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Uploaded photos
                  </p>
                  <Photos urls={sectionPhotoGroups(section.key, field)} labelled />
                </div>
              )}

              <DeepDive sectionKey={section.key} data={field.deepDiveData} />
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default PropertyFullPreview;
