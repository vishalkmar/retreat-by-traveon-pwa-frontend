import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileSignature, Send, ExternalLink, CheckCircle2, Sparkles, Mail, Phone,
  Building2, Loader2, Inbox, Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import EmptyState from '../../components/EmptyState.jsx';

/*
  Officer contracts dashboard. Three lifecycle tabs:
    - Sent      — contract delivered, awaiting owner's signed copy.
    - Received  — owner uploaded a signed copy, awaiting listing finalize.
    - Listed    — property is fully completed and live.
  Each row shows a PDF preview link and links into the property review.
*/

const TABS = [
  { key: 'upload',   label: 'Upload',   icon: Upload,       emptyText: 'No final-approved properties need a contract upload.' },
  { key: 'sent',     label: 'Progress', icon: Send,         emptyText: 'Nothing waiting for owner/auditor signature.' },
  { key: 'received', label: 'Received', icon: CheckCircle2, emptyText: 'No signed copies yet.' },
  { key: 'final',    label: 'Final',    icon: FileSignature, emptyText: 'No final contracts waiting.' },
  { key: 'listed',   label: 'Listed',   icon: Sparkles,     emptyText: 'No fully-listed properties yet.' },
];

const fmtDate = (v) => (v ? new Date(v).toLocaleString() : '—');

const ContractsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'upload';
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState({ upload: [], sent: [], received: [], final: [], listed: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get('/officer/contracts')
      .then((r) => { if (alive) setData(r.data?.data || { upload: [], sent: [], received: [], final: [], listed: [] }); })
      .catch((err) => toast.error(apiMessage(err, 'Could not load contracts')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const onTab = (next) => {
    setTab(next);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', next);
      return p;
    });
  };

  const downloadPdf = async (property) => {
    try {
      const res = await api.get(`/officer/contracts/${property.id}/pdf`, { responseType: 'blob' });
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

  const items = data[tab] || [];
  const cfg = TABS.find((t) => t.key === tab);
  const EmptyIcon = cfg.icon;

  return (
    <div className="app-shell">
      <TopBar title="Contracts" back={false} />
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-white px-2 py-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count = (data[t.key] || []).length;
          return (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                tab === t.key ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Icon size={12} /> {t.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  tab === t.key ? 'bg-white text-amber-700' : 'bg-amber-600 text-white'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto p-3 pb-24">
        {loading ? (
          <div className="grid place-items-center py-10">
            <Loader2 size={20} className="animate-spin text-amber-700" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={EmptyIcon} title={cfg.emptyText} />
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((p) => (
              <ContractCard
                key={p.id}
                property={p}
                tab={tab}
                onPreview={() => downloadPdf(p)}
                onChanged={() => {
                  setLoading(true);
                  api.get('/officer/contracts')
                    .then((r) => setData(r.data?.data || { upload: [], sent: [], received: [], final: [], listed: [] }))
                    .finally(() => setLoading(false));
                }}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

const ContractCard = ({ property, tab, onPreview, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const contract = property.contract || {};
  const tone =
    tab === 'sent' ? 'border-sky-200'
    : tab === 'received' ? 'border-emerald-200'
    : 'border-violet-200';
  return (
    <li className={`rounded-2xl border bg-white p-4 shadow-card ${tone}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
          tab === 'listed' ? 'bg-violet-100 text-violet-700'
          : tab === 'received' ? 'bg-emerald-100 text-emerald-700'
          : 'bg-sky-100 text-sky-700'
        }`}>
          <FileSignature size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{property.name}</p>
            {property.source === 'self' && (
              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                Self
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-500">
            {property.propertyCode || 'No ID'} · {property.source === 'self' ? 'Owner-onboarded' : property.auditor?.name ? `by ${property.auditor.name}` : 'Auditor-onboarded'}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-slate-700">
        <div className="flex items-center gap-2 truncate">
          <Mail size={12} className="text-slate-400" />
          <span className="truncate">{property.ownerName} · {property.ownerEmail}</span>
        </div>
        {property.ownerPhone && (
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-slate-400" /> {property.ownerPhone}
          </div>
        )}
        <div className="flex items-center gap-2 truncate">
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
          <span className="block font-semibold uppercase tracking-wider">Sent</span>
          {contract.sentAt
            ? fmtDate(contract.sentAt)
            : <span className="text-amber-700">awaiting release</span>}
        </div>
        <div>
          <span className="block font-semibold uppercase tracking-wider">Signed</span>
          {contract.signedAt
            ? fmtDate(contract.signedAt)
            : <span className="text-slate-400">—</span>}
        </div>
        <div>
          <span className="block font-semibold uppercase tracking-wider">Status</span>
          {property.status.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {contract.generatedPdfUrl && (
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            <ExternalLink size={13} /> Download PDF
          </button>
        )}
        {contract.signedPdfUrl && (
          <a
            href={contract.signedPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
          >
            <CheckCircle2 size={13} /> Signed copy
          </a>
        )}
        {contract.finalPdfUrl && (
          <a
            href={contract.finalPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-100 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-200"
          >
            <FileSignature size={13} /> Final PDF
          </a>
        )}
      </div>

      {tab === 'upload' && (
        <UploadButton
          label={property.source === 'self' ? 'Upload and email owner' : 'Upload for auditor signature'}
          endpoint={`/officer/contracts/${property.id}/upload-initial`}
          field="contract"
          busy={busy}
          setBusy={setBusy}
          onDone={onChanged}
        />
      )}
      {tab === 'received' && (
        property.source === 'self' ? (
          <CompleteButton
            property={property}
            busy={busy}
            setBusy={setBusy}
            onDone={onChanged}
          />
        ) : (
          <UploadButton
            label="Upload officer-signed final"
            endpoint={`/officer/contracts/${property.id}/upload-final`}
            field="contract"
            busy={busy}
            setBusy={setBusy}
            onDone={onChanged}
          />
        )
      )}

      <Link
        to={`/officer/properties/${property.id}`}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800"
      >
        <Inbox size={13} /> Open property
      </Link>
    </li>
  );
};

const CompleteButton = ({ property, busy, setBusy, onDone }) => {
  const onComplete = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/officer/contracts/${property.id}/complete`);
      const payload = res.data?.data;
      if (payload?.emailDelivered === false) {
        toast.success('Marked final. Email delivery failed.');
      } else {
        toast.success('Onboarding completed');
      }
      onDone?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not complete onboarding'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onComplete}
      className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white ${
        busy ? 'bg-slate-400' : 'bg-emerald-700 hover:bg-emerald-800'
      }`}
    >
      <CheckCircle2 size={13} /> {busy ? 'Completing...' : 'Mark final complete'}
    </button>
  );
};

const UploadButton = ({ label, endpoint, field, busy, setBusy, onDone }) => {
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append(field, file);
    setBusy(true);
    try {
      const res = await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const payload = res.data?.data;
      if (payload?.emailDelivered === false) {
        toast.success('Contract uploaded to owner portal. Email delivery failed.');
      } else {
        toast.success('Contract uploaded and email sent');
      }
      onDone?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <label className={`mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white ${busy ? 'bg-slate-400' : 'bg-amber-700 hover:bg-amber-800'}`}>
      <Upload size={13} /> {busy ? 'Uploading...' : label}
      <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={busy} onChange={onPick} />
    </label>
  );
};

export default ContractsPage;
