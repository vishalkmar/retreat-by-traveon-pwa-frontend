import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, FileText, FileCheck2, User as UserIcon, Phone, Mail, MapPin, BedDouble, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 text-sm">
    <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="truncate text-slate-800">{value || '—'}</p>
    </div>
  </div>
);

const TABS = [
  { key: 'contract', label: 'Contract' },
  { key: 'details', label: 'Property' },
  { key: 'auditor', label: 'Auditor' },
];

const OwnerPropertyDetailPage = () => {
  const { code } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('contract');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/owner/properties/${code}`);
      setProperty(r.data?.data?.property);
    } catch {
      toast.error('Could not load');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { load(); }, [load]);

  const uploadSigned = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('signed', file);
      await api.post(`/owner/properties/${code}/sign-upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Signed contract uploaded');
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="app-shell"><LoadingScreen /></div>;
  if (!property) return null;

  const contract = property.contract;
  const signed = !!contract?.signedPdfUrl;

  return (
    <div className="app-shell">
      <TopBar title={property.name} />
      <main className="flex-1 overflow-y-auto p-3 pb-12">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{property.name}</p>
              <p className="truncate text-xs text-slate-500">{property.propertyCode}</p>
            </div>
            <StatusPill status={property.status} />
          </div>
        </section>

        <div className="mt-3 flex gap-1 rounded-full bg-slate-100 p-1 text-xs">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-full px-3 py-1.5 font-semibold ${tab === t.key ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'contract' && (
          <section className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700">
                  <FileText size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">Onboarding contract</p>
                  <p className="text-xs text-slate-500">
                    {contract?.sentAt
                      ? `Sent ${new Date(contract.sentAt).toLocaleDateString()}`
                      : 'Preparing…'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-600">
                We've emailed the contract PDF to <strong>{property.ownerEmail}</strong>. Print it,
                sign it, scan or photograph it, then upload the signed copy below.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${signed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {signed ? <FileCheck2 size={18} /> : <Upload size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {signed ? 'Signed copy uploaded' : 'Upload signed copy'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {signed
                      ? `Uploaded ${new Date(contract.signedAt).toLocaleDateString()}`
                      : 'Accepts PDF or photo (JPG/PNG).'}
                  </p>
                </div>
              </div>
              {signed && (
                <a
                  href={contract.signedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-xs font-semibold text-emerald-700 underline"
                >
                  View uploaded signed contract
                </a>
              )}
              {!signed && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png"
                    hidden
                    onChange={uploadSigned}
                  />
                  <Button
                    size="block"
                    className="mt-3"
                    onClick={() => fileRef.current?.click()}
                    loading={uploading}
                  >
                    <Upload size={16} /> Choose signed file
                  </Button>
                </>
              )}
            </div>
          </section>
        )}

        {tab === 'details' && (
          <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={MapPin} label="Address" value={property.address} />
              <InfoRow icon={BedDouble} label="Rooms" value={property.numberOfRooms} />
              <InfoRow icon={UserIcon} label="Owner" value={property.ownerName} />
              <InfoRow icon={Mail} label="Email" value={property.ownerEmail} />
              <InfoRow icon={Phone} label="Phone" value={property.ownerPhone} />
              <InfoRow icon={IndianRupee} label="Pricing" value={property.pricing} />
            </div>
          </section>
        )}

        {tab === 'auditor' && (
          <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              {property.auditor?.profilePhotoUrl ? (
                <img
                  src={property.auditor.profilePhotoUrl}
                  alt={property.auditor.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-800">
                  {(property.auditor?.name || '?').slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{property.auditor?.name}</p>
                <p className="truncate text-xs text-slate-500">{property.auditor?.email}</p>
                {property.auditor?.phone && (
                  <p className="truncate text-xs text-slate-500">{property.auditor.phone}</p>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              This auditor visited and verified your property on Traveon Retreats' behalf.
            </p>
          </section>
        )}
      </main>
    </div>
  );
};

export default OwnerPropertyDetailPage;
