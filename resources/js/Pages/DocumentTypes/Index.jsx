import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

export default function DocumentTypesIndex({ documentTypes }) {
    const [editing, setEditing] = useState(null);

    const createForm = useForm({ name: '' });
    const editForm   = useForm({ name: '' });
    const deleteForm = useForm({});

    function handleCreate(e) {
        e.preventDefault();
        createForm.post(route('document-types.store'), {
            onSuccess: () => createForm.reset(),
        });
    }

    function startEdit(type) {
        setEditing(type.id);
        editForm.setData('name', type.name);
    }

    function handleEdit(e, id) {
        e.preventDefault();
        editForm.put(route('document-types.update', id), {
            onSuccess: () => setEditing(null),
        });
    }

    function handleDelete(id) {
        if (!confirm('Delete this document type? Documents using it will also be removed.')) return;
        deleteForm.delete(route('document-types.destroy', id));
    }

    return (
        <DmsLayout activePage="Document Types">
            <Head title="Document Types" />
            <div style={{ padding: '1.5rem', maxWidth: 720 }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Document Types</h1>

                {/* Create */}
                <Card title="Add Document Type">
                    <form onSubmit={handleCreate} className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label style={labelSt}>Type Name</label>
                            <input
                                type="text"
                                value={createForm.data.name}
                                onChange={e => createForm.setData('name', e.target.value)}
                                placeholder="e.g. Memorandum"
                                style={inputSt}
                                required
                            />
                            {createForm.errors.name && <Err>{createForm.errors.name}</Err>}
                        </div>
                        <IndigoBtn type="submit" disabled={createForm.processing}>
                            {createForm.processing ? 'Adding...' : 'Add Type'}
                        </IndigoBtn>
                    </form>
                </Card>

                {/* List */}
                <Card title={`${documentTypes.length} Type${documentTypes.length !== 1 ? 's' : ''}`}>
                    {documentTypes.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No document types yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Name', 'Documents', 'Actions'].map(h => (
                                        <th key={h} style={thSt}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {documentTypes.map(type => (
                                    <tr key={type.id}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                                        <td style={tdSt}>
                                            {editing === type.id ? (
                                                <form onSubmit={e => handleEdit(e, type.id)} className="flex gap-2 items-center">
                                                    <input
                                                        autoFocus
                                                        value={editForm.data.name}
                                                        onChange={e => editForm.setData('name', e.target.value)}
                                                        style={{ ...inputSt, margin: 0 }}
                                                    />
                                                    <IndigoBtn type="submit" small disabled={editForm.processing}>Save</IndigoBtn>
                                                    <GhostBtn type="button" onClick={() => setEditing(null)}>Cancel</GhostBtn>
                                                </form>
                                            ) : (
                                                <span style={{ fontWeight: 500, color: '#0f172a' }}>{type.name}</span>
                                            )}
                                        </td>
                                        <td style={tdSt}>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{type.documents_count ?? 0} docs</span>
                                        </td>
                                        <td style={tdSt}>
                                            {editing !== type.id && (
                                                <div className="flex gap-2">
                                                    <GhostBtn onClick={() => startEdit(type)}>Edit</GhostBtn>
                                                    <DangerBtn onClick={() => handleDelete(type.id)}>Delete</DangerBtn>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </div>
        </DmsLayout>
    );
}

const labelSt = { fontWeight: 500, fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' };
const inputSt  = { width: '100%', padding: '0.47rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', boxSizing: 'border-box' };
const thSt     = { fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b', padding: '0.75rem 1rem', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', textAlign: 'left' };
const tdSt     = { padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#334155' };

function Card({ title, children }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{title}</div>
            <div style={{ padding: '1.25rem' }}>{children}</div>
        </div>
    );
}
function Err({ children }) {
    return <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{children}</p>;
}
function IndigoBtn({ children, small, ...props }) {
    return (
        <button {...props} style={{ padding: small ? '0.35rem 0.75rem' : '0.5rem 1rem', background: props.disabled ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 500, fontSize: '0.85rem', borderRadius: 6, border: 'none', cursor: props.disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {children}
        </button>
    );
}
function GhostBtn({ children, ...props }) {
    return (
        <button {...props} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#64748b', cursor: 'pointer' }}>
            {children}
        </button>
    );
}
function DangerBtn({ children, ...props }) {
    return (
        <button {...props} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', border: '1px solid #fecaca', borderRadius: 6, background: '#fff5f5', color: '#dc2626', cursor: 'pointer' }}>
            {children}
        </button>
    );
}
