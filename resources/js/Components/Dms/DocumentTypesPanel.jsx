import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { useConfirm } from '@/Components/Dms/ConfirmDialog';

// Settings → Document Types tab. Lives on the Settings page, so no layout of its own.
export default function DocumentTypesPanel({ documentTypes, folders }) {
    const [editing, setEditing] = useState(null);
    const { confirm, dialog } = useConfirm();

    const createForm = useForm({ name: '', folder_id: '' });
    const editForm   = useForm({ name: '', folder_id: '' });
    const deleteForm = useForm({});

    function handleCreate(e) {
        e.preventDefault();
        createForm.post(route('document-types.store'), {
            onSuccess: () => createForm.reset(),
            preserveState: true, preserveScroll: true,
        });
    }

    function startEdit(type) {
        setEditing(type.id);
        editForm.setData({ name: type.name, folder_id: type.folder_id ? String(type.folder_id) : '' });
    }

    function handleEdit(e, id) {
        e.preventDefault();
        editForm.put(route('document-types.update', id), {
            onSuccess: () => setEditing(null),
            preserveState: true, preserveScroll: true,
        });
    }

    async function handleDelete(id) {
        const ok = await confirm({
            title: 'Delete this document type?',
            message: 'Documents using it will also be removed.',
            confirmLabel: 'Delete type',
            tone: 'danger',
        });
        if (!ok) return;

        deleteForm.delete(route('document-types.destroy', id), { preserveState: true, preserveScroll: true });
    }

    return (
        <>
            <div>

                {/* Create */}
                <Card title="Add Document Type">
                    <form onSubmit={handleCreate}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 180 }}>
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
                            <div style={{ minWidth: 180 }}>
                                <label style={labelSt}>Folder (optional)</label>
                                <select
                                    value={createForm.data.folder_id}
                                    onChange={e => createForm.setData('folder_id', e.target.value)}
                                    style={inputSt}
                                >
                                    <option value="">No folder</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={String(f.id)}>{f.name}</option>
                                    ))}
                                </select>
                                {createForm.errors.folder_id && <Err>{createForm.errors.folder_id}</Err>}
                            </div>
                            <IndigoBtn type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'Adding...' : 'Add Type'}
                            </IndigoBtn>
                        </div>
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
                                    {['Name', 'Folder', 'Documents', 'Actions'].map(h => (
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
                                                <form onSubmit={e => handleEdit(e, type.id)} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <input
                                                        autoFocus
                                                        value={editForm.data.name}
                                                        onChange={e => editForm.setData('name', e.target.value)}
                                                        style={{ ...inputSt, margin: 0, minWidth: 140 }}
                                                    />
                                                    <select
                                                        value={editForm.data.folder_id}
                                                        onChange={e => editForm.setData('folder_id', e.target.value)}
                                                        style={{ ...inputSt, margin: 0, minWidth: 140 }}
                                                    >
                                                        <option value="">No folder</option>
                                                        {folders.map(f => (
                                                            <option key={f.id} value={String(f.id)}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                    <IndigoBtn type="submit" small disabled={editForm.processing}>Save</IndigoBtn>
                                                    <GhostBtn type="button" onClick={() => setEditing(null)}>Cancel</GhostBtn>
                                                </form>
                                            ) : (
                                                <span style={{ fontWeight: 500, color: '#0f172a' }}>{type.name}</span>
                                            )}
                                        </td>
                                        <td style={tdSt}>
                                            {type.folder_name ? (
                                                <span style={{ fontSize: '0.78rem', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 4, padding: '0.15rem 0.5rem', fontWeight: 500 }}>
                                                    {type.folder_name}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>—</span>
                                            )}
                                        </td>
                                        <td style={tdSt}>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{type.documents_count ?? 0} docs</span>
                                        </td>
                                        <td style={tdSt}>
                                            {editing !== type.id && (
                                                <div style={{ display: 'flex', gap: 8 }}>
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
            {dialog}
        </>
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
