import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Locate } from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Input, Textarea } from '../../components/ui/Field.jsx';

// Phase 1: capture basic property details. On submit, the backend returns
// the new property record; we navigate to the Phase-2 "generate ID" screen.

const NewPropertyPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    address: '',
    locationMode: 'manual',
    locationText: '',
    latitude: '',
    longitude: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    numberOfRooms: '',
    pricing: '',
  });
  const [pinning, setPinning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const usePinned = () => {
    if (!navigator.geolocation) {
      toast.error('Location not supported on this device');
      return;
    }
    setPinning(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          locationMode: 'pinned',
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        }));
        toast.success('Location pinned');
        setPinning(false);
      },
      (err) => {
        toast.error(err.message || 'Could not get location');
        setPinning(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await api.post('/auditor/properties', form);
      const property = r.data?.data?.property;
      toast.success('Phase 1 saved');
      navigate(`/auditor/properties/${property.id}/generate-id`);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <TopBar title="New Audit · Phase 1" />
      <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
        <Field label="Property name">
          <Input required value={form.name} onChange={setField('name')} placeholder="e.g. Forest Spa Retreat" />
        </Field>
        <Field label="Address">
          <Textarea required value={form.address} onChange={setField('address')} rows={3} />
        </Field>

        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Location</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, locationMode: 'manual' }))}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${form.locationMode === 'manual' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}
            >
              <MapPin size={14} className="mr-1 inline" /> Manual
            </button>
            <button
              type="button"
              onClick={usePinned}
              disabled={pinning}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50 ${form.locationMode === 'pinned' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}
            >
              <Locate size={14} className="mr-1 inline" /> {pinning ? 'Pinning…' : 'Use current'}
            </button>
          </div>
          {form.locationMode === 'manual' ? (
            <Input
              className="mt-2"
              placeholder="e.g. Kochi, Kerala"
              value={form.locationText}
              onChange={setField('locationText')}
            />
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Pinned to <strong className="text-slate-700">{form.latitude || '—'}, {form.longitude || '—'}</strong>
            </p>
          )}
        </div>

        <Field label="Owner / Property manager name">
          <Input required value={form.ownerName} onChange={setField('ownerName')} />
        </Field>
        <Field label="Owner email" hint="Contract PDF is later mailed here">
          <Input type="email" required value={form.ownerEmail} onChange={setField('ownerEmail')} />
        </Field>
        <Field label="Owner phone">
          <Input type="tel" value={form.ownerPhone} onChange={setField('ownerPhone')} />
        </Field>
        <Field label="Number of rooms">
          <Input type="number" min={1} value={form.numberOfRooms} onChange={setField('numberOfRooms')} />
        </Field>
        <Field label="Pricing" hint="e.g. ₹2500 / night">
          <Input value={form.pricing} onChange={setField('pricing')} />
        </Field>

        <Button type="submit" size="block" loading={submitting} className="!mt-6">
          Save and continue
        </Button>
      </form>
    </div>
  );
};

export default NewPropertyPage;
