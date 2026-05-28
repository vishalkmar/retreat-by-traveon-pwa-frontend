import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import TopBar from '../../components/shell/TopBar.jsx';

// 6-digit OTP input with auto-focus advance. Backend already auto-issued
// the OTP when login() returned requiresEmailVerification, so on mount we
// just show the input. "Resend" hits POST /auth/resend-otp.

const OtpPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const role = params.get('role') === 'officer' ? 'officer' : 'auditor';
  const email = params.get('email') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

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

  const submit = async () => {
    const joined = code.join('');
    if (joined.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setSubmitting(true);
    try {
      const r = await api.post('/auth/verify-otp', { role, email, code: joined });
      const data = r.data?.data;
      login(data.token, data.role, data.user);
      toast.success('Verified!');
      navigate(`/${data.role}`, { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, 'Invalid code'));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const r = await api.post('/auth/resend-otp', { role, email });
      const data = r.data?.data || {};
      if (data.devCode) {
        toast.success(`Dev code: ${data.devCode}`, { duration: 8000 });
      } else if (data.emailDelivered === false) {
        toast('Email service unreachable — check the server console for the code', { duration: 6000 });
      } else {
        toast.success('Code re-sent');
      }
    } catch (err) {
      toast.error(apiMessage(err, 'Could not resend'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="app-shell">
      <TopBar title="Verify Email" />
      <div className="flex-1 p-5">
        <p className="text-sm text-slate-500">
          We've sent a 6-digit code to <strong className="text-slate-700">{email}</strong>.
          Enter it below to continue.
        </p>

        <div className="mt-8 grid grid-cols-6 gap-2">
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onPaste={onPaste}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
              }}
              className="h-14 rounded-xl border border-slate-200 bg-white text-center text-xl font-semibold text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          ))}
        </div>

        <Button onClick={submit} size="block" loading={submitting} className="mt-8">
          Verify
        </Button>

        <button
          onClick={resend}
          disabled={resending}
          className="mt-4 w-full text-center text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50"
        >
          {resending ? 'Resending…' : 'Resend code'}
        </button>
      </div>
    </div>
  );
};

export default OtpPage;
