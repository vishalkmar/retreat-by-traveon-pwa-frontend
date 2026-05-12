import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Copy } from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';

// Phase 2: lock in a unique Property ID. The button is a one-time action —
// once tapped, the code is generated and we move to Phase 3 capture.

const GenerateIdPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get(`/auditor/properties/${id}`)
      .then((r) => { if (alive) setProperty(r.data?.data?.property); })
      .catch(() => toast.error('Could not load property'))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const r = await api.post(`/auditor/properties/${id}/generate-id`);
      setProperty(r.data?.data?.property);
      toast.success('Property ID generated');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not generate'));
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!property?.propertyCode) return;
    try {
      await navigator.clipboard.writeText(property.propertyCode);
      toast.success('Copied');
    } catch { /* clipboard may be blocked */ }
  };

  return (
    <div className="app-shell">
      <TopBar title="Phase 2 · Property ID" />
      <main className="flex-1 overflow-y-auto p-5 pb-24">
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Property</p>
              <p className="mt-1 font-semibold text-slate-900">{property?.name}</p>
              <p className="text-xs text-slate-500">{property?.address}</p>
            </section>

            <section className="mt-6 rounded-3xl border border-brand-100 bg-brand-50 p-6 text-center">
              <ShieldCheck size={32} className="mx-auto text-brand-700" />
              <h2 className="mt-3 text-lg font-semibold text-brand-900">
                {property?.propertyCode ? 'Your Property ID' : 'Generate Property ID'}
              </h2>
              <p className="mt-1 text-xs text-brand-800/80">
                {property?.propertyCode
                  ? 'This unique code follows the property through audit, approval and contract.'
                  : 'Tap below to generate a one-time unique ID. This unlocks Phase 3.'}
              </p>

              {property?.propertyCode ? (
                <button
                  onClick={copyCode}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xl font-bold tracking-widest text-brand-800 shadow-sm hover:bg-white/80"
                >
                  {property.propertyCode}
                  <Copy size={16} className="text-brand-500" />
                </button>
              ) : (
                <Button
                  size="block"
                  className="mt-5"
                  onClick={onGenerate}
                  loading={generating}
                >
                  Generate Property ID
                </Button>
              )}
            </section>

            {property?.propertyCode && (
              <Button
                size="block"
                className="mt-6"
                onClick={() => navigate(`/auditor/properties/${id}/capture`)}
              >
                Continue to Phase 3 · Capture
              </Button>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default GenerateIdPage;
