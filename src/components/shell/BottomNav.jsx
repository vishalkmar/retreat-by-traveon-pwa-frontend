import { NavLink } from 'react-router-dom';

// Role-specific bottom tabs. The icons are passed in by the caller so each
// route file controls its own information architecture.

const BottomNav = ({ items }) => (
  <nav className="sticky bottom-0 z-10 grid border-t border-slate-100 bg-white safe-bottom"
       style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
            isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700'
          }`
        }
      >
        <Icon size={20} />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
