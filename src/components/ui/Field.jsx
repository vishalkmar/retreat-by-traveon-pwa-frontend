const Field = ({ label, hint, error, children }) => (
  <label className="flex flex-col gap-1.5">
    {label && (
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span>
    )}
    {children}
    {error ? (
      <span className="text-xs text-rose-600">{error}</span>
    ) : hint ? (
      <span className="text-xs text-slate-500">{hint}</span>
    ) : null}
  </label>
);

export const Input = ({ className = '', ...rest }) => (
  <input
    className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
    {...rest}
  />
);

export const Textarea = ({ className = '', rows = 4, ...rest }) => (
  <textarea
    rows={rows}
    className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
    {...rest}
  />
);

export const Select = ({ className = '', children, ...rest }) => (
  <select
    className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
    {...rest}
  >
    {children}
  </select>
);

export default Field;
