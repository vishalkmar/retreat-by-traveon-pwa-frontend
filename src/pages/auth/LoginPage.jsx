import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Mail } from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Input } from '../../components/ui/Field.jsx';

const LoginPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const role = params.get('role') === 'officer' ? 'officer' : 'auditor';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await api.post('/auth/login', { role, email, password });
      const data = r.data?.data;
      if (data?.requiresEmailVerification) {
        toast('Verify your email to continue', { icon: 'lock' });
        navigate(`/login/otp?role=${role}&email=${encodeURIComponent(email)}`);
        return;
      }
      login(data.token, data.role, data.user);
      toast.success('Welcome back!');
      navigate(`/${data.role}`, { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const title = role === 'officer' ? 'Centralized Officer Login' : 'Auditor Login';
  const subtitle = role === 'officer'
    ? 'Sign in to review property audits.'
    : 'Sign in to start auditing properties on-site.';

  return (
    <div className="app-shell">
      <main className="app-launch flex flex-1 flex-col justify-center p-6 safe-top safe-bottom">
        <header className="mb-8 text-center">
          <img src="/retreatlogo.png" alt="Retreats by Traveon" className="mx-auto h-20 w-auto object-contain" />
          <h1 className="mt-5 text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </header>

        <form onSubmit={onSubmit} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-4">
            <Field label="Email">
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="you@traveon.com"
                />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="********"
                />
              </div>
            </Field>

            <Button type="submit" size="block" loading={submitting}>
              Sign in
            </Button>
          </div>
        </form>

        <Link to="/" className="mt-5 text-center text-xs font-semibold text-slate-500">
          Choose another login type
        </Link>
      </main>
    </div>
  );
};

export default LoginPage;
