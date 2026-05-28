import { useNavigate } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';

/*
  Horizontal phase chips for one property. Labels and routes are role-aware
  so the same property looks right from auditor / officer / owner-self /
  owner perspectives — e.g. the post-Phase-4 chip says "Received contract"
  for the owner (they receive it in their inbox) but "Contract" for the
  auditor (who releases it).
*/

// Per-role labels for the chips that mean different things to each actor.
// Owners receive a contract; auditors send one. Owners upload the signed
// version, then the listing goes live. Officers see the same property
// progress but from the reviewing side.
const LABELS = {
  contract: {
    auditor:    'Contract',
    officer:    'Sent contracts',
    owner:      'Received contract',
    'owner-self': 'Received contract',
  },
  signed: {
    auditor:    'Signed',
    officer:    'Received signed',
    owner:      'Sent contract',
    'owner-self': 'Sent contract',
  },
  final: {
    auditor:    'Listed',
    officer:    'Listed',
    owner:      'Final preview',
    'owner-self': 'Final preview',
  },
};

const PHASE_CONFIG = [
  {
    key: 'basics',
    label: () => 'Basics',
    unlock: ['draft'],
    done: [
      'phase1_done', 'phase3_submitted', 'in_review', 'in_revision',
      'approved', 'phase4_submitted', 'phase4_in_revision', 'final_approved',
      'contract_sent', 'contract_signed', 'completed',
    ],
    routeFor: () => null, // basics are captured in the new-property form
  },
  {
    key: 'id',
    label: () => 'ID',
    unlock: ['phase1_done'],
    done: [
      'phase3_submitted', 'in_review', 'in_revision',
      'approved', 'phase4_submitted', 'phase4_in_revision', 'final_approved',
      'contract_sent', 'contract_signed', 'completed',
    ],
    routeFor: (role, id) => {
      if (role === 'auditor') return `/auditor/properties/${id}/generate-id`;
      if (role === 'owner-self') return `/owner/self/${id}/generate-id`;
      return null;
    },
  },
  {
    key: 'capture',
    label: () => 'Phase 3',
    unlock: ['phase1_done', 'in_revision'],
    active: ['phase3_submitted', 'in_review'],
    done: [
      'approved', 'phase4_submitted', 'phase4_in_revision', 'final_approved',
      'contract_sent', 'contract_signed', 'completed',
    ],
    routeFor: (role, id) => {
      if (role === 'auditor') return `/auditor/properties/${id}/capture`;
      if (role === 'officer') return `/officer/properties/${id}`;
      if (role === 'owner-self') return `/owner/self/${id}/capture`;
      return null;
    },
  },
  {
    key: 'phase4',
    label: () => 'Phase 4',
    unlock: ['approved', 'phase4_in_revision'],
    active: ['phase4_submitted'],
    done: ['final_approved', 'contract_sent', 'contract_signed', 'completed'],
    routeFor: (role, id) => {
      if (role === 'auditor') return `/auditor/properties/${id}/phase4`;
      if (role === 'officer') return `/officer/properties/${id}/phase4`;
      if (role === 'owner-self') return `/owner/self/${id}/phase4`;
      return null;
    },
  },
  {
    key: 'contract',
    label: (role) => LABELS.contract[role] || 'Contract',
    unlock: ['final_approved'],
    active: ['contract_sent'],
    done: ['contract_signed', 'completed'],
    routeFor: (role, id, propertyCode) => {
      if (role === 'auditor') return '/auditor/contracts';
      if (role === 'officer') return '/officer/contracts';
      if (role === 'owner-self' && id) return `/owner/self/${id}/received-contract`;
      if (role === 'owner' && propertyCode) return `/owner/properties/${propertyCode}/received-contract`;
      return null;
    },
  },
  {
    key: 'signed',
    label: (role) => LABELS.signed[role] || 'Signed',
    unlock: ['contract_sent'],
    active: ['contract_signed'],
    done: ['completed'],
    routeFor: (role, id, propertyCode) => {
      if (role === 'officer') return '/officer/contracts?tab=received';
      if (role === 'owner-self' && id) return `/owner/self/${id}/upload-signed`;
      if (role === 'owner' && propertyCode) return `/owner/properties/${propertyCode}/upload-signed`;
      return null;
    },
  },
  {
    key: 'final',
    label: (role) => LABELS.final[role] || 'Final',
    unlock: ['contract_signed'],
    done: ['completed'],
    routeFor: (role, id, propertyCode) => {
      if (role === 'owner-self' && id) return `/owner/self/${id}/final-preview`;
      if (role === 'owner' && propertyCode) return `/owner/properties/${propertyCode}/final-preview`;
      return null;
    },
  },
];

const stateFor = (cfg, status) => {
  if (cfg.done?.includes(status)) return 'done';
  if (cfg.active?.includes(status)) return 'active';
  if (cfg.unlock?.includes(status)) return 'current';
  return 'locked';
};

const TONE = {
  done:    { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600' },
  current: { chip: 'bg-brand-50 text-brand-800 border-brand-200', dot: 'bg-brand-700' },
  active:  { chip: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-600' },
  locked:  { chip: 'bg-slate-50 text-slate-400 border-slate-200', dot: 'bg-slate-300' },
};

const PhaseTracker = ({ role = 'auditor', propertyId, propertyCode, status }) => {
  const navigate = useNavigate();
  const { items: notifs } = useNotifications();

  const propertyUnread = notifs.filter(
    (n) => n.propertyId === propertyId && !n.readAt,
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {PHASE_CONFIG.map((cfg) => {
        const state = stateFor(cfg, status);
        const target = cfg.routeFor(role, propertyId, propertyCode);
        const tone = TONE[state];
        const dotCount = propertyUnread.filter((n) => {
          if (cfg.key === 'capture') return ['section_objection', 'section_approved', 'section_approved_objection', 'section_reupload', 'property_submitted', 'property_approved'].includes(n.type);
          if (cfg.key === 'phase4') return ['phase4_submitted', 'phase4_revision'].includes(n.type);
          if (cfg.key === 'contract') return ['contract_generated', 'contract_sent_to_owner'].includes(n.type);
          if (cfg.key === 'signed') return n.type === 'contract_signed';
          if (cfg.key === 'final') return n.type === 'listing_completed';
          return false;
        }).length;
        const clickable = target && state !== 'locked';
        return (
          <button
            key={cfg.key}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && navigate(target)}
            className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${tone.chip} ${clickable ? 'hover:brightness-105' : 'cursor-default'}`}
          >
            {state === 'done' ? (
              <Check size={12} />
            ) : state === 'locked' ? (
              <Lock size={11} />
            ) : (
              <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
            )}
            <span>{cfg.label(role)}</span>
            {dotCount > 0 && (
              <span className="ml-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">
                {dotCount > 9 ? '9+' : dotCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PhaseTracker;
