import { useNavigate } from 'react-router-dom';
import { Bell, Check, AlertOctagon, AlertTriangle, FileSignature, RefreshCcw, Send, Inbox } from 'lucide-react';
import TopBar from '../components/shell/TopBar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

// Each role gets the same list — backend already filters by recipient. We
// just decorate the rows with an icon + a tap-target that deep-links into
// the property the notification is about.

const ICONS = {
  section_objection:           { icon: AlertOctagon, cls: 'bg-rose-50 text-rose-600' },
  section_approved_objection:  { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700' },
  section_approved:            { icon: Check, cls: 'bg-emerald-50 text-emerald-700' },
  section_reupload:            { icon: RefreshCcw, cls: 'bg-sky-50 text-sky-700' },
  property_submitted:          { icon: Inbox, cls: 'bg-sky-50 text-sky-700' },
  property_approved:           { icon: Check, cls: 'bg-emerald-50 text-emerald-700' },
  property_rejected:           { icon: AlertOctagon, cls: 'bg-rose-50 text-rose-600' },
  phase4_submitted:            { icon: Inbox, cls: 'bg-indigo-50 text-indigo-700' },
  phase4_revision:             { icon: RefreshCcw, cls: 'bg-amber-50 text-amber-700' },
  contract_generated:          { icon: FileSignature, cls: 'bg-emerald-50 text-emerald-700' },
  contract_sent_to_owner:      { icon: Send, cls: 'bg-sky-50 text-sky-700' },
  contract_signed:             { icon: Check, cls: 'bg-emerald-50 text-emerald-700' },
};

// Build the deepest-possible link for this notification — section editor
// when we know the section, property detail otherwise, dashboard as a
// last resort. The officer path passes `?section=` so PropertyReviewPage
// can auto-expand the right accordion.
const deepLink = (role, n) => {
  if (!n) return null;
  const sectionKey = n.data?.sectionKey;
  const propertyCode = n.data?.propertyCode;
  const source = n.data?.source;
  const sectionTypes = new Set([
    'section_objection',
    'section_approved',
    'section_approved_objection',
    'section_reupload',
  ]);

  if (role === 'auditor') {
    if (n.type?.startsWith('contract')) return '/auditor/contracts';
    if (n.propertyId && sectionKey && sectionTypes.has(n.type)) {
      return `/auditor/properties/${n.propertyId}/sections/${sectionKey}`;
    }
    if (n.propertyId) return `/auditor/properties/${n.propertyId}`;
    return null;
  }
  if (role === 'officer') {
    if (n.propertyId) {
      if (n.type === 'phase4_submitted' || n.type === 'phase4_revision') {
        return `/officer/properties/${n.propertyId}/phase4`;
      }
      if (sectionKey) return `/officer/properties/${n.propertyId}?section=${sectionKey}`;
      return `/officer/properties/${n.propertyId}`;
    }
    return null;
  }
  if (role === 'owner') {
    // Self-onboarded properties live under /owner/self/:id, auditor-linked
    // ones under /owner/properties/:code.
    if (source === 'self' && n.propertyId) {
      if (sectionKey && sectionTypes.has(n.type)) {
        return `/owner/self/${n.propertyId}/sections/${sectionKey}`;
      }
      if (n.type === 'phase4_submitted' || n.type === 'phase4_revision' || n.type === 'property_approved') {
        return `/owner/self/${n.propertyId}/phase4`;
      }
      return `/owner/self/${n.propertyId}`;
    }
    if (propertyCode) return `/owner/properties/${propertyCode}`;
    return '/owner';
  }
  return null;
};

const formatTime = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { items, unread, markRead, markAllRead, loading, refresh } = useNotifications();

  return (
    <div className="app-shell">
      <TopBar title="Notifications" />
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {loading ? 'Loading…' : `${items.length} total · ${unread} unread`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Refresh
            </button>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-800"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            detail="You'll see review updates, re-uploads, and contract events here."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const meta = ICONS[n.type] || { icon: Bell, cls: 'bg-slate-100 text-slate-600' };
              const Icon = meta.icon;
              const href = deepLink(role, n);
              const onTap = () => {
                if (!n.readAt) markRead(n.id);
                if (href) navigate(href);
              };
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={onTap}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left shadow-sm transition ${
                      n.readAt
                        ? 'border-slate-100 bg-white'
                        : 'border-brand-100 bg-brand-50/40'
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${meta.cls}`}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{n.title}</span>
                        <span className="shrink-0 text-[10px] text-slate-400">{formatTime(n.createdAt)}</span>
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block text-xs text-slate-600">{n.body}</span>
                      )}
                    </span>
                    {!n.readAt && <span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;
