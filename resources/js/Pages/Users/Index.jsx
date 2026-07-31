import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

export default function UsersIndex({ users, roles }) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser,     setEditingUser]     = useState(null);

    const roleForm   = useForm({ name: '' });
    const deleteForm = useForm({});

    function handleCreateRole(e) {
        e.preventDefault();
        roleForm.post(route('roles.store'), { onSuccess: () => roleForm.reset() });
    }

    function handleDeleteRole(role) {
        if (!confirm(`Delete role "${role.name}"? Users with this role will lose it.`)) return;
        deleteForm.delete(route('roles.destroy', role.id));
    }

    function handleDeleteUser(user) {
        if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
        deleteForm.delete(route('users.destroy', user.id));
    }

    return (
        <DmsLayout activePage="User Management">
            <Head title="User Management" />
            <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>User Management</h1>
                    {isAdmin && (
                        <button onClick={() => setShowCreateModal(true)} style={indigoBtnSt}>
                            + Create User
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* ── Users table ── */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>All Users</span>
                                <span style={{ background: '#f1f5f9', color: '#334155', fontWeight: 500, padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.8rem' }}>
                                    {users.length} user{users.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            {['Name', 'Email', 'Role', 'Documents', 'Joined', isAdmin ? 'Actions' : null].filter(Boolean).map(h => (
                                                <th key={h} style={thSt}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <UserRow
                                                key={user.id}
                                                user={user}
                                                roles={roles}
                                                isAdmin={isAdmin}
                                                currentUserId={auth?.user?.id}
                                                onEdit={() => setEditingUser(user)}
                                                onDelete={() => handleDeleteUser(user)}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Roles panel ── */}
                    {isAdmin && (
                        <div style={{ width: 280, flexShrink: 0 }}>
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                                    Roles
                                </div>
                                <div style={{ padding: '1.25rem' }}>
                                    <form onSubmit={handleCreateRole} style={{ marginBottom: '1rem' }}>
                                        <label style={labelSt}>New Role</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="text"
                                                value={roleForm.data.name}
                                                onChange={e => roleForm.setData('name', e.target.value)}
                                                placeholder="e.g. manager"
                                                style={{ ...inputSt, flex: 1 }}
                                                required
                                            />
                                            <button type="submit" disabled={roleForm.processing} style={{ padding: '0.47rem 0.85rem', background: roleForm.processing ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.82rem', borderRadius: 6, border: 'none', cursor: roleForm.processing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                                                Add
                                            </button>
                                        </div>
                                        {roleForm.errors.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{roleForm.errors.name}</p>}
                                    </form>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {roles.map(role => {
                                            const isCore = role.name === 'admin' || role.name === 'user';
                                            return (
                                                <div key={role.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 6 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <RoleBadge role={role.name} />
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{role.users_count} user{role.users_count !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    {!isCore && (
                                                        <button onClick={() => handleDeleteRole(role)} disabled={deleteForm.processing} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', fontSize: '0.8rem', padding: '0.2rem 0.4rem', borderRadius: 4 }}
                                                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                            onMouseLeave={e => e.currentTarget.style.color = '#fca5a5'}>✕</button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCreateModal && (
                <UserFormModal
                    title="Create User"
                    roles={roles}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={(form) => form.post(route('users.store'), { onSuccess: () => setShowCreateModal(false) })}
                    initialData={{ name: '', email: '', password: '', password_confirmation: '', role: roles[0]?.name ?? 'user' }}
                    requirePassword
                />
            )}

            {editingUser && (
                <UserFormModal
                    title="Edit User"
                    roles={roles}
                    onClose={() => setEditingUser(null)}
                    onSubmit={(form) => form.put(route('users.update', editingUser.id), { onSuccess: () => setEditingUser(null) })}
                    initialData={{ name: editingUser.name, email: editingUser.email, password: '', password_confirmation: '', role: editingUser.role }}
                    requirePassword={false}
                />
            )}
        </DmsLayout>
    );
}

// ── User Form Modal (shared for create + edit) ─────────────────────────────────
function UserFormModal({ title, roles, onClose, onSubmit, initialData, requirePassword }) {
    const form = useForm(initialData);

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(3px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{title}</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', padding: 4 }}>✕</button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelSt}>Full Name</label>
                        <input type="text" value={form.data.name} onChange={e => form.setData('name', e.target.value)} style={inputSt} required placeholder="e.g. Juan dela Cruz" />
                        {form.errors.name && <Err>{form.errors.name}</Err>}
                    </div>
                    <div>
                        <label style={labelSt}>Email Address</label>
                        <input type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} style={inputSt} required placeholder="e.g. juan@example.com" />
                        {form.errors.email && <Err>{form.errors.email}</Err>}
                    </div>
                    <div>
                        <label style={labelSt}>Role</label>
                        <select value={form.data.role} onChange={e => form.setData('role', e.target.value)} style={inputSt} required>
                            {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                            ))}
                        </select>
                        {form.errors.role && <Err>{form.errors.role}</Err>}
                    </div>
                    <div>
                        <label style={labelSt}>{requirePassword ? 'Password' : 'New Password (leave blank to keep current)'}</label>
                        <input type="password" value={form.data.password} onChange={e => form.setData('password', e.target.value)} style={inputSt} required={requirePassword} placeholder={requirePassword ? 'Min. 8 characters' : 'Leave blank to keep current'} />
                        {form.errors.password && <Err>{form.errors.password}</Err>}
                    </div>
                    <div>
                        <label style={labelSt}>Confirm Password</label>
                        <input type="password" value={form.data.password_confirmation} onChange={e => form.setData('password_confirmation', e.target.value)} style={inputSt} required={requirePassword} placeholder="Repeat password" />
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', background: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: '0.85rem', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={form.processing} style={{ padding: '0.5rem 1.25rem', background: form.processing ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.85rem', borderRadius: 8, border: 'none', cursor: form.processing ? 'not-allowed' : 'pointer' }}>
                            {form.processing ? 'Saving…' : title}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── User Row ──────────────────────────────────────────────────────────────────
function UserRow({ user, roles, isAdmin, currentUserId, onEdit, onDelete }) {
    const { data, setData, put, processing } = useForm({ role: user.role });

    function handleRoleChange(e) {
        const newRole = e.target.value;
        setData('role', newRole);
        put(route('users.update-role', user.id), { data: { role: newRole }, preserveScroll: true });
    }

    const isSelf = user.id === currentUserId;

    return (
        <tr onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <td style={tdSt}>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
                {isSelf && <span style={{ fontSize: '0.7rem', color: '#6366f1', background: '#eef2ff', padding: '0.1rem 0.4rem', borderRadius: 3, fontWeight: 500 }}>You</span>}
            </td>
            <td style={tdSt}><span style={{ color: '#64748b' }}>{user.email}</span></td>
            <td style={tdSt}><RoleBadge role={user.role} /></td>
            <td style={tdSt}><span style={{ color: '#64748b' }}>{user.documents_count} docs</span></td>
            <td style={tdSt}><span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{user.created_at}</span></td>
            {isAdmin && (
                <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select value={data.role} onChange={handleRoleChange} disabled={processing || isSelf}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', color: '#334155', cursor: 'pointer' }}>
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>)}
                        </select>
                        <button onClick={onEdit} title="Edit user" style={{ padding: '0.35rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#4f46e5'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}>
                            Edit
                        </button>
                        {!isSelf && (
                            <button onClick={onDelete} title="Delete user" style={{ padding: '0.35rem 0.6rem', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}>
                                Delete
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
}

function RoleBadge({ role }) {
    const palette = { admin: { background: '#eef2ff', color: '#4f46e5' }, user: { background: '#f1f5f9', color: '#475569' } };
    const s = palette[role] ?? { background: '#f0fdf4', color: '#15803d' };
    return <span style={{ ...s, fontWeight: 500, padding: '0.25rem 0.55rem', borderRadius: 4, fontSize: '0.75rem' }}>{role}</span>;
}

function Err({ children }) {
    return <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{children}</p>;
}

const labelSt    = { fontWeight: 500, fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' };
const inputSt    = { width: '100%', padding: '0.47rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', boxSizing: 'border-box' };
const indigoBtnSt = { padding: '0.5rem 1.1rem', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.85rem', borderRadius: 8, border: 'none', cursor: 'pointer' };
const thSt       = { fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b', padding: '0.85rem 1.25rem', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', textAlign: 'left' };
const tdSt       = { padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#334155' };
