import { Link } from 'react-router-dom';

// Compact stats grid used at the top of every role's home screen so the
// user gets a one-glance snapshot of "what's on my plate today". Each tile
// is optionally clickable and links into the relevant list view.

const StatCardGrid = ({ items }) => {
  if (!items?.length) return null;
  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((it, i) => {
        const Icon = it.icon;
        const inner = (
          <>
            <div className="flex items-center justify-between">
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${it.iconCls}`}>
                {Icon && <Icon size={16} />}
              </span>
              {it.badge && (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {it.badge}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {it.label}
            </p>
            <p className="text-2xl font-bold text-slate-900">{it.value}</p>
            {it.hint && <p className="mt-0.5 text-[10px] text-slate-500">{it.hint}</p>}
          </>
        );
        const className = 'rounded-2xl border border-slate-100 bg-white p-3 shadow-card transition hover:border-brand-200';
        return it.to ? (
          <Link key={i} to={it.to} className={`block ${className}`}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={className}>{inner}</div>
        );
      })}
    </section>
  );
};

export default StatCardGrid;
