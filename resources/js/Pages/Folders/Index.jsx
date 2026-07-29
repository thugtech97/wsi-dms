import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

export default function FoldersIndex({ folders, availableRoles }) {
    const [editingFolder, setEditingFolder] = useState(null);

    const createForm = useForm({ name: '', roles: [] });
    const deleteForm = useForm({});

    function addCreateRole() {
        createForm.setData('roles', [...createForm.data.roles, { role_id: '', permission: 'read_only' }]);
    }
    function removeCreateRole(i) {
        createForm.setData('roles', createForm.data.roles.filter((_, idx) => idx !== i));
    }
    function updateCreateRole(i, key, value) {
        createForm.setData('roles', createForm.data.roles.map((r, idx) => idx === i ? { ...r, [key]: value } : r));
    }

    function handleCreate(e) {
        e.preventDefault();
        createForm.post(route('folders.store'), { onSuccess: () => createForm.reset() });
    }

    function handleDelete(id, name) {
        if (!confirm(`Delete folder "${name}"? Document types in this folder will be unlinked.`)) return;
        deleteForm.delete(route('folders.destroy', id));
    }

    return (
        <DmsLayout activePage="Folders">
            <Head title="Folders" />
            <div style={{ padding: '1.5rem', maxWidth: 860 }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Folders</h1>

                {/* Create */}
                <Card title="Create Folder">
                    <form onSubmit={handleCreate}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={labelSt}>Folder Name</label>
                            <input
                                type="text"
                                value={createForm.data.name}
                                onChange={e => createForm.setData('name', e.target.value)}
                                placeholder="e.g. Human Resources"
                                style={inputSt}
                                required
                            />
                            {createForm.errors.name && <Err>{createForm.errors.name}</Err>}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={labelSt}>Role Access</label>
                                <button type="button" onClick={addCreateRole} style={addRoleBtnSt}>+ Add Role</button>
                            </div>

                            {createForm.data.roles.length === 0 && (
                                <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No roles assigned. Click "Add Role" to grant access.</p>
                            )}

                            {createForm.data.roles.map((role, i) => (
                                <RoleRow
                                    key={i}
                                    role={role}
                                    availableRoles={availableRoles}
                                    onChange={(k, v) => updateCreateRole(i, k, v)}
                                    onRemove={() => removeCreateRole(i)}
                                    errors={createForm.errors}
                                    index={i}
                                />
                            ))}
                        </div>

                        <IndigoBtn type="submit" disabled={createForm.processing}>
                            {createForm.processing ? 'Creating...' : 'Create Folder'}
                        </IndigoBtn>
                    </form>
                </Card>

                {/* List */}
                <Card title={`${folders.length} Folder${folders.length !== 1 ? 's' : ''}`}>
                    {folders.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No folders yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Folder', 'Doc Types', 'Role Access', 'Actions'].map(h => (
                                        <th key={h} style={thSt}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {folders.map(folder => (
                                    <tr key={folder.id}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                                        <td style={tdSt}>
                                            <span style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <FolderIcon color="#6366f1" />
                                                {folder.name}
                                            </span>
                                        </td>
                                        <td style={tdSt}>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                {folder.document_types_count} type{folder.document_types_count !== 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        <td style={tdSt}>
                                            {folder.roles.length === 0 ? (
                                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>None</span>
                                            ) : (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                    {folder.roles.map(r => (
                                                        <span key={r.role_id} style={{
                                                            fontSize: '0.72rem', fontWeight: 600,
                                                            padding: '0.18rem 0.55rem', borderRadius: 9999,
                                                            background: r.permission === 'manage' ? '#eef2ff' : '#f0fdf4',
                                                            color: r.permission === 'manage' ? '#4f46e5' : '#15803d',
                                                            border: `1px solid ${r.permission === 'manage' ? '#c7d2fe' : '#bbf7d0'}`,
                                                        }}>
                                                            {r.role_name} · {r.permission === 'manage' ? 'Manage' : 'Read Only'}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td style={tdSt}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <GhostBtn onClick={() => setEditingFolder(folder)}>Edit</GhostBtn>
                                                <DangerBtn onClick={() => handleDelete(folder.id, folder.name)}>Delete</DangerBtn>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </div>

            {editingFolder && (
                <EditFolderModal
                    folder={editingFolder}
                    availableRoles={availableRoles}
                    onClose={() => setEditingFolder(null)}
                />
            )}
        </DmsLayout>
    );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditFolderModal({ folder, availableRoles, onClose }) {
    const form = useForm({
        name:  folder.name,
        roles: folder.roles.map(r => ({ role_id: String(r.role_id), permission: r.permission })),
    });

    function addRole() {
        form.setData('roles', [...form.data.roles, { role_id: '', permission: 'read_only' }]);
    }
    function removeRole(i) {
        form.setData('roles', form.data.roles.filter((_, idx) => idx !== i));
    }
    function updateRole(i, key, value) {
        form.setData('roles', form.data.roles.map((r, idx) => idx === i ? { ...r, [key]: value } : r));
    }

    function handleSubmit(e) {
        e.preventDefault();
        form.put(route('folders.update', folder.id), { onSuccess: onClose });
    }

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(3px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FolderIcon color="#6366f1" /> Edit Folder
                    </span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelSt}>Folder Name</label>
                        <input
                            type="text"
                            value={form.data.name}
                            onChange={e => form.setData('name', e.target.value)}
                            style={inputSt}
                            required
                        />
                        {form.errors.name && <Err>{form.errors.name}</Err>}
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={labelSt}>Role Access</label>
                            <button type="button" onClick={addRole} style={addRoleBtnSt}>+ Add Role</button>
                        </div>

                        {form.data.roles.length === 0 && (
                            <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No roles assigned.</p>
                        )}

                        {form.data.roles.map((role, i) => (
                            <RoleRow
                                key={i}
                                role={role}
                                availableRoles={availableRoles}
                                onChange={(k, v) => updateRole(i, k, v)}
                                onRemove={() => removeRole(i)}
                                errors={form.errors}
                                index={i}
                            />
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <GhostBtn type="button" onClick={onClose}>Cancel</GhostBtn>
                        <IndigoBtn type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : 'Save Changes'}
                        </IndigoBtn>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Role Row ──────────────────────────────────────────────────────────────────
function RoleRow({ role, availableRoles, onChange, onRemove, errors, index }) {
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '0.5rem' }}>
            <select
                value={role.role_id}
                onChange={e => onChange('role_id', e.target.value)}
                style={{ ...inputSt, flex: 1 }}
                required
            >
                <option value="">Select role…</option>
                {availableRoles.map(r => (
                    <option key={r.id} value={String(r.id)}>{r.name}</option>
                ))}
            </select>
            <select
                value={role.permission}
                onChange={e => onChange('permission', e.target.value)}
                style={{ ...inputSt, width: 140 }}
            >
                <option value="manage">Manage</option>
                <option value="read_only">Read Only</option>
            </select>
            <button type="button" onClick={onRemove} style={{ padding: '0.4rem 0.6rem', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', cursor: 'pointer', flexShrink: 0 }}>✕</button>
            {errors[`roles.${index}.role_id`] && <Err>{errors[`roles.${index}.role_id`]}</Err>}
        </div>
    );
}

// ── Shared styles & helpers ───────────────────────────────────────────────────
const labelSt      = { fontWeight: 500, fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' };
const inputSt      = { width: '100%', padding: '0.47rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', boxSizing: 'border-box' };
const thSt         = { fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b', padding: '0.75rem 1rem', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', textAlign: 'left' };
const tdSt         = { padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#334155' };
const addRoleBtnSt = { padding: '0.3rem 0.7rem', fontSize: '0.78rem', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };

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
function IndigoBtn({ children, ...props }) {
    return (
        <button {...props} style={{ padding: '0.5rem 1rem', background: props.disabled ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 500, fontSize: '0.85rem', borderRadius: 6, border: 'none', cursor: props.disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
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
function FolderIcon({ color = '#94a3b8', size = 15 }) {
    return <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>;
}
