import { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { FieldControl, resolveOptions, fieldIcon, labelStyle } from './DynamicFormFields';

/**
 * Settings → Document Form.
 *
 * Drag an element from the palette into the field list to add it, drag existing
 * rows to reorder. Editing happens inline — there is no modal. The Tracking Code
 * block is not in this list: it is hardcoded on the document form and always last.
 */

/**
 * Every mutation is a partial visit: `preserveState` keeps the Settings page
 * component alive so the active tab doesn't jump back to General, and `only`
 * refetches just the field list instead of the whole page payload.
 */
const visitOptions = {
    preserveScroll: true,
    preserveState:  true,
    only:           ['formFields', 'flash'],
};

export default function DocumentFormBuilder({ formFields = [], fieldTypes = [], choiceTypes = [] }) {
    const [items, setItems] = useState(formFields);

    const [dragIdx,     setDragIdx]     = useState(null); // existing row being moved
    const [paletteType, setPaletteType] = useState(null); // new element being dragged in
    const [dropIdx,     setDropIdx]     = useState(null); // insertion point indicator

    const [draft,     setDraft]     = useState(null); // { type, index } — unsaved new field
    const [editingId, setEditingId] = useState(null); // existing field open for editing

    // Re-sync whenever the server sends a fresh list (after add/edit/delete).
    useEffect(() => { setItems(formFields); }, [formFields]);

    const isDragging = dragIdx !== null || paletteType !== null;

    function resetDrag() { setDragIdx(null); setPaletteType(null); setDropIdx(null); }

    function handleDrop(index) {
        // A new element from the palette → open an inline editor at that slot.
        if (paletteType) {
            setEditingId(null);
            setDraft({ type: paletteType, index });
            resetDrag();
            return;
        }

        if (dragIdx === null) { resetDrag(); return; }

        // Dropping onto a slot after itself accounts for its own removal.
        const target = index > dragIdx ? index - 1 : index;
        if (target === dragIdx) { resetDrag(); return; }

        const next = [...items];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(target, 0, moved);

        setItems(next);
        setDraft(null);
        resetDrag();

        router.post(route('document-fields.reorder'), { order: next.map(f => f.id) }, {
            ...visitOptions,
            onError: () => setItems(formFields),
        });
    }

    function toggleActive(field) {
        // Flip immediately so the switch feels instant, then confirm with the server.
        setItems(items.map(f => f.id === field.id ? { ...f, is_active: !f.is_active } : f));

        router.post(route('document-fields.toggle', field.id), {}, {
            ...visitOptions,
            onError: () => setItems(formFields),
        });
    }

    function remove(field) {
        if (!confirm(`Remove "${field.label}" from the document form?\n\nExisting documents keep their saved value, but the field will no longer be shown.`)) return;
        router.delete(route('document-fields.destroy', field.id), visitOptions);
    }

    function startDraft(type) {
        setEditingId(null);
        setDraft({ type, index: items.length });
    }

    const activeFields = items.filter(f => f.is_active);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── Element palette ─────────────────────────────────── */}
            <div style={cardStyle}>
                <div style={{ marginBottom: '0.9rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Form Elements</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '3px 0 0' }}>
                        Drag an element into the field list below to add it — or just click one to append it to the end.
                    </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {fieldTypes.map(t => (
                        <button
                            key={t.value}
                            type="button"
                            draggable
                            onDragStart={e => {
                                e.dataTransfer.effectAllowed = 'copy';
                                e.dataTransfer.setData('text/plain', t.value);
                                setPaletteType(t.value);
                            }}
                            onDragEnd={resetDrag}
                            onClick={() => startDraft(t.value)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '0.5rem 0.8rem',
                                border: `1px solid ${paletteType === t.value ? '#6366f1' : '#e2e8f0'}`,
                                borderRadius: 9,
                                background: paletteType === t.value ? '#eef2ff' : '#fff',
                                fontSize: '0.79rem', fontWeight: 600, color: '#475569',
                                cursor: 'grab', userSelect: 'none',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                transition: 'border-color 0.12s, background 0.12s',
                            }}
                        >
                            <span style={{ fontSize: '0.9rem' }}>{fieldIcon(t.value)}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Hierarchy + preview ─────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>

                <div style={cardStyle}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Add New Document — Field Order</h3>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '3px 0 0' }}>
                            Drag to reorder. Toggle to show or hide. Changes apply to the document form immediately.
                        </p>
                    </div>

                    <div
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleDrop(items.length)}
                        style={{
                            display: 'flex', flexDirection: 'column',
                            border: isDragging ? '1px dashed #c7d2fe' : '1px solid transparent',
                            borderRadius: 10,
                            background: isDragging ? 'rgba(238,242,255,0.35)' : 'transparent',
                            padding: isDragging ? 6 : 0,
                            transition: 'background 0.15s',
                        }}
                    >
                        {items.map((field, idx) => (
                            <div key={field.id}>
                                <DropLine active={isDragging && dropIdx === idx} />

                                {draft && draft.index === idx && (
                                    <FieldEditor
                                        key={`draft-${draft.type}-${idx}`}
                                        type={draft.type}
                                        position={idx}
                                        fieldTypes={fieldTypes}
                                        choiceTypes={choiceTypes}
                                        onDone={() => setDraft(null)}
                                        onCancel={() => setDraft(null)}
                                    />
                                )}

                                {editingId === field.id ? (
                                    <FieldEditor
                                        field={field}
                                        fieldTypes={fieldTypes}
                                        choiceTypes={choiceTypes}
                                        onDone={() => setEditingId(null)}
                                        onCancel={() => setEditingId(null)}
                                    />
                                ) : (
                                    <FieldRow
                                        field={field}
                                        fieldTypes={fieldTypes}
                                        dimmed={dragIdx === idx}
                                        onDragStart={() => { setDragIdx(idx); setDraft(null); }}
                                        onDragEnter={() => setDropIdx(idx)}
                                        onDragOver={e => { e.preventDefault(); setDropIdx(idx); }}
                                        onDrop={e => { e.stopPropagation(); handleDrop(idx); }}
                                        onDragEnd={resetDrag}
                                        onEdit={() => { setDraft(null); setEditingId(field.id); }}
                                        onToggle={() => toggleActive(field)}
                                        onRemove={() => remove(field)}
                                    />
                                )}
                            </div>
                        ))}

                        {/* Trailing slot — drop here to append */}
                        <div
                            onDragEnter={() => setDropIdx(items.length)}
                            onDragOver={e => { e.preventDefault(); setDropIdx(items.length); }}
                            onDrop={e => { e.stopPropagation(); handleDrop(items.length); }}
                            style={{ minHeight: isDragging ? 26 : 8 }}
                        >
                            <DropLine active={isDragging && dropIdx === items.length} />
                        </div>

                        {draft && draft.index >= items.length && (
                            <FieldEditor
                                key={`draft-end-${draft.type}`}
                                type={draft.type}
                                position={items.length}
                                fieldTypes={fieldTypes}
                                choiceTypes={choiceTypes}
                                onDone={() => setDraft(null)}
                                onCancel={() => setDraft(null)}
                            />
                        )}

                        {/* Tracking Code — pinned, not draggable */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
                            padding: '0.7rem 0.85rem', border: '1px dashed #c7d2fe',
                            borderRadius: 10, background: '#f5f3ff',
                        }}>
                            <span style={{ color: '#c7d2fe', flexShrink: 0, lineHeight: 0 }}><LockIcon /></span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#4338ca' }}>Tracking Code</span>
                                    <Tag color="#4338ca" bg="#eef2ff" border="#c7d2fe">System · Locked</Tag>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#818cf8', marginTop: 2 }}>
                                    QR / Barcode — always shown last and cannot be moved, hidden or removed.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Live preview ────────────────────────────────── */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Form Preview</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1.25rem' }}>How the Add New Document form looks now.</p>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', background: '#fff' }}>
                        {activeFields.length === 0 && (
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem' }}>No fields enabled yet.</p>
                        )}

                        {activeFields.map(field => (
                            <div key={field.id} style={{ marginBottom: '0.9rem' }}>
                                <label style={labelStyle}>
                                    {field.label}
                                    {field.is_required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
                                </label>
                                <FieldControl
                                    field={{ ...field, is_required: false }}
                                    value={field.type === 'multiselect' ? [] : field.type === 'checkbox' ? false : ''}
                                    onChange={() => {}}
                                    options={field.options_source ? [] : resolveOptions(field)}
                                    disabled
                                />
                                {field.help_text && <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>{field.help_text}</p>}
                                {field.options_source && (
                                    <p style={{ fontSize: '0.7rem', color: '#a5b4fc', marginTop: 4 }}>
                                        Choices come from {field.options_source.replace('_', ' ')}.
                                    </p>
                                )}
                            </div>
                        ))}

                        <div style={{ marginBottom: '0.9rem', paddingTop: '0.25rem', borderTop: '1px dashed #e2e8f0' }}>
                            <label style={{ ...labelStyle, marginTop: '0.9rem' }}>Tracking Code 🔒</label>
                            <div style={{ display: 'flex', gap: '1.25rem' }}>
                                {['QR Code', 'Barcode'].map((opt, i) => (
                                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b' }}>
                                        <input type="radio" disabled defaultChecked={i === 0} style={{ accentColor: '#6366f1' }} />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button type="button" disabled style={{ width: '100%', padding: '0.55rem 1rem', background: '#a5b4fc', color: '#fff', fontWeight: 600, fontSize: '0.85rem', borderRadius: 6, border: 'none', cursor: 'not-allowed' }}>
                            Save Document
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Collapsed field row ───────────────────────────────────────────────────────
function FieldRow({ field, fieldTypes, dimmed, onEdit, onToggle, onRemove, ...dragProps }) {
    return (
        <div
            draggable
            {...dragProps}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.7rem 0.85rem', marginBottom: 8,
                border: '1px solid #e2e8f0', borderRadius: 10,
                background: dimmed ? '#eef2ff' : field.is_active ? '#fff' : '#f8fafc',
                opacity: dimmed ? 0.5 : field.is_active ? 1 : 0.7,
                cursor: 'grab',
            }}
        >
            <span style={{ color: '#cbd5e1', flexShrink: 0, lineHeight: 0 }} title="Drag to reorder"><GripIcon /></span>
            <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{fieldIcon(field.type)}</span>

            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>{field.label}</span>
                    {field.is_required && <Tag color="#dc2626" bg="#fef2f2" border="#fecaca">Required</Tag>}
                    {field.is_locked   && <Tag color="#0369a1" bg="#f0f9ff" border="#bae6fd">Always on</Tag>}
                    {field.is_system   && !field.is_locked && <Tag color="#64748b" bg="#f1f5f9" border="#e2e8f0">Built-in</Tag>}
                    {!field.is_active  && <Tag color="#94a3b8" bg="#f8fafc" border="#e2e8f0">Hidden</Tag>}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                    {typeLabel(fieldTypes, field.type)} · <code style={{ fontFamily: 'monospace' }}>{field.key}</code>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <MiniToggle
                    checked={field.is_active}
                    disabled={field.is_locked}
                    onChange={onToggle}
                    title={field.is_locked ? 'This field is required by the system' : field.is_active ? 'Hide from form' : 'Show on form'}
                />
                <button type="button" onClick={onEdit} style={iconBtn} title="Edit field"><PencilIcon /></button>
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={field.is_system}
                    style={{ ...iconBtn, color: field.is_system ? '#cbd5e1' : '#dc2626', cursor: field.is_system ? 'not-allowed' : 'pointer' }}
                    title={field.is_system ? 'Built-in fields cannot be deleted — hide them instead' : 'Delete field'}
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
}

// ── Inline editor (new draft or existing field) ───────────────────────────────
function FieldEditor({ field, type, position, fieldTypes, choiceTypes, onDone, onCancel }) {
    const isNew = !field;

    const form = useForm({
        label:       field?.label       ?? '',
        type:        field?.type        ?? type ?? 'text',
        placeholder: field?.placeholder ?? '',
        help_text:   field?.help_text   ?? '',
        is_required: field?.is_required ?? false,
        is_active:   field?.is_active   ?? true,
        options:     field?.options?.length ? field.options : [{ label: '', value: '' }],
        position:    isNew ? position : null,
    });
    const { data, setData, post, put, transform, processing, errors } = form;

    // System fields keep their type and choice source; only presentation is editable.
    const typeLocked   = Boolean(field?.is_system);
    const lockedOnForm = Boolean(field?.is_locked);
    const hasSource    = Boolean(field?.options_source);
    const needsChoices = choiceTypes.includes(data.type) && !hasSource;

    function submit(e) {
        e.preventDefault();

        // Only send a choice list when the type actually has one.
        transform(d => needsChoices ? d : { ...d, options: [] });

        const opts = { ...visitOptions, onSuccess: onDone };
        isNew
            ? post(route('document-fields.store'), opts)
            : put(route('document-fields.update', field.id), opts);
    }

    function setOption(i, key, value) {
        setData('options', data.options.map((o, idx) => idx === i ? { ...o, [key]: value } : o));
    }

    const shown   = ['label', 'type', 'placeholder', 'help_text', 'options'];
    const orphans = Object.entries(errors)
        .filter(([k]) => !shown.includes(k) && !(needsChoices && k.startsWith('options.')));

    return (
        <form
            onSubmit={submit}
            onDragOver={e => e.stopPropagation()}
            onDrop={e => e.stopPropagation()}
            style={{
                marginBottom: 8, padding: '0.9rem 1rem',
                border: `2px solid ${isNew ? '#6366f1' : '#c7d2fe'}`, borderRadius: 10,
                background: isNew ? '#f5f7ff' : '#fff',
                boxShadow: '0 4px 14px rgba(99,102,241,0.10)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.95rem' }}>{fieldIcon(data.type)}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4338ca' }}>
                    {isNew ? `New ${typeLabel(fieldTypes, data.type)} Field` : `Editing “${field.label}”`}
                </span>
                {!isNew && <code style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#94a3b8' }}>{field.key}</code>}
            </div>

            {orphans.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.6rem 0.75rem', marginBottom: '0.85rem' }}>
                    {orphans.map(([k, msg]) => (
                        <p key={k} style={{ fontSize: '0.76rem', color: '#dc2626', margin: 0 }}>{msg}</p>
                    ))}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <BField label="Field Label" error={errors.label}>
                    <input
                        required
                        autoFocus
                        value={data.label}
                        onChange={e => setData('label', e.target.value)}
                        placeholder="e.g. Expiry Date"
                        style={bInput}
                    />
                </BField>

                <BField label="Field Type" error={errors.type} hint={typeLocked ? 'Built-in fields keep their type.' : null}>
                    <select
                        value={data.type}
                        disabled={typeLocked}
                        onChange={e => setData('type', e.target.value)}
                        style={{ ...bInput, background: typeLocked ? '#f1f5f9' : '#fff', cursor: typeLocked ? 'not-allowed' : 'pointer' }}
                    >
                        {fieldTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </BField>

                <BField label={data.type === 'checkbox' ? 'Checkbox Text' : 'Placeholder'} error={errors.placeholder}>
                    <input
                        value={data.placeholder ?? ''}
                        onChange={e => setData('placeholder', e.target.value)}
                        placeholder={data.type === 'checkbox' ? 'e.g. Confidential' : 'e.g. Enter a value…'}
                        style={bInput}
                    />
                </BField>

                <BField label="Helper Text" error={errors.help_text}>
                    <input
                        value={data.help_text ?? ''}
                        onChange={e => setData('help_text', e.target.value)}
                        placeholder="Short hint shown under the field"
                        style={bInput}
                    />
                </BField>
            </div>

            {needsChoices && (
                <BField label="Choices" error={errors.options}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {data.options.map((o, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input
                                        value={o.label}
                                        onChange={e => setOption(i, 'label', e.target.value)}
                                        placeholder={`Choice ${i + 1}`}
                                        style={{ ...bInput, flex: 1, borderColor: errors[`options.${i}.label`] ? '#fca5a5' : '#cbd5e1' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setData('options', data.options.filter((_, idx) => idx !== i))}
                                        disabled={data.options.length === 1}
                                        style={{ ...iconBtn, color: data.options.length === 1 ? '#cbd5e1' : '#dc2626' }}
                                        title="Remove choice"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                                {errors[`options.${i}.label`] && (
                                    <p style={{ fontSize: '0.72rem', color: '#ef4444', margin: '3px 0 0' }}>{errors[`options.${i}.label`]}</p>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setData('options', [...data.options, { label: '', value: '' }])}
                            style={{ ...ghostBtn, alignSelf: 'flex-start' }}
                        >
                            + Add choice
                        </button>
                    </div>
                </BField>
            )}

            {hasSource && (
                <p style={{ fontSize: '0.75rem', color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, padding: '0.55rem 0.7rem', margin: '0 0 0.85rem' }}>
                    Choices for this field come from your {field.options_source.replace('_', ' ')} list automatically.
                </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                <SwitchRow
                    label="Required"
                    hint={lockedOnForm ? 'Must stay required.' : null}
                    checked={lockedOnForm || data.is_required}
                    disabled={lockedOnForm}
                    onChange={v => setData('is_required', v)}
                />
                <SwitchRow
                    label="Show on form"
                    hint={lockedOnForm ? 'Cannot be hidden.' : null}
                    checked={lockedOnForm || data.is_active}
                    disabled={lockedOnForm}
                    onChange={v => setData('is_active', v)}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={onCancel} disabled={processing} style={ghostBtn}>Cancel</button>
                <button type="submit" disabled={processing} style={{ ...primaryBtn, opacity: processing ? 0.7 : 1 }}>
                    {processing ? 'Saving…' : isNew ? 'Add Field' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}

// ── Small pieces ──────────────────────────────────────────────────────────────
function DropLine({ active }) {
    return (
        <div style={{
            height: active ? 3 : 0,
            background: '#6366f1',
            borderRadius: 999,
            margin: active ? '0 0 6px' : 0,
            boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
            transition: 'height 0.1s',
        }} />
    );
}

function typeLabel(fieldTypes, value) {
    return fieldTypes.find(t => t.value === value)?.label ?? value;
}

function Tag({ children, color, bg, border }) {
    return (
        <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color, background: bg, border: `1px solid ${border}`, borderRadius: 999, padding: '1px 7px' }}>
            {children}
        </span>
    );
}

function MiniToggle({ checked, onChange, disabled, title }) {
    return (
        <div
            title={title}
            onClick={() => !disabled && onChange(!checked)}
            style={{
                width: 34, height: 18, borderRadius: 999, flexShrink: 0, position: 'relative',
                background: checked ? (disabled ? '#c7d2fe' : '#6366f1') : '#e2e8f0',
                cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
            }}
        >
            <div style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
    );
}

function SwitchRow({ label, hint, checked, onChange, disabled }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MiniToggle checked={checked} onChange={onChange} disabled={disabled} />
            <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>{label}</div>
                {hint && <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{hint}</div>}
            </div>
        </div>
    );
}

function BField({ label, hint, error, children }) {
    return (
        <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{label}</label>
            {children}
            {hint  && <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '4px 0 0' }}>{hint}</p>}
            {error && <p style={{ fontSize: '0.74rem', color: '#ef4444', margin: '4px 0 0' }}>{error}</p>}
        </div>
    );
}

const cardStyle  = { background: '#fff', padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const bInput     = { width: '100%', padding: '0.45rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.82rem', color: '#334155', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const primaryBtn = { padding: '0.45rem 1rem', background: '#6366f1', color: '#fff', fontSize: '0.78rem', fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' };
const ghostBtn   = { padding: '0.45rem 1rem', background: '#fff', color: '#475569', fontSize: '0.78rem', fontWeight: 700, borderRadius: 8, border: '1px solid #cbd5e1', cursor: 'pointer' };
const iconBtn    = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', flexShrink: 0, padding: 0 };

// ── Icons ─────────────────────────────────────────────────────────────────────
function GripIcon()   { return <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><circle cx="7" cy="4" r="1.6"/><circle cx="13" cy="4" r="1.6"/><circle cx="7" cy="10" r="1.6"/><circle cx="13" cy="10" r="1.6"/><circle cx="7" cy="16" r="1.6"/><circle cx="13" cy="16" r="1.6"/></svg>; }
function PencilIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>; }
function TrashIcon()  { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline strokeLinecap="round" points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }
function LockIcon()   { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path strokeLinecap="round" d="M8 11V7a4 4 0 118 0v4"/></svg>; }
