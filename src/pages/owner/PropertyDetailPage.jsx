import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FileSignature, Upload, FileCheck2, Sparkles, ChevronRight,
  User as UserIcon, Phone, Mail, MapPin, BedDouble, IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import StatusPill from '../../components/ui/StatusPill.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';
import PhaseTracker from '../../components/PhaseTracker.jsx';

// Landing page for an auditor-linked property. Tabs let the owner jump
// between contract steps, property facts, and the auditor's profile. The
// Contract tab is now a hub of three quick-link cards pointing into the
// dedicated step pages — no more mixed view + upload on one screen.

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

  if (loading) return <div className="app-shell"><LoadingScreen /></div>;
  if (!property) return null;

  const contract = property.contract || {};
  const receivedReady = !!contract.sentAt;
  const uploadReady = !!contract.sentAt; // upload page is reachable any time the contract was sent
  const signed = !!contract.signedPdfUrl;
  const live = property.status === 'completed';

  return (
    <div className="app-shell">
      <TopBar title={property.name} />
      <main className="flex-1 overflow-y-auto p-3 pb-24">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{property.name}</p>
              <p className="truncate text-xs text-slate-500">{property.propertyCode}</p>
            </div>
            <StatusPill status={property.status} />
          </div>
        </section>

        <section className="mt-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Phase progress</p>
          <div className="mt-2">
            <PhaseTracker
              role="owner"
              propertyId={property.id}
              propertyCode={property.propertyCode}
              status={property.status}
            />
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
          <section className="mt-4 space-y-2">
            <StepCard
              to={receivedReady ? `/owner/properties/${code}/received-contract` : null}
              disabled={!receivedReady}
              icon={FileSignature}
              iconCls="bg-rose-100 text-rose-700"
              title="Received contract"
              subtitle={
                receivedReady
                  ? `Released on ${new Date(contract.sentAt).toLocaleDateString()} — preview the PDF and read terms.`
                  : 'Your auditor has not released the contract yet.'
              }
            />
            <StepCard
              to={uploadReady ? `/owner/properties/${code}/upload-signed` : null}
              disabled={!uploadReady}
              icon={signed ? FileCheck2 : Upload}
              iconCls={signed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
              title={signed ? 'Sent contract' : 'Upload signed copy'}
              subtitle={
                signed
                  ? `Uploaded on ${new Date(contract.signedAt).toLocaleDateString()} — re-upload from here if needed.`
                  : uploadReady
                    ? 'Sign the PDF then upload it here. Auditor gets the confirmation.'
                    : 'Available once the contract has been released to you.'
              }
            />
            <StepCard
              to={signed ? `/owner/properties/${code}/final-preview` : null}
              disabled={!signed}
              icon={Sparkles}
              iconCls={live ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}
              title="Final preview"
              subtitle={
                live
                  ? 'Listing is live — view the full onboarding summary.'
                  : signed
                    ? 'Listing flips live the moment we finalize — preview your record here.'
                    : 'Unlocks after you upload the signed copy.'
              }
            />
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
                <p className="truncate font-semibold text-slate-900">{property.auditor?.name || '—'}</p>
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

const StepCard = ({ to, disabled, icon: Icon, iconCls, title, subtitle }) => {
  const inner = (
    <div className="flex items-start gap-3">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconCls}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${disabled ? 'text-slate-400' : 'text-slate-900'}`}>{title}</p>
        <p className={`mt-0.5 text-xs ${disabled ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>
      </div>
      {!disabled && <ChevronRight size={18} className="mt-2 shrink-0 text-slate-300" />}
    </div>
  );
  if (disabled) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 cursor-not-allowed">
        {inner}
      </div>
    );
  }
  return (
    <Link to={to} className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition hover:border-rose-200">
      {inner}
    </Link>
  );
};

export default OwnerPropertyDetailPage;
