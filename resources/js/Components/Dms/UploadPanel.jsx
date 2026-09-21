import { useForm } from '@inertiajs/react';
import DynamicFormFields, { emptyFormData, labelStyle } from './DynamicFormFields';

export default function UploadPanel({ documentTypes, folders = [], users = [], roles = [], formFields = [], onSuccess }) {
    // Field list is admin-managed (Settings → Document Form). code_types is not —
    // the tracking code is a fixed part of every document. Tick both to have a
    // QR code and a barcode issued for the same document.
    const { data, setData, post, processing, errors, reset } = useForm({
        ...emptyFormData(formFields),
        code_types: ['QR'],
    });

    function toggleCodeType(type) {
        setData('code_types', data.code_types.includes(type)
            ? data.code_types.filter(t => t !== type)
            : [...data.code_types, type]);
    }

    const sources = { document_types: documentTypes, folders, users, roles };

    function handleSubmit(e) {
        e.preventDefault();
        post(route('documents.store'), {
            onSuccess: () => { reset(); onSuccess?.(); },
        });
    }

    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 86 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DocIcon /> New Document
            </div>

            <div style={{ padding: '1.25rem' }}>
                <form onSubmit={handleSubmit}>

                    {/* Admin-configurable fields */}
                    <DynamicFormFields
                        fields={formFields}
                        data={data}
                        setData={setData}
                        errors={errors}
                        sources={sources}
                    />

                    {formFields.length === 0 && (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                            No form fields are enabled. An admin can add them in Settings → Document Form.
                        </p>
                    )}

                    {/* ── Tracking Code — fixed, not configurable ── */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Tracking Code</label>
                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                            {['QR', 'Barcode'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="code_types"
                                        value={opt}
                                        checked={data.code_types.includes(opt)}
                                        onChange={() => toggleCodeType(opt)}
                                        style={{ accentColor: '#6366f1' }}
                                    />
                                    {opt === 'QR' ? 'QR Code' : 'Barcode'}
                                </label>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 6 }}>
                            Pick one or both. Both issues a QR code and a barcode that share a
                            number, so either one scans back to this document.
                        </p>
                        {(errors.code_types || errors['code_types.0']) && (
                            <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>
                                {errors.code_types || errors['code_types.0']}
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing || data.code_types.length === 0}
                        style={{ width: '100%', padding: '0.55rem 1rem', background: (processing || data.code_types.length === 0) ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.85rem', borderRadius: 6, border: 'none', cursor: (processing || data.code_types.length === 0) ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
                    >
                        {processing ? 'Saving…' : 'Save Document'}
                    </button>

                </form>
            </div>
        </div>
    );
}

function DocIcon() {
    return <svg width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline strokeLinecap="round" points="14 2 14 8 20 8"/><line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13"/><line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17"/></svg>;
}
