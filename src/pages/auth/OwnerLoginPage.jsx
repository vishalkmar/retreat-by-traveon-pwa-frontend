import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, User, Phone } from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Input } from '../../components/ui/Field.jsx';

/*
  Single owner login flow: email → OTP. On first verify the form also
  captures the owner's name and (optionally) phone. After login the owner
  picks a mode in their dashboard (auditor-linked properties vs.
  self-onboarded ones), so a single login type is enough.
*/

const OwnerLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef([]);

  const requestOtp = async (e) => {
    e?.preventDefault?.();
    setSubmitting(true);
    try {
      const r = await api.post('/auth/owner/email/request-otp', { email: email.trim() });
      const data = r.data?.data || {};
      setNeedsProfile(!!data.needsProfile);
      if (data.emailDelivered === false) {
        // Email genuinely failed (Brevo not configured / sender not verified
        // / quota / IP whitelist). Show the underlying reason loud so the
        // dev can fix the env, plus the dev code as a temporary unlock.
        toast.error(`Email failed: ${data.emailError || 'unknown'}`, { duration: 10000 });
        if (data.devCode) {
          toast(`Dev code: ${data.devCode}`, { duration: 12000, icon: '🔑' });
        }
      } else {
        toast.success('Code sent to your email');
      }
      setStep(2);
      setTimeout(() => refs.current[0]?.focus(), 50);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not send code'));
    } finally {
      setSubmitting(false);
    }
  };

  const setDigit = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    setCode((prev) => {
      const n = [...prev];
      n[idx] = v;
      return n;
    });
    if (v && idx < 5) refs.current[idx + 1]?.focus();
  };

  const verify = async () => {
    const joined = code.join('');
    if (joined.length !== 6) return toast.error('Enter the 6-digit code');
    if (needsProfile && !name.trim()) return toast.error('Enter your name');
    setSubmitting(true);
    try {
      const r = await api.post('/auth/owner/email/verify-otp', {
        email: email.trim(),
        code: joined,
        name: name.trim(),
        phone: phone.trim(),
      });
      const data = r.data?.data;
      login(data.token, data.role, data.user);
      toast.success('Welcome!');
      navigate('/owner', { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, 'Invalid code'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <main className="app-launch flex flex-1 flex-col justify-center p-6 safe-top safe-bottom">
        <header className="mb-6 text-center">
          <img src="/retreatlogo.png" alt="Retreats by Traveon" className="mx-auto h-20 w-auto object-contain" />
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Property Owner Login</h1>
          <p className="mt-2 text-sm text-slate-500">
            {step === 1
              ? 'Sign in with your email — you can self-onboard or view properties your auditor added.'
              : `Enter the code sent to ${email}.`}
          </p>
        </header>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
          {step === 1 ? (
            <form onSubmit={requestOtp} className="flex flex-col gap-4">
              <Field label="Email">
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </Field>
              <Button type="submit" size="block" loading={submitting}>
                Send code
              </Button>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-6 gap-2">
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (refs.current[i] = el)}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
                    }}
                    className="h-14 rounded-xl border border-slate-200 bg-white text-center text-xl font-semibold text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                ))}
              </div>

              {needsProfile && (
              <div className="mt-5 space-y-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  First time? Tell us about you
                </p>
                <Field label="Your name" hint="Required on first login">
                  <div className="relative">
                    <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      placeholder="Full name"
                    />
                  </div>
                </Field>
                <Field label="Mobile (optional)">
                  <div className="relative">
                    <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9"
                      placeholder="+91…"
                    />
                  </div>
                </Field>
              </div>
              )}

              <Button onClick={verify} size="block" loading={submitting} className="mt-6">
                Verify and continue
              </Button>
              <button
                onClick={() => setStep(1)}
                className="mt-3 w-full text-center text-xs font-semibold text-slate-500 hover:underline"
              >
                Use a different email
              </button>
            </>
          )}
        </section>

        <Link to="/" className="mt-5 text-center text-xs font-semibold text-slate-500">
          Choose another login type
        </Link>
      </main>
    </div>
  );
};

export default OwnerLoginPage;
