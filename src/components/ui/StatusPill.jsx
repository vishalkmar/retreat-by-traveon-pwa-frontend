import { STATUS_COLOR, STATUS_LABEL } from '../../config.js';

const StatusPill = ({ status, className = '' }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
      STATUS_COLOR[status] || 'bg-slate-100 text-slate-700'
    } ${className}`}
  >
    {STATUS_LABEL[status] || status}
  </span>
);

export default StatusPill;
