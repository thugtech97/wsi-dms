import { useForm } from '@inertiajs/react';

const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fff' };
const labelStyle = { fontWeight: 500, fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' };
const listContainerStyle = {
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '0.50rem',
    maxHeight: '120px',
    overflowY: 'auto',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
};

export default function UploadPanel({ documentTypes, users = [], roles = [], onSuccess }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        label:            '',
        document_type_id: '',
        department:       '',
        code_type:        'QR',
        link_document_url: '',
        allowed_users:     [],
        allowed_roles:     [],
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('documents.store'), {
            onSuccess: () => { reset(); onSuccess?.(); },
        });
    }

    const handleToggleSelection = (field, itemId) => {
        const currentSelection = data[field];
        if (currentSelection.includes(itemId)) {
            setData(field, currentSelection.filter(id => id !== itemId));
        } else {
            setData(field, [...currentSelection, itemId]);
        }
    };

    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 86 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DocIcon /> New Document
            </div>

            <div style={{ padding: '1.25rem' }}>
                <form onSubmit={handleSubmit}>

                    {/* Label */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Label</label>
                        <input
                            type="text"
                            required
                            value={data.label}
                            onChange={e => setData('label', e.target.value)}
                            placeholder="e.g. Contract Agreement 2026"
                            style={inputStyle}
                        />
                        {errors.label && <Err>{errors.label}</Err>}
                    </div>

                    {/* Document Class */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Document Class</label>
                        <select
                            required
                            value={data.document_type_id}
                            onChange={e => setData('document_type_id', e.target.value)}
                            style={inputStyle}
                        >
                            <option value="" disabled>Choose classification…</option>
                            {documentTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        {errors.document_type_id && <Err>{errors.document_type_id}</Err>}
                    </div>

                    {/* Department */}
                    {/* <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Department</label>
                        <input
                            type="text"
                            value={data.department}
                            onChange={e => setData('department', e.target.value)}
                            placeholder="e.g. Human Resources"
                            style={inputStyle}
                        />
                        {errors.department && <Err>{errors.department}</Err>}
                    </div> */}

                    {/* Link / Document URL */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Link / Document URL</label>
                        <input
                            type="text"
                            value={data.link_document_url}
                            onChange={e => setData('link_document_url', e.target.value)}
                            placeholder="e.g. https://example.com/document"
                            style={inputStyle}
                        />
                        {errors.link_document_url && <Err>{errors.link_document_url}</Err>}
                    </div>
                    
                    {/* Allowed Users Multi-Select List */}
                    {/* <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Assign to Specific Users</label>
                        <div style={listContainerStyle}>
                            {users.length === 0 ? (
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No users available</span>
                            ) : (
                                users.map(user => {
                                    const isChecked = data.allowed_users.includes(user.id);
                                    return (
                                        <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer', textTransform: 'capitalize' }}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleSelection('allowed_users', user.id)}
                                                style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                                            />
                                            {user.name}
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        {errors.allowed_users && <Err>{errors.allowed_users}</Err>}
                    </div> */}

                    {/* Allowed Roles Multi-Select List */}
                    {/* <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Assign to System Roles</label>
                        <div style={listContainerStyle}>
                            {roles.length === 0 ? (
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No roles available</span>
                            ) : (
                                roles.map(role => {
                                    const isChecked = data.allowed_roles.includes(role.id);
                                    return (
                                        <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer', textTransform: 'capitalize' }}>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleSelection('allowed_roles', role.id)}
                                                style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                                            />
                                            {role.name}
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        {errors.allowed_roles && <Err>{errors.allowed_roles}</Err>}
                    </div> */}

                    {/* Code Type */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Tracking Code</label>
                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                            {['QR', 'Barcode'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
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
                        style={{ width: '100%', padding: '0.55rem 1rem', background: processing ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.85rem', borderRadius: 6, border: 'none', cursor: processing ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
                    >
                        {processing ? 'Saving…' : 'Save Document'}
                    </button>

                </form>
            </div>
        </div>
    );
}

function Err({ children }) {
    return <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{children}</p>;
}
function DocIcon() {
    return <svg width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline strokeLinecap="round" points="14 2 14 8 20 8"/><line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13"/><line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17"/></svg>;
}
