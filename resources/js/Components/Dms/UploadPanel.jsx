import { useForm } from '@inertiajs/react';

const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fff' };
const labelStyle = { fontWeight: 500, fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' };

export default function UploadPanel({ documentTypes }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        document_type_id: '',
        code_type: 'QR',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('documents.store'), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 86 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UploadIcon /> Upload Document
            </div>

            <div style={{ padding: '1.25rem' }}>
                <form onSubmit={handleSubmit}>
                    {/* File */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Select Target File</label>
                        <input
                            type="file"
                            required
                            onChange={e => setData('file', e.target.files[0])}
                            style={inputStyle}
                        />
                        {errors.file && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.file}</p>}
                    </div>

                    {/* Type */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Document Classification</label>
                        <select
                            required
                            value={data.document_type_id}
                            onChange={e => setData('document_type_id', e.target.value)}
                            style={inputStyle}
                        >
                            <option value="" disabled>Choose type...</option>
                            {documentTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        {errors.document_type_id && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{errors.document_type_id}</p>}
                    </div>

                    {/* Code type */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Tracking Generation Mode</label>
                        <div className="flex gap-4">
                            {['QR', 'Barcode'].map(opt => (
                                <label key={opt} className="flex items-center gap-2" style={{ fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="code_type"
                                        value={opt}
                                        checked={data.code_type === opt}
                                        onChange={() => setData('code_type', opt)}
                                        style={{ accentColor: '#6366f1' }}
                                    />
                                    {opt === 'QR' ? 'QR Code' : 'Barcode'}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        style={{ width: '100%', padding: '0.55rem 1rem', background: processing ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 500, fontSize: '0.85rem', borderRadius: 6, border: 'none', cursor: processing ? 'not-allowed' : 'pointer', marginBottom: '1rem', transition: 'background 0.15s' }}
                    >
                        {processing ? 'Uploading...' : 'Upload Document'}
                    </button>

                    {/* Disclaimer */}
                    <div style={{ background: '#fffbeb', borderLeft: '3px solid #f59e0b', color: '#b45309', borderRadius: 4, padding: '0.75rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        <InfoIcon /> <strong>Disclaimer:</strong> The corresponding tracking QR or Barcode image will be automatically generated and compiled natively <em>after</em> the target document asset has successfully finished writing to local database clusters.
                    </div>
                </form>
            </div>
        </div>
    );
}

function UploadIcon() {
    return <svg width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24"><polyline strokeLinecap="round" points="16 16 12 12 8 16"/><line strokeLinecap="round" x1="12" y1="12" x2="12" y2="21"/><path strokeLinecap="round" d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>;
}
function InfoIcon() {
    return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'inline', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"/><line strokeLinecap="round" x1="12" y1="8" x2="12" y2="12"/><line strokeLinecap="round" x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
