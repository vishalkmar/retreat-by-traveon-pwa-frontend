import { CheckCircle2, XCircle, Circle, ChevronRight, Image as ImageIcon } from 'lucide-react';

// Generic section card used by both Auditor and Officer screens. The
// `decision` controls the trailing badge; clickable variant is opt-in.

const DECISION_BADGE = {
  approved: { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50', label: 'Approved' },
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
  comment,
  onClick,
}) => {
  const badge = DECISION_BADGE[decision] || DECISION_BADGE.not_started;
  const Icon = badge.icon;
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-card ${onClick ? 'hover:border-brand-200' : ''}`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${badge.cls}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold text-slate-900">{label}</span>
          {required && <span className="text-[9px] font-semibold text-rose-500">REQ</span>}
        </span>
        {hint && <span className="block truncate text-xs text-slate-500">{hint}</span>}
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
          <span className="mt-1.5 block rounded-md bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">
            {comment}
          </span>
        )}
      </span>
      {onClick && <ChevronRight size={16} className="mt-2 shrink-0 text-slate-300" />}
    </Wrapper>
  );
};

export default SectionStatusCard;
