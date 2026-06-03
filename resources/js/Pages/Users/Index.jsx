import { useForm, usePage } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

export default function UsersIndex({ users, roles }) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';

    return (
        <DmsLayout activePage="User Management">
            <div style={{ padding: '1.5rem' }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>User Management</h1>

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
                                    <UserRow key={user.id} user={user} roles={roles} isAdmin={isAdmin} currentUserId={auth?.user?.id} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DmsLayout>
    );
}

function UserRow({ user, roles, isAdmin, currentUserId }) {
    const { data, setData, put, processing } = useForm({ role: user.role });

    function handleRoleChange(e) {
        const newRole = e.target.value;
        setData('role', newRole);
        put(route('users.update-role', user.id), { data: { role: newRole }, preserveScroll: true });
    }

    return (
        <tr onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <td style={tdSt}>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
                {user.id === currentUserId && (
                    <span style={{ fontSize: '0.7rem', color: '#6366f1', background: '#eef2ff', padding: '0.1rem 0.4rem', borderRadius: 3, fontWeight: 500 }}>You</span>
                )}
            </td>
            <td style={tdSt}><span style={{ color: '#64748b' }}>{user.email}</span></td>
            <td style={tdSt}>
                <RoleBadge role={user.role} />
            </td>
            <td style={tdSt}><span style={{ color: '#64748b' }}>{user.documents_count} docs</span></td>
            <td style={tdSt}><span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{user.created_at}</span></td>
            {isAdmin && (
                <td style={tdSt}>
                    <select
                        value={data.role}
                        onChange={handleRoleChange}
                        disabled={processing || user.id === currentUserId}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', color: '#334155', cursor: 'pointer' }}
                    >
                        {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                </td>
            )}
        </tr>
    );
}

function RoleBadge({ role }) {
    const styles = {
        admin: { background: '#eef2ff', color: '#4f46e5' },
        user:  { background: '#f1f5f9', color: '#475569' },
    };
    const s = styles[role] ?? styles.user;
    return (
        <span style={{ ...s, fontWeight: 500, padding: '0.25rem 0.55rem', borderRadius: 4, fontSize: '0.75rem' }}>
            {role}
        </span>
    );
}

const thSt = { fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b', padding: '0.85rem 1.25rem', borderBottom: '2px solid #f1f5f9', background: '#f8fafc', textAlign: 'left' };
const tdSt = { padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#334155' };
