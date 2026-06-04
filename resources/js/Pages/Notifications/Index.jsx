import { Head, useForm } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

export default function NotificationsIndex({ notifications }) {
    const markAllForm = useForm({});
    const markOneForm = useForm({ ids: [] });

    function markAll() {
        markAllForm.post(route('notifications.mark-all-read'), { preserveScroll: true });
    }

    function markOne(id) {
        markOneForm.setData('ids', [id]);
        markOneForm.post(route('notifications.mark-read'), { data: { ids: [id] }, preserveScroll: true });
    }

    const unread = notifications.filter(n => !n.read).length;

    return (
        <DmsLayout activePage="Notifications">
            <Head title="Notifications" />
            <div style={{ padding: '1.5rem', maxWidth: 760 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                        Notifications
                        {unread > 0 && (
                            <span style={{ marginLeft: 8, background: '#ef4444', color: '#fff', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem' }}>
                                {unread} unread
                            </span>
                        )}
                    </h1>
                    {unread > 0 && (
                        <button
                            onClick={markAll}
                            disabled={markAllForm.processing}
                            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#64748b', cursor: 'pointer' }}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                            <BellIcon />
                            <p style={{ marginTop: 12, fontSize: '0.9rem' }}>No notifications yet.</p>
                        </div>
                    ) : (
                        notifications.map((n, i) => (
                            <div key={n.id}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                    padding: '1rem 1.25rem',
                                    borderBottom: i < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    background: n.read ? '#fff' : '#f8faff',
                                    transition: 'background 0.15s',
                                }}>
                                <div style={{ marginTop: 2, flexShrink: 0 }}>
                                    {n.read
                                        ? <CheckIcon color="#94a3b8" />
                                        : <BellDotIcon />}
                                </div>
                                <div className="flex-1">
                                    <p style={{ fontSize: '0.875rem', color: n.read ? '#64748b' : '#0f172a', fontWeight: n.read ? 400 : 500, margin: 0 }}>
                                        {n.message}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 3 }}>{n.created_at}</p>
                                </div>
                                {!n.read && (
                                    <button
                                        onClick={() => markOne(n.id)}
                                        style={{ fontSize: '0.75rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', padding: '0.2rem 0' }}
                                    >
                                        Mark read
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DmsLayout>
    );
}

function BellIcon() {
    return <svg width="32" height="32" fill="none" stroke="#cbd5e1" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto', display: 'block' }}><path strokeLinecap="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
function BellDotIcon() {
    return <svg width="16" height="16" fill="none" stroke="#6366f1" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/><circle cx="18" cy="5" r="3" fill="#ef4444" stroke="none"/></svg>;
}
function CheckIcon({ color }) {
    return <svg width="16" height="16" fill="none" stroke={color ?? '#94a3b8'} strokeWidth="2" viewBox="0 0 24 24"><polyline strokeLinecap="round" points="20 6 9 17 4 12"/></svg>;
}
