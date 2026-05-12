// Centralized config. Vite injects values at build-time from .env files.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/pwa';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// 8 audit sections — must match backend constants.js. Kept here so the
// auditor UI can iterate without an extra round-trip.
export const SECTIONS = [
  { key: 'entrance', label: 'Entrance & Facade', required: true, hint: 'Building front, signage, gate.' },
  { key: 'reception', label: 'Reception & Common Area', required: true, hint: 'Lobby, seating, welcome desk.' },
  { key: 'rooms', label: 'Rooms & Washrooms', required: true, hint: 'Cover more than 50% of rooms — bed, bath, lighting.' },
  { key: 'kitchen', label: 'Kitchen & Food', required: true, hint: 'Kitchen hygiene, served meals.' },
  { key: 'cctv', label: 'CCTV', required: false, hint: 'Monitor screens, camera coverage. Skip if not installed.' },
  { key: 'facilities', label: 'Facilities', required: true, hint: 'Pool, gym, Wi-Fi, parking.' },
  { key: 'garden', label: 'Garden Area', required: false, hint: 'Open space, plants. Skip if not present.' },
  { key: 'meditation', label: 'Meditation / Activity Room', required: true, hint: 'Practice space, mats, props.' },
  { key: 'trainer', label: 'Trainer & Certificate', required: true, hint: 'Trainer headshot + visible certificate.' },
];

export const STATUS_LABEL = {
  draft: 'Draft',
  phase1_done: 'Phase 1 done',
  phase3_submitted: 'Submitted',
  in_review: 'Under review',
  in_revision: 'Following up',
  approved: 'Approved',
  rejected: 'Final rejected',
  contract_sent: 'Contract sent',
  contract_signed: 'Contract signed',
  completed: 'Completed',
};

export const STATUS_COLOR = {
  draft: 'bg-slate-100 text-slate-700',
  phase1_done: 'bg-blue-50 text-blue-700',
  phase3_submitted: 'bg-blue-50 text-blue-700',
  in_review: 'bg-amber-50 text-amber-700',
  in_revision: 'bg-rose-50 text-rose-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-800',
  contract_sent: 'bg-teal-50 text-teal-700',
  contract_signed: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
};
