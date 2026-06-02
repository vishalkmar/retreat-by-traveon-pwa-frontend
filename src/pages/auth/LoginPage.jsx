import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, Mail, Phone, User } from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Input } from '../../components/ui/Field.jsx';

/*
  Unified login. One email box for everyone — email is the unique key across
  all three roles. POST /auth/identify tells us how to continue:

    • method 'password' (auditor / officer) → show a password field, then
      POST /auth/login. If the account's email isn't verified yet the server
      issues an OTP and we drop into the OTP step (otpMode = role).

    • method 'otp' (owner, incl. first-time self-onboarders) → request an
      email OTP and drop into the OTP step (otpMode = 'owner'). First-time
      owners also capture name + phone there.
*/

const ROLE_LABEL = {
  auditor: 'Auditor',
  officer: 'Centralized Officer',
  owner: 'Property Owner',
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, role: sessionRole, login } = useAuth();

  // step: 'email' | 'password' | 'otp'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(null); // resolved role for this email
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // OTP state
  const [otpMode, setOtpMode] = useState(null); // 'owner' | 'auditor' | 'officer'
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const refs = useRef([]);

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    if (user && sessionRole) navigate(`/${sessionRole}`, { replace: true });
  }, [user, sessionRole, navigate]);

  const resetToEmail = () => {
    setStep('email');
    setPassword('');
    setRole(null);
    setOtpMode(null);
    setNeedsProfile(false);
    setCode(['', '', '', '', '', '']);
    setName('');
    setPhone('');
  };

  // -- Step 1: identify the email ---------------------------------------
  const onIdentify = async (e) => {
    e.preventDefault();
    const normalized = email.trim();
    if (!normalized) return toast.error('Enter your email');
    setSubmitting(true);
    try {
      const r = await api.post('/auth/identify', { email: normalized });
      const data = r.data?.data || {};
      setEmail(data.email || normalized);
      setRole(data.role || null);
      if (data.method === 'password') {
        setStep('password');
      } else {
        await requestOwnerOtp(data.email || normalized);
      }
    } catch (err) {
      toast.error(apiMessage(err, 'Could not continue'));
    } finally {
      setSubmitting(false);
    }
  };

  // -- Owner OTP request ------------------------------------------------
  const requestOwnerOtp = async (targetEmail) => {
    const r = await api.post('/auth/owner/email/request-otp', { email: targetEmail });
    const data = r.data?.data || {};
    setNeedsProfile(!!data.needsProfile);
    setOtpMode('owner');
    setRole('owner');
    if (data.emailDelivered === false) {
      toast.error(`Email failed: ${data.emailError || 'unknown'}`, { duration: 10000 });
      if (data.devCode) toast(`Dev code: ${data.devCode}`, { duration: 12000, icon: '🔑' });
    } else {
      toast.success('Code sent to your email');
    }
    setStep('otp');
    setCode(['', '', '', '', '', '']);
    setTimeout(() => refs.current[0]?.focus(), 50);
  };

  // -- Step 2a: password login (auditor / officer) ----------------------
  const onPasswordLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await api.post('/auth/login', { role, email, password });
      const data = r.data?.data;
      if (data?.requiresEmailVerification) {
        // Account exists but email not verified — server issued an OTP.
        setOtpMode(role);
        if (data.devCode) {
          toast.success(`Dev code: ${data.devCode}`, { duration: 8000 });
        } else if (data.emailDelivered === false) {
          toast('Email service unreachable — check the server console for the code', { duration: 6000 });
        } else {
          toast('Verify your email to continue', { icon: '🔒' });
        }
        setStep('otp');
        setCode(['', '', '', '', '', '']);
        setTimeout(() => refs.current[0]?.focus(), 50);
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

  // -- OTP input helpers ------------------------------------------------
  const setDigit = (idx, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < 5) refs.current[idx + 1]?.focus();
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    text.split('').forEach((d, i) => { next[i] = d; });
    setCode(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  // -- Step 2b: verify OTP (owner or auditor/officer email verify) ------
  const onVerifyOtp = async () => {
    const joined = code.join('');
    if (joined.length !== 6) return toast.error('Enter the 6-digit code');
    if (otpMode === 'owner' && needsProfile && !name.trim()) {
      return toast.error('Enter your name');
    }
    setSubmitting(true);
    try {
      let data;
      if (otpMode === 'owner') {
        const r = await api.post('/auth/owner/email/verify-otp', {
          email: email.trim(),
          code: joined,
          name: name.trim(),
          phone: phone.trim(),
        });
        data = r.data?.data;
      } else {
        const r = await api.post('/auth/verify-otp', {
          role: otpMode,
          email: email.trim(),
          code: joined,
        });
        data = r.data?.data;
      }
      login(data.token, data.role, data.user);
      toast.success('Welcome!');
      navigate(`/${data.role}`, { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, 'Invalid code'));
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    setSubmitting(true);
    try {
      if (otpMode === 'owner') {
        await requestOwnerOtp(email.trim());
      } else {
        const r = await api.post('/auth/resend-otp', { role: otpMode, email: email.trim() });
        const data = r.data?.data || {};
        if (data.devCode) toast.success(`Dev code: ${data.devCode}`, { duration: 8000 });
        else toast.success('Code re-sent');
      }
    } catch (err) {
      toast.error(apiMessage(err, 'Could not resend'));
    } finally {
      setSubmitting(false);
    }
  };

  // -- Render -----------------------------------------------------------
  const subtitle =
    step === 'email'
      ? 'Sign in with your email to continue.'
      : step === 'password'
        ? `Enter the password for your ${ROLE_LABEL[role] || ''} account.`
        : `Enter the 6-digit code sent to ${email}.`;

  return (
    <div className="app-shell">
      <main className="app-launch flex flex-1 flex-col justify-center p-6 safe-top safe-bottom">
        <header className="mb-8 text-center">
          <img src="/retreatlogo.png" alt="Retreats by Traveon" className="mx-auto h-20 w-auto object-contain" />
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </header>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
          {step === 'email' && (
            <form onSubmit={onIdentify} className="flex flex-col gap-4">
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
              <Button type="submit" size="block" loading={submitting}>
                Continue
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={onPasswordLogin} className="flex flex-col gap-4">
              <Field label="Email">
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input value={email} disabled className="pl-9 opacity-70" />
                </div>
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="password"
                    required
                    autoFocus
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
            </form>
          )}

          {step === 'otp' && (
            <>
              <div className="grid grid-cols-6 gap-2" onPaste={onPaste}>
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

              {otpMode === 'owner' && needsProfile && (
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

              <Button onClick={onVerifyOtp} size="block" loading={submitting} className="mt-6">
                Verify and continue
              </Button>
              <button
                type="button"
                onClick={resendOtp}
                disabled={submitting}
                className="mt-3 w-full text-center text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </>
          )}
        </section>

        {step !== 'email' && (
          <button
            type="button"
            onClick={resetToEmail}
            className="mt-5 flex items-center justify-center gap-1 text-center text-xs font-semibold text-slate-500 hover:underline"
          >
            <ArrowLeft size={14} /> Use a different email
          </button>
        )}
      </main>
    </div>
  );
};

export default LoginPage;
