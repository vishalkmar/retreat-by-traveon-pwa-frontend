import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layers, ChevronDown, ChevronUp, Check, AlertCircle, Save, Send,
  Loader2, Sparkles, CheckCircle2, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiMessage } from '../../services/api.js';
import TopBar from '../../components/shell/TopBar.jsx';
import Button from '../../components/ui/Button.jsx';

/*
  Phase 4 deep-dive — schema-driven CRM-style form per section. The schema
  comes from the backend, so adding a field is a one-place change.

  Section badges:
    grey   — not started
    amber  — saved but pending officer review
    rose   — officer rejected (with feedback)
    green  — officer approved
*/

const SelfPhase4Page = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState('');
  const [drafts, setDrafts] = useState({}); // sectionKey -> { fieldKey -> value }
  const [savingKey, setSavingKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/owner/self-properties/${id}/phase4`);
      const b = r.data?.data;
      setBundle(b);
      // Seed drafts from saved data so the form is pre-filled.
      const initial = {};
      Object.entries(b.data || {}).forEach(([sectionKey, row]) => {
        initial[sectionKey] = row?.data ? { ...row.data } : {};
      });
      setDrafts(initial);
      // Auto-open the first pending section.
      const firstPending = b.sections.find((s) => {
        const row = b.data?.[s.key];
        return !row || row.status !== 'approved';
      });
      if (firstPending) setOpenKey(firstPending.key);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not load Phase 4'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) {
    return (
      <div className="app-shell">
        <TopBar title="Phase 4 deep dive" />
        <main className="flex-1 grid place-items-center"><Loader2 size={20} className="animate-spin text-brand-700" /></main>
      </div>
    );
  }
  if (!bundle) return null;

  const { property, sections, schema, data } = bundle;
  const status = property.status;
  const isLocked = status === 'phase4_submitted'; // awaiting officer
  const isApproved = ['final_approved', 'contract_sent', 'contract_signed', 'completed'].includes(status);

  const setField = (sectionKey, fieldKey, value) => {
    setDrafts((cur) => ({
      ...cur,
      [sectionKey]: { ...(cur[sectionKey] || {}), [fieldKey]: value },
    }));
  };

  const saveSection = async (sectionKey) => {
    setSavingKey(sectionKey);
    try {
      await api.put(`/owner/self-properties/${id}/phase4/${sectionKey}`, {
        data: drafts[sectionKey] || {},
      });
      toast.success('Section saved');
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'Save failed'));
    } finally {
      setSavingKey('');
    }
  };

  const submit = async () => {
    if (!confirm('Submit Phase 4 to centralize for review?')) return;
    setSubmitting(true);
    try {
      await api.post(`/owner/self-properties/${id}/phase4/submit`);
      toast.success('Phase 4 submitted');
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'Submit failed'));
    } finally {
      setSubmitting(false);
    }
  };

  // Progress: # approved / # required + count of optional approved.
  const required = sections.filter((s) => s.required);
  const approvedRequired = required.filter((s) => data?.[s.key]?.status === 'approved').length;
  const filledRequired = required.filter((s) => data?.[s.key]).length;
  const allRequiredFilled = filledRequired === required.length;

  return (
    <div className="app-shell">
      <TopBar title="Phase 4 deep dive" />
      <main className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">

        {/* Header */}
        <section className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-800 p-4 text-white shadow-card">
          <p className="text-xs uppercase tracking-wider text-violet-200">Phase 4 · Deep dive</p>
          <h2 className="mt-1 text-lg font-semibold leading-snug">{property.name}</h2>
          <p className="mt-1 text-xs text-violet-200">
            {property.propertyCode || 'No ID'} · status: {status.replace(/_/g, ' ')}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Required filled" value={`${filledRequired} / ${required.length}`} />
            <Stat label="Already approved" value={`${approvedRequired} / ${required.length}`} />
          </div>
        </section>

        {/* Status banners */}
        {isLocked && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              Submitted to centralize for review. You can't edit sections
              until they send it back or final-approve.
            </div>
          </div>
        )}
        {status === 'phase4_in_revision' && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              Centralize sent it back. Check the sections marked in red, fix the
              issues, and submit again.
            </div>
          </div>
        )}
        {isApproved && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div>Phase 4 final approved. Contract is being generated.</div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-2.5">
          {sections.map((s) => (
            <SectionPanel
              key={s.key}
              section={s}
              schemaFields={schema[s.key] || []}
              saved={data?.[s.key] || null}
              draft={drafts[s.key] || {}}
              setField={setField}
              open={openKey === s.key}
              onToggle={() => setOpenKey(openKey === s.key ? '' : s.key)}
              onSave={() => saveSection(s.key)}
              saving={savingKey === s.key}
              disabled={isLocked || isApproved}
            />
          ))}
        </div>

        {/* Submit bar */}
        {!isLocked && !isApproved && (
          <div className="sticky bottom-2 z-10">
            <Button
              size="block"
              variant="primary"
              className="bg-violet-700 hover:bg-violet-800 text-white shadow-xl"
              disabled={!allRequiredFilled}
              loading={submitting}
              onClick={submit}
            >
              <Send size={15} /> Submit Phase 4 for review
            </Button>
            {!allRequiredFilled && (
              <p className="mt-1.5 text-center text-[11px] text-rose-600">
                Fill every required section first.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-white/10 px-2.5 py-1.5">
    <div className="text-[10px] uppercase tracking-wider text-violet-200">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
);

const STATUS_TONES = {
  approved: { dot: 'bg-emerald-500',  label: 'Approved',  badge: 'bg-emerald-100 text-emerald-700' },
  pending:  { dot: 'bg-amber-500',    label: 'Pending',   badge: 'bg-amber-100 text-amber-800' },
  rejected: { dot: 'bg-rose-500',     label: 'Rejected',  badge: 'bg-rose-100 text-rose-800' },
};

const SectionPanel = ({ section, schemaFields, saved, draft, setField, open, onToggle, onSave, saving, disabled }) => {
  const tone = saved ? STATUS_TONES[saved.status] : null;
  const isRejected = saved?.status === 'rejected';

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white shadow-card ${
      isRejected ? 'border-rose-300' : open ? 'border-violet-300' : 'border-slate-100'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${
          saved?.status === 'approved' ? 'bg-emerald-50 text-emerald-700'
          : isRejected ? 'bg-rose-50 text-rose-700'
          : 'bg-violet-50 text-violet-700'
        }`}>
          <Layers size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900">{section.label}</span>
            {section.required && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                Required
              </span>
            )}
            {tone && (
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                {tone.label}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {schemaFields.length} fields {saved?.iteration > 1 && ` · rev #${saved.iteration}`}
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-3">
          {isRejected && saved.feedback && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              <p className="text-[11px] font-bold uppercase text-rose-700 mb-1">Centralize feedback</p>
              {saved.feedback}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {schemaFields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={draft[field.key]}
                onChange={(v) => setField(section.key, field.key, v)}
                disabled={disabled}
              />
            ))}
          </div>

          {!disabled && (
            <Button
              size="md"
              variant="primary"
              className="w-full bg-violet-700 hover:bg-violet-800 text-white"
              loading={saving}
              onClick={onSave}
            >
              <Save size={14} /> Save section
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const FieldInput = ({ field, value, onChange, disabled }) => {
  const { key, label, type, options } = field;
  const id = `phase4-${key}`;
  const labelEl = (
    <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
      {label}
    </label>
  );

  if (type === 'bool') {
    return (
      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
        <input
          id={id}
          type="checkbox"
          disabled={disabled}
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-sm text-slate-700">{label}</span>
      </label>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="sm:col-span-2">
        {labelEl}
        <textarea
          id={id}
          rows={3}
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
        />
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div>
        {labelEl}
        <select
          id={id}
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white disabled:bg-slate-50"
        >
          <option value="">— pick —</option>
          {(options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'multi') {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (opt) => {
      if (disabled) return;
      const next = selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt];
      onChange(next);
    };
    return (
      <div className="sm:col-span-2">
        {labelEl}
        <div className="flex flex-wrap gap-1.5">
          {(options || []).map((opt) => {
            const on = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => toggle(opt)}
                className={`rounded-full px-2.5 py-1 text-xs border transition ${
                  on
                    ? 'bg-violet-700 text-white border-violet-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                } disabled:opacity-50`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {labelEl}
      <input
        id={id}
        type={type === 'number' ? 'number' : type === 'time' ? 'time' : 'text'}
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
      />
    </div>
  );
};

export default SelfPhase4Page;
