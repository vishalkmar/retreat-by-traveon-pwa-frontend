// Render the schema-defined "deep-dive" inputs for one section. Used inline
// inside SectionEditPage so the auditor (or self-onboarding owner) fills
// the former Phase 4 fields while editing the section's photos + notes.

const DeepDiveFields = ({ schema, data, onChange, disabled }) => {
  if (!schema?.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {schema.map((field) => (
        <FieldRow
          key={field.key}
          field={field}
          value={data?.[field.key]}
          onChange={(v) => onChange({ ...(data || {}), [field.key]: v })}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

const FieldRow = ({ field, value, onChange, disabled }) => {
  const { key, label, type, options } = field;
  const id = `dd-${key}`;
  const Lbl = (
    <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
      {label}
    </label>
  );

  if (type === 'bool') {
    return (
      <div>
        {Lbl}
        <select
          id={id}
          disabled={disabled}
          value={value === true ? 'yes' : value === false ? 'no' : ''}
          onChange={(e) => {
            if (!e.target.value) onChange(null);
            else onChange(e.target.value === 'yes');
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50"
        >
          <option value="">-- pick --</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="sm:col-span-2">
        {Lbl}
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
        {Lbl}
        <select
          id={id}
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50"
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
      const next = selected.includes(opt)
        ? selected.filter((x) => x !== opt)
        : [...selected, opt];
      onChange(next);
    };
    return (
      <div className="sm:col-span-2">
        {Lbl}
        <div className="flex flex-wrap gap-1.5">
          {(options || []).map((opt) => {
            const on = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                disabled={disabled}
                onClick={() => toggle(opt)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  on
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
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
      {Lbl}
      <input
        id={id}
        type={type === 'number' ? 'number' : type === 'time' ? 'time' : 'text'}
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => {
          if (type === 'number') {
            const raw = e.target.value;
            onChange(raw === '' ? null : Number(raw));
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
      />
    </div>
  );
};

export default DeepDiveFields;
