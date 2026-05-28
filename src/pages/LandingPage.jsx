import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileSignature, ShieldCheck, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_OPTIONS = [
  {
    role: 'auditor',
    label: 'Auditor Login',
    description: 'Capture property details on-site',
    icon: ClipboardCheck,
    accent: 'bg-brand-50 text-brand-700',
  },
  {
    role: 'officer',
    label: 'Centralized Officer Login',
    description: 'Review audits and approve properties',
    icon: ShieldCheck,
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    role: 'salesperson',
    label: 'Salesperson Login',
    description: 'Work availability leads and bookings',
    icon: Briefcase,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    role: 'owner',
    label: 'Property Owner Login',
    description: 'Sign your contract and onboard',
    icon: FileSignature,
    accent: 'bg-rose-50 text-rose-700',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) navigate(`/${role}`, { replace: true });
  }, [user, role, navigate]);

  return (
    <div className="app-shell">
      <div className="app-launch flex flex-1 flex-col justify-center p-6 safe-top safe-bottom">
        <header className="mb-10 text-center">
          <img src="/retreatlogo.png" alt="Retreats by Traveon" className="mx-auto h-20 w-auto object-contain" />
          <p className="mt-3 text-sm font-medium text-slate-500">Property audit & onboarding app</p>
        </header>

        <section className="flex flex-col gap-3">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sign in as
          </p>
          {ROLE_OPTIONS.map(({ role: r, label, description, icon: Icon, accent }) => (
            <button
              key={r}
              onClick={() => navigate(r === 'owner' ? '/owner/login' : `/login?role=${r}`)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300 hover:shadow-card"
            >
              <span className={`grid h-12 w-12 place-items-center rounded-xl ${accent}`}>
                <Icon size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-slate-900">{label}</span>
                <span className="block text-xs text-slate-500">{description}</span>
              </span>
              <span className="text-slate-300 group-hover:text-brand-500">&gt;</span>
            </button>
          ))}
        </section>

        <footer className="mt-10 text-center text-[11px] text-slate-400">
          (c) {new Date().getFullYear()} Traveon Retreats
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
