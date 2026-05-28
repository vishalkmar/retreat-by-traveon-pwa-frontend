import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileSignature, Download, ExternalLink, ArrowRight, Mail, Phone,
  Building2, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';

// "Received contract" — the 5th phase chip for owner-self. Shows the PDF
// that was emailed to them, lets them preview / download it, and points
// to the upload-signed page as the natural next step.

const fmtDate = (v) => (v ? new Date(v).toLocaleString() : '—');

const ReceivedContractPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get(`/owner/properties/by-id/${id}`)
      .then((r) => { if (alive) setProperty(r.data?.data?.property); })
      .catch((err) => toast.error(apiMessage(err, 'Could not load')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const preview = async () => {
    setBusy(true);
    try {
      const res = await api.get(`/owner/properties/by-id/${id}/contract/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not open PDF'));
    } finally {
      setBusy(false);
    }
  };

  const downloadBlob = async () => {
    setBusy(true);
    try {
      const res = await api.get(`/owner/properties/by-id/${id}/contract/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${property?.propertyCode || id}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not download PDF'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="app-shell"><LoadingScreen /></div>;
  if (!property) return null;

  const contract = property.contract || {};
  const hasContract = !!contract.sentAt;

  return (
    <div className="app-shell">
      <TopBar title="Received contract" />
      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 text-white shadow-card">
          <p className="text-xs uppercase tracking-wider text-emerald-100">Step 5 of 7</p>
          <h2 className="mt-1 text-lg font-semibold leading-snug">{property.name}</h2>
          <p className="mt-1 text-xs text-emerald-100">{property.propertyCode}</p>
        </section>

        {!hasContract ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            The reviewer is still preparing your contract. We'll email it to{' '}
            <strong>{property.ownerEmail}</strong> the moment it's ready.
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FileSignature size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">Onboarding contract</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Emailed to <strong>{property.ownerEmail}</strong>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Sent {fmtDate(contract.sentAt)}
                  </p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-700">
                <Row icon={Building2} label="Property" value={property.address} />
                <Row icon={Mail} label="Owner email" value={property.ownerEmail} />
                {property.ownerPhone && <Row icon={Phone} label="Owner phone" value={property.ownerPhone} />}
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" size="md" loading={busy} onClick={preview}>
                  <ExternalLink size={14} /> Preview
                </Button>
                <Button size="md" loading={busy} onClick={downloadBlob}>
                  <Download size={14} /> Download
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next step</p>
              <p className="mt-2 text-sm text-slate-800">
                Print this PDF, sign it, and upload a clean scan or photo.
                Once we have your signed copy, your retreat goes live.
              </p>
              <Button
                size="block"
                className="mt-4"
                onClick={() => navigate(`/owner/self/${id}/upload-signed`)}
              >
                Upload signed copy <ArrowRight size={16} />
              </Button>
            </section>

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

const Row = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={12} className="mt-0.5 shrink-0 text-slate-400" />
    <div className="min-w-0">
      <span className="block text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  </div>
);

export default ReceivedContractPage;
