import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Hash, Mail } from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Input } from '../../components/ui/Field.jsx';

const OwnerLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [propertyCode, setPropertyCode] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const refs = useRef([]);

  const requestOtp = async (e) => {
    e?.preventDefault?.();
    setSubmitting(true);
    try {
      await api.post('/auth/owner/request-otp', { propertyCode: propertyCode.trim(), email });
      toast.success('Code sent');
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
    setSubmitting(true);
    try {
      const r = await api.post('/auth/owner/verify-otp', {
        propertyCode: propertyCode.trim(),
        email,
        code: joined,
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
        <header className="mb-8 text-center">
          <img src="/retreatlogo.png" alt="Retreats by Traveon" className="mx-auto h-20 w-auto object-contain" />
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Property Owner Login</h1>
          <p className="mt-2 text-sm text-slate-500">
            {step === 1
              ? 'Enter your Property ID and registered email.'
              : `Enter the code sent to ${email}.`}
          </p>
        </header>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
          {step === 1 ? (
            <form onSubmit={requestOtp} className="flex flex-col gap-4">
              <Field label="Property ID" hint="Looks like RTV-XXXXXXXX">
                <div className="relative">
                  <Hash size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    required
                    value={propertyCode}
                    onChange={(e) => setPropertyCode(e.target.value.toUpperCase())}
                    placeholder="RTV-ABCDEFGH"
                    className="pl-9 uppercase tracking-wider"
                  />
                </div>
              </Field>
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
              <Button onClick={verify} size="block" loading={submitting} className="mt-6">
                Verify and continue
              </Button>
              <button
                onClick={() => setStep(1)}
                className="mt-3 w-full text-center text-xs font-semibold text-slate-500 hover:underline"
              >
                Use a different Property ID
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
