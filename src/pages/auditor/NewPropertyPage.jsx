import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Locate } from 'lucide-react';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';
import Field, { Input, Textarea } from '../../components/ui/Field.jsx';

const NewPropertyPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    address: '',
    locationMode: 'pinned',
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

  const reverseGeocode = async (latitude, longitude) => {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', latitude);
    url.searchParams.set('lon', longitude);
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Could not resolve address');
    const data = await response.json();
    return data.display_name || `${latitude}, ${longitude}`;
  };

  const usePinned = () => {
    if (!navigator.geolocation) {
      toast.error('Location not supported on this device');
      return;
    }
    setPinning(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude.toFixed(7);
        const longitude = pos.coords.longitude.toFixed(7);
        let fullAddress = `${latitude}, ${longitude}`;
        try {
          fullAddress = await reverseGeocode(latitude, longitude);
        } catch {
          toast.error('Pinned location found, but address lookup failed');
        }
        setForm((f) => ({
          ...f,
          locationMode: 'pinned',
          latitude,
          longitude,
          address: fullAddress,
          locationText: fullAddress,
        }));
        toast.success('Current location pinned');
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
    if (!form.latitude || !form.longitude) {
      toast.error('Pin current location before continuing');
      return;
    }
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
      <TopBar title="New Audit - Phase 1" />
      <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
        <Field label="Property name">
          <Input required value={form.name} onChange={setField('name')} placeholder="e.g. Forest Spa Retreat" />
        </Field>
        <Field label="Address">
          <Textarea required value={form.address} onChange={setField('address')} rows={3} />
        </Field>

        <div className="rounded-2xl border border-slate-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pinned current location</p>
          <button
            type="button"
            onClick={usePinned}
            disabled={pinning}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-500 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 disabled:opacity-50"
          >
            <Locate size={14} /> {pinning ? 'Pinning...' : 'Use current location'}
          </button>
          {form.latitude && form.longitude && (
            <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">{form.locationText || form.address}</p>
              <p className="mt-1">{form.latitude}, {form.longitude}</p>
            </div>
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
        <Field label="Pricing" hint="e.g. Rs 2500 / night">
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
