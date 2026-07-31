/**
 * Renders the admin-configurable portion of the document form.
 *
 * The field list comes from Settings → Document Form. The Tracking Code block is
 * deliberately NOT part of this renderer — it is hardcoded in the forms so it can
 * never be reordered, hidden or deleted.
 */

export const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fff' };
export const labelStyle = { fontWeight: 500, fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' };

const listContainerStyle = {
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '0.5rem',
    maxHeight: 120,
    overflowY: 'auto',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
};

/** Build the initial useForm() data object for a set of fields. */
export function emptyFormData(fields = []) {
    return fields.reduce((acc, f) => {
        acc[f.key] = f.type === 'multiselect' ? [] : f.type === 'checkbox' ? false : '';
        return acc;
    }, {});
}

/** Build the useForm() data object for an existing document. */
export function formDataFromDocument(fields = [], doc = {}) {
    return fields.reduce((acc, f) => {
        let value = f.column_name ? doc[f.key] : doc.custom_fields?.[f.key];

        // Documents index maps `name` → `label` and shows an em dash for blank departments.
        if (f.key === 'label') value = doc.label ?? '';
        if (value === '—') value = '';

        if (f.type === 'multiselect')   value = Array.isArray(value) ? value : [];
        else if (f.type === 'checkbox') value = Boolean(value);
        else                            value = value ?? '';

        acc[f.key] = value;
        return acc;
    }, {});
}

/** Read a field's stored value off a document, wherever it lives. */
export function documentFieldValue(field, doc = {}) {
    if (!field.column_name) return doc.custom_fields?.[field.key];
    return field.key === 'label' ? doc.label : doc[field.key];
}

/**
 * Human-readable version of a stored value — resolves choice ids to their
 * labels, booleans to Yes/No, and dates to the display format.
 */
export function formatFieldValue(field, value, sources = {}) {
    const BLANK = '—';

    if (field.type === 'checkbox') return value ? 'Yes' : 'No';
    if (value === null || value === undefined || value === '' || value === BLANK) return BLANK;

    if (field.type === 'multiselect') {
        const list = Array.isArray(value) ? value : [];
        if (!list.length) return BLANK;
        const opts = resolveOptions(field, sources);
        return list
            .map(v => opts.find(o => String(o.value) === String(v))?.label ?? v)
            .join(', ');
    }

    if (field.type === 'select' || field.type === 'radio') {
        const opts = resolveOptions(field, sources);
        return opts.find(o => String(o.value) === String(value))?.label ?? value;
    }

    if (field.type === 'date') {
        const d = new Date(value);
        return isNaN(d.getTime())
            ? value
            : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    }

    return String(value);
}

/** Emoji used beside a field in read-only views. */
export function fieldIcon(type) {
    return {
        text: '📝', textarea: '📄', number: '🔢', date: '📅', email: '✉️',
        url: '🔗', select: '🏷️', radio: '🔘', multiselect: '☑️', checkbox: '✅',
    }[type] ?? '📝';
}

/** Resolve the choice list for a field, whether static or sourced from a table. */
export function resolveOptions(field, sources = {}) {
    if (field.options_source) {
        const rows = sources[field.options_source] ?? [];
        return rows.map(r => ({ value: r.id, label: r.name }));
    }
    return (field.options ?? []).map(o => ({ value: o.value, label: o.label }));
}

export default function DynamicFormFields({ fields = [], data, setData, errors = {}, sources = {} }) {
    return fields.map(field => (
        <div key={field.key} style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
                {field.label}
                {field.is_required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
            </label>

            <FieldControl
                field={field}
                value={data[field.key]}
                onChange={v => setData(field.key, v)}
                options={resolveOptions(field, sources)}
            />

            {field.help_text && (
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>{field.help_text}</p>
            )}
            {errors[field.key] && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors[field.key]}</p>
            )}
        </div>
    ));
}

export function FieldControl({ field, value, onChange, options = [], disabled = false }) {
    const common = { style: inputStyle, disabled, required: field.is_required };

    switch (field.type) {
        case 'textarea':
            return (
                <textarea
                    {...common}
                    rows={3}
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder ?? ''}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
            );

        case 'select':
            return (
                <select {...common} value={value ?? ''} onChange={e => onChange(e.target.value)}>
                    <option value="" disabled>{field.placeholder || 'Choose…'}</option>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            );

        case 'radio':
            return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', paddingTop: 2 }}>
                    {options.length === 0
                        ? <Empty>No choices configured</Empty>
                        : options.map(o => (
                            <label key={o.value} style={choiceLabelStyle}>
                                <input
                                    type="radio"
                                    name={field.key}
                                    value={o.value}
                                    checked={String(value) === String(o.value)}
                                    onChange={() => onChange(o.value)}
                                    disabled={disabled}
                                    style={{ accentColor: '#6366f1', cursor: 'pointer' }}
                                />
                                {o.label}
                            </label>
                        ))}
                </div>
            );

        case 'multiselect': {
            const selected = Array.isArray(value) ? value : [];
            const toggle = v => onChange(
                selected.some(s => String(s) === String(v))
                    ? selected.filter(s => String(s) !== String(v))
                    : [...selected, v]
            );
            return (
                <div style={listContainerStyle}>
                    {options.length === 0
                        ? <Empty>No choices available</Empty>
                        : options.map(o => (
                            <label key={o.value} style={{ ...choiceLabelStyle, textTransform: 'capitalize' }}>
                                <input
                                    type="checkbox"
                                    checked={selected.some(s => String(s) === String(o.value))}
                                    onChange={() => toggle(o.value)}
                                    disabled={disabled}
                                    style={{ accentColor: '#6366f1', cursor: 'pointer' }}
                                />
                                {o.label}
                            </label>
                        ))}
                </div>
            );
        }

        case 'checkbox':
            return (
                <label style={{ ...choiceLabelStyle, paddingTop: 2 }}>
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={e => onChange(e.target.checked)}
                        disabled={disabled}
                        style={{ accentColor: '#6366f1', cursor: 'pointer' }}
                    />
                    {field.placeholder || 'Yes'}
                </label>
            );

        case 'number':
        case 'date':
        case 'email':
            return (
                <input
                    {...common}
                    type={field.type}
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder ?? ''}
                />
            );

        case 'url':
        case 'text':
        default:
            return (
                <input
                    {...common}
                    type="text"
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder ?? ''}
                />
            );
    }
}

const choiceLabelStyle = {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer',
};

function Empty({ children }) {
    return <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{children}</span>;
}
