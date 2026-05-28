import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ChevronRight, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api.js';
import { SECTIONS } from '../../config.js';
import TopBar from '../../components/shell/TopBar.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import EmptyState from '../../components/EmptyState.jsx';

// Owner-side mirror of the auditor's Objections triage view, scoped to
// the owner's self-onboarded properties. Each row jumps to the section
// editor under /owner/self/:id/sections/:key so the owner can fix it.

const sectionLabel = (key) => SECTIONS.find((s) => s.key === key)?.label || key;

const OwnerObjectionsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get('/owner/properties', { params: { source: 'self', status: 'following' } })
      .then((r) => { if (alive) setItems(r.data?.data?.items || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // The /owner/properties endpoint doesn't include reviews — fetch each
  // property's detail to grab the per-section decisions. This is a small
  // number of properties so a sequential fetch is fine.
  const [details, setDetails] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const acc = {};
      for (const p of items) {
        try {
          const r = await api.get(`/owner/properties/by-id/${p.id}`);
          if (!alive) return;
          acc[p.id] = r.data?.data?.property?.reviews || [];
        } catch { acc[p.id] = []; }
      }
      if (alive) setDetails(acc);
    })();
    return () => { alive = false; };
  }, [items]);

  const rows = items.flatMap((p) =>
    (details[p.id] || [])
      .filter((r) => r.decision === 'rejected' || (r.decision === 'approved' && r.approvedForFutureReview))
      .map((r) => ({ property: p, review: r })),
  );

  const objectionCount = rows.filter((r) => r.review.decision === 'rejected').length;
  const noteCount = rows.length - objectionCount;

  return (
    <div className="app-shell">
      <TopBar title="Objections" back={false} />
      <main className="flex-1 overflow-y-auto p-3 pb-24">
        {!loading && rows.length > 0 && (
          <div className="mb-3 flex gap-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-rose-700">
              <AlertOctagon size={11} /> {objectionCount} objection{objectionCount === 1 ? '' : 's'}
            </span>
            {noteCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                <AlertTriangle size={11} /> {noteCount} approve-with-note
              </span>
            )}
          </div>
        )}

        {loading ? (
          <LoadingScreen />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={AlertOctagon}
            title="No objections"
            detail="Centralize hasn't flagged anything on your self-onboarded properties."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map(({ property, review }) => {
              const isObjection = review.decision === 'rejected';
              const tone = isObjection
                ? { border: 'border-rose-200', bg: 'bg-rose-50', icon: AlertOctagon, iconBg: 'bg-rose-100 text-rose-700', tag: 'bg-rose-600 text-white', tagLabel: 'OBJECTION' }
                : { border: 'border-amber-200', bg: 'bg-amber-50', icon: AlertTriangle, iconBg: 'bg-amber-100 text-amber-700', tag: 'bg-amber-600 text-white', tagLabel: 'NOTE' };
              const Icon = tone.icon;
              return (
                <li key={`${property.id}-${review.sectionKey}`}>
                  <Link
                    to={`/owner/self/${property.id}/sections/${review.sectionKey}`}
                    className={`flex items-start gap-3 rounded-2xl border bg-white p-3 shadow-card hover:brightness-105 ${tone.border}`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone.iconBg}`}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${tone.tag}`}>
                          {tone.tagLabel}
                        </span>
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {sectionLabel(review.sectionKey)}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {property.name} · {property.propertyCode || 'No ID'}
                      </p>
                      {review.comment && (
                        <p className={`mt-1.5 rounded-md px-2 py-1.5 text-[11px] ${tone.bg}`}>
                          {review.comment}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Tap to fix this section →
                      </p>
                    </div>
                    <ChevronRight size={16} className="mt-2 shrink-0 text-slate-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default OwnerObjectionsPage;
