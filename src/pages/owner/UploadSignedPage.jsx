import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload, FileCheck2, FileText, RefreshCcw, ArrowRight, Filter,
  CheckCircle2, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import LoadingScreen from '../../components/LoadingScreen.jsx';

// 6th-phase page for owner-self: upload the signed contract back and see
// the current uploaded version. Once we wire the backend to keep older
// versions, this list will grow naturally. For now there is at most one
// row at a time, and re-uploading replaces it.

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'uploaded', label: 'Uploaded' },
];

const fmtDate = (v) => (v ? new Date(v).toLocaleString() : '—');

const UploadSignedPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const r = await api.get(`/owner/properties/by-id/${id}`);
      setProperty(r.data?.data?.property);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not load'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const pickFile = () => fileRef.current?.click();

  const onPicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const fd = new FormData();
    fd.append('signed', file);
    setUploading(true);
    try {
      await api.post(`/owner/self-properties/${id}/sign-upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Signed copy uploaded. Officer final signature is in progress.');
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="app-shell"><LoadingScreen /></div>;
  if (!property) return null;

  const contract = property.contract || {};
  const hasSigned = !!contract.signedPdfUrl;

  // The "history" list — currently one row, but the structure is the same
  // as a list so adding versioning later is a one-line change.
  const allRows = hasSigned ? [{
    id: 'current',
    status: 'uploaded',
    fileUrl: contract.signedPdfUrl,
    fileName: contract.signedOriginalName || `signed-${property.propertyCode || id}`,
    mimeType: contract.signedMimeType,
    uploadedAt: contract.signedAt,
    uploadedBy: contract.ownerSignedByEmail,
  }] : [{
    id: 'pending',
    status: 'pending',
    fileName: 'Not uploaded yet',
    uploadedAt: null,
  }];
  const rows = filter === 'all' ? allRows : allRows.filter((r) => r.status === filter);

  return (
    <div className="app-shell">
      <TopBar title="Sent contract" />
      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">

        {/* Header */}
        <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 text-white shadow-card">
          <p className="text-xs uppercase tracking-wider text-emerald-100">Step 6 of 7</p>
          <h2 className="mt-1 text-lg font-semibold leading-snug">{property.name}</h2>
          <p className="mt-1 text-xs text-emerald-100">{property.propertyCode}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <Stat label="Status" value={hasSigned ? 'Uploaded' : 'Pending'} />
            <Stat label="Last upload" value={hasSigned ? fmtDate(contract.signedAt).split(',')[0] : '—'} />
          </div>
        </section>

        {/* Upload tile */}
        <section className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-4 text-center">
          <Upload size={28} className="mx-auto text-emerald-700" />
          <p className="mt-2 text-sm font-semibold text-emerald-900">
            {hasSigned ? 'Replace signed copy' : 'Upload signed copy'}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700">
            Accepts PDF, JPG, JPEG, PNG.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={onPicked}
            className="hidden"
          />
          <Button size="md" className="mt-3 w-full max-w-xs mx-auto bg-emerald-700 hover:bg-emerald-800 text-white" loading={uploading} onClick={pickFile}>
            {hasSigned ? <RefreshCcw size={14} /> : <Upload size={14} />}
            {hasSigned ? 'Re-upload' : 'Choose signed file'}
          </Button>
        </section>

        {/* Filter chips */}
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-slate-400" />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                filter === f.key ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* History list */}
        <section className="space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Upload history
          </p>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              Nothing in this filter.
            </div>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className={`rounded-2xl border bg-white p-3 shadow-card ${
                    row.status === 'uploaded' ? 'border-emerald-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      row.status === 'uploaded' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {row.status === 'uploaded' ? <FileCheck2 size={18} /> : <FileText size={18} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{row.fileName}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {row.status === 'uploaded'
                          ? `Uploaded ${fmtDate(row.uploadedAt)} · ${row.uploadedBy || '—'}`
                          : 'No file uploaded yet'}
                      </p>
                      {row.status === 'uploaded' && row.fileUrl && (
                        <a
                          href={row.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          <ExternalLink size={11} /> View file
                        </a>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      row.status === 'uploaded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {row.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {hasSigned && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            <p className="inline-flex items-center gap-2 font-semibold">
              <CheckCircle2 size={14} /> Signed copy sent. Officer final signature is in progress.
            </p>
            <Button
              size="block"
              className="mt-3 bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={() => navigate(`/owner/self/${id}/final-preview`)}
            >
              Go to final preview <ArrowRight size={16} />
            </Button>
          </section>
        )}
      </main>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-white/15 px-3 py-2">
    <p className="text-[10px] uppercase tracking-wider opacity-90">{label}</p>
    <p className="truncate text-sm font-bold">{value}</p>
  </div>
);

export default UploadSignedPage;
