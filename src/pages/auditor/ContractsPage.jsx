import { useEffect, useState } from 'react';
import {
  FileSignature, Send, ExternalLink, Loader2, CheckCircle2, Clock,
  Building2, Mail, Phone, Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';

const fmtDate = (v) => (v ? new Date(v).toLocaleString() : '—');

/*
  Final step before the owner sees anything in their dashboard: the auditor
  reviews the generated PDF and presses "Send to Owner". Until they do, the
  owner cannot log in via OTP and the contract sits in "Pending release".
*/
const ContractsPage = () => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [finalReady, setFinalReady] = useState([]);
  const [released, setReleased] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/auditor/contracts');
      setPending(r.data?.data?.pending || []);
      setFinalReady(r.data?.data?.finalReady || []);
      setReleased(r.data?.data?.released || []);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not load contracts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSent = (propertyId) => {
    // Move the row from pending into released without re-fetching.
    setPending((cur) => {
      const moved = cur.find((p) => p.id === propertyId);
      const rest = cur.filter((p) => p.id !== propertyId);
      if (moved) setReleased((r) => [
        { ...moved, contract: { ...moved.contract, sentAt: new Date().toISOString() }, status: 'contract_sent' },
        ...r,
      ]);
      return rest;
    });
  };

  const items = tab === 'pending' ? pending : tab === 'final' ? finalReady : released;

  return (
    <div className="app-shell">
      <TopBar title="Incoming contracts" />
      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">

        {/* Intro card */}
        <section className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-card">
          <p className="text-xs uppercase tracking-wider text-amber-100">Auditor responsibility</p>
          <h2 className="mt-1 text-base font-semibold leading-snug">
            Properties approved by the central officer wait here. Upload a
            contract PDF to send it to the owner for e-signing, then complete
            onboarding when the signed copy comes back.
          </h2>
        </section>

        {/* Tabs */}
        <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 text-sm">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 font-semibold inline-flex items-center justify-center gap-1.5 ${tab === 'pending' ? 'bg-white text-amber-700 shadow' : 'text-slate-600'}`}
            onClick={() => setTab('pending')}
          >
            <Clock size={14} /> Pending {pending.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{pending.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 font-semibold inline-flex items-center justify-center gap-1.5 ${tab === 'final' ? 'bg-white text-violet-700 shadow' : 'text-slate-600'}`}
            onClick={() => setTab('final')}
          >
            <FileSignature size={14} /> Final {finalReady.length > 0 && (
              <span className="ml-1 rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{finalReady.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 font-semibold inline-flex items-center justify-center gap-1.5 ${tab === 'released' ? 'bg-white text-emerald-700 shadow' : 'text-slate-600'}`}
            onClick={() => setTab('released')}
          >
            <CheckCircle2 size={14} /> Sent
          </button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-10"><Loader2 size={20} className="animate-spin text-amber-700" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <FileSignature size={28} className="mx-auto text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">
              {tab === 'pending' ? 'No contracts waiting for your signature.' : tab === 'final' ? 'No final contracts waiting to send.' : 'No contracts sent yet.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((p) => (
              <ContractCard key={p.id} property={p} onSent={onSent} editable={tab !== 'released'} mode={tab} reload={load} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

const ContractCard = ({ property, onSent, editable, mode, reload }) => {
  const [busy, setBusy] = useState(false);
  const contract = property.contract || {};

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/auditor/contracts/${property.id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${property.propertyCode || property.id}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not download PDF'));
    }
  };

  const sendToOwner = async () => {
    if (!confirm(`Complete onboarding and email the final contract to ${property.ownerEmail}?`)) return;
    setBusy(true);
    try {
      const r = await api.post(`/auditor/contracts/${property.id}/send-to-owner`);
      const data = r.data?.data || {};
      if (data.emailDelivered === false) {
        toast(`Marked sent (email failed: ${data.emailError || 'service unreachable'}). Owner can still log in directly.`, {
          duration: 8000,
          icon: '⚠️',
        });
      } else {
        toast.success('Final contract emailed to the owner');
      }
      onSent?.(property.id);
      await reload?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not complete'));
    } finally {
      setBusy(false);
    }
  };

  const uploadContract = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('contract', file);
    setBusy(true);
    try {
      await api.post(`/auditor/contracts/${property.id}/upload-contract`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Contract emailed to ${property.ownerEmail}`);
      await reload?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`rounded-2xl border bg-white p-4 shadow-card ${editable ? 'border-amber-200' : 'border-slate-100'}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${editable ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          <FileSignature size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{property.name}</p>
          <p className="truncate text-xs text-slate-500">
            {property.propertyCode || 'No ID yet'} · approved {fmtDate(property.finalApprovedAt || property.approvedAt)}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Mail size={12} className="text-slate-400" />
          <span className="truncate">{property.ownerName} · {property.ownerEmail}</span>
        </div>
        {property.ownerPhone && (
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-slate-400" /> {property.ownerPhone}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Building2 size={12} className="text-slate-400" />
          <span className="truncate">{property.address}</span>
        </div>
      </dl>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
        <div>
          <span className="block font-semibold uppercase tracking-wider">Generated</span>
          {fmtDate(contract.generatedAt)}
        </div>
        <div>
          <span className="block font-semibold uppercase tracking-wider">Sent to owner</span>
          {contract.sentAt ? fmtDate(contract.sentAt) : (
            <span className="text-amber-700">Awaiting your release</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {contract.generatedPdfUrl && (
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={downloadPdf}
          >
            <ExternalLink size={15} /> Download contract PDF
          </Button>
        )}
        {contract.signedPdfUrl && (
          <a
            href={contract.signedPdfUrl}
            download
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800"
          >
            <CheckCircle2 size={15} /> Download owner e-signed PDF
          </a>
        )}
        {contract.finalPdfUrl && (
          <a
            href={contract.finalPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-800"
          >
            <FileSignature size={15} /> View final PDF
          </a>
        )}
        {editable ? (
          mode === 'pending' ? (
            <label className={`inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white ${busy ? 'bg-slate-400' : 'bg-amber-600 hover:bg-amber-700'}`}>
              <Upload size={15} /> {busy ? 'Uploading...' : 'Upload contract and send'}
              <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={busy} onChange={uploadContract} />
            </label>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="w-full bg-violet-700 hover:bg-violet-800 text-white"
              loading={busy}
              onClick={sendToOwner}
            >
              <Send size={15} /> Complete onboarding
            </Button>
          )
        ) : (
          <p className="text-center text-[11px] text-emerald-700 font-semibold inline-flex items-center justify-center gap-1.5">
            <CheckCircle2 size={13} /> Owner has been notified
          </p>
        )}
      </div>
    </li>
  );
};

export default ContractsPage;
