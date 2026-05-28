import { CheckCircle2, XCircle, Circle, ChevronRight, AlertTriangle, Image as ImageIcon } from 'lucide-react';

// Generic section card used by both Auditor and Officer screens. The
// `decision` controls the trailing badge; clickable variant is opt-in.

const DECISION_BADGE = {
  approved: { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50', label: 'Approved' },
  approved_objection: { icon: AlertTriangle, cls: 'text-amber-700 bg-amber-50', label: 'Approved · note' },
  rejected: { icon: XCircle, cls: 'text-rose-600 bg-rose-50', label: 'Objection' },
  pending: { icon: Circle, cls: 'text-slate-500 bg-slate-100', label: 'Pending' },
  not_started: { icon: Circle, cls: 'text-slate-400 bg-slate-50', label: 'Not started' },
};

const SectionStatusCard = ({
  label,
  hint,
  required,
  photos = 0,
  hasText = false,
  decision = 'not_started',
  approvedWithObjection = false,
  comment,
  unreadCount = 0,
  onClick,
}) => {
  const effectiveKey = decision === 'approved' && approvedWithObjection ? 'approved_objection' : decision;
  const badge = DECISION_BADGE[effectiveKey] || DECISION_BADGE.not_started;
  const Icon = badge.icon;
  const Wrapper = onClick ? 'button' : 'div';
  const commentTone = effectiveKey === 'approved_objection'
    ? 'bg-amber-50 text-amber-900'
    : 'bg-rose-50 text-rose-700';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative flex w-full items-start gap-3 rounded-2xl border bg-white p-3 text-left shadow-card ${
        unreadCount > 0 ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-100'
      } ${onClick ? 'hover:border-brand-200' : ''}`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${badge.cls}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold text-slate-900">{label}</span>
          {required && <span className="text-[9px] font-semibold text-rose-500">REQ</span>}
          {unreadCount > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
              NEW {unreadCount > 1 ? unreadCount : ''}
            </span>
          )}
        </span>
        {hint && <span className="block truncate text-xs font-medium text-rose-600">{hint}</span>}
        <span className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <ImageIcon size={11} /> {photos}
          </span>
          <span className={hasText ? 'text-emerald-600' : 'text-slate-400'}>
            {hasText ? 'Notes ✓' : 'No notes'}
          </span>
          <span className={`rounded-full px-1.5 py-0.5 ${badge.cls}`}>{badge.label}</span>
        </span>
        {comment && (
          <span className={`mt-1.5 block rounded-md px-2 py-1.5 text-[11px] ${commentTone}`}>
            {comment}
          </span>
        )}
      </span>
      {onClick && <ChevronRight size={16} className="mt-2 shrink-0 text-slate-300" />}
    </Wrapper>
  );
};

export default SectionStatusCard;
