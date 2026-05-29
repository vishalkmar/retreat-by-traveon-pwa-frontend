import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileSignature, Download, ArrowRight, Mail, Building2,
  Info, CheckCircle2, ListChecks, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';

// "Received contract" view for owners whose property was onboarded by an
// auditor. Strictly read-only: shows the PDF that the auditor emailed,
// reminds the owner it is also in their inbox, and lists the steps before
// pointing them to the upload-signed page as the next step. No upload UI
// on this page — that lives on /owner/properties/:code/upload-signed.

const fmtDate = (v) => (v ? new Date(v).toLocaleString() : '—');

const LinkedReceivedContractPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.get(`/owner/properties/${code}`)
      .then((r) => { if (alive) setProperty(r.data?.data?.property); })
      .catch((err) => toast.error(apiMessage(err, 'Could not load')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [code]);

  const download = async () => {
    const url = property?.contract?.finalPdfUrl || property?.contract?.generatedPdfUrl;
    if (!url) return toast.error('Contract PDF is not ready yet');
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${code}.pdf`;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
  };

  if (loading) return <div className="app-shell"><LoadingScreen /></div>;
  if (!property) return null;

  const contract = property.contract || {};
  const hasContract = !!contract.sentAt;

  return (
    <div className="app-shell">
      <TopBar title="Received contract" />
      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        <section className="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-4 text-white shadow-card">
          <p className="text-xs uppercase tracking-wider text-rose-100">Step — Received contract</p>
          <h2 className="mt-1 text-lg font-semibold leading-snug">{property.name}</h2>
          <p className="mt-1 text-xs text-rose-100">{property.propertyCode}</p>
        </section>

        {!hasContract ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Your auditor has not released the contract to you yet. We'll email
            it to <strong>{property.ownerEmail}</strong> the moment they do.
          </div>
        ) : (
          <>
            {/* Email-mirror reminder */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
              <p className="inline-flex items-center gap-2 font-semibold">
                <Mail size={14} /> Also in your inbox
              </p>
              <p className="mt-1">
                The same PDF was emailed to <strong>{property.ownerEmail}</strong> on{' '}
                {fmtDate(contract.sentAt)}. You can review it here or there — both copies are identical.
              </p>
            </div>

            {/* Instructions */}
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Info size={12} /> How to complete
              </p>
              <ol className="mt-2 space-y-2 text-sm text-slate-700">
                <Step icon={ListChecks}>
                  <strong>Read the contract end-to-end</strong> — make sure your
                  property details, owner info and terms are correct.
                </Step>
                <Step icon={ShieldCheck}>
                  <strong>Keep this final signed copy</strong> for your records.
                  No upload is required from your side.
                </Step>
              </ol>
            </section>

            {/* PDF actions */}
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700">
                  <FileSignature size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">Onboarding contract</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Released by your auditor on {fmtDate(contract.sentAt)}
                  </p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-slate-700">
                <Row icon={Building2} value={property.address} />
                <Row icon={Mail} value={property.ownerEmail} />
              </dl>
              <div className="mt-4">
                <Button size="block" onClick={download}>
                  <Download size={14} /> Download
                </Button>
              </div>
            </section>

            {/* Next step CTA */}
            <Button
              size="block"
              className="bg-rose-700 hover:bg-rose-800 text-white"
              onClick={() => navigate(`/owner/properties/${code}/final-preview`)}
            >
              View final preview <ArrowRight size={16} />
            </Button>

            {contract.signedPdfUrl && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <CheckCircle2 size={14} /> You've already uploaded a signed copy
                </p>
                <p className="mt-1">Re-upload from the next step if you need to replace it.</p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const Step = ({ icon: Icon, children }) => (
  <li className="flex items-start gap-2">
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-700">
      <Icon size={12} />
    </span>
    <span className="text-sm">{children}</span>
  </li>
);

const Row = ({ icon: Icon, value }) => (
  <div className="flex items-center gap-2 truncate">
    <Icon size={12} className="shrink-0 text-slate-400" />
    <span className="truncate text-slate-800">{value}</span>
  </div>
);

export default LinkedReceivedContractPage;
