import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

const EVENT_COLORS = {
    login:   { bg: '#eef2ff', color: '#4f46e5' },
    created: { bg: '#f0fdf4', color: '#16a34a' },
    deleted: { bg: '#fff1f2', color: '#e11d48' },
    updated: { bg: '#fffbeb', color: '#d97706' },
};

export default function AuditTrailIndex({ audits, users, filters }) {
    const [form, setForm] = useState({
        user_id: filters.user_id ?? '',
        event:   filters.event   ?? '',
        from:    filters.from    ?? '',
        to:      filters.to      ?? '',
    });

    function applyFilters(e) {
        e.preventDefault();
        router.get(route('audit-trail.index'), form, { preserveState: true, replace: true });
    }

    function clearFilters() {
        const empty = { user_id: '', event: '', from: '', to: '' };
        setForm(empty);
        router.get(route('audit-trail.index'), empty, { replace: true });
    }

    return (
        <DmsLayout activePage="Audit Trail">
            <Head title="Audit Trail" />
            <div style={{ padding: '1.5rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <h5 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', margin: 0 }}>Audit Trail</h5>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Complete log of all system events and user activities.</p>
                </div>

                {/* Filters */}
                <form onSubmit={applyFilters} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                        <label style={labelStyle}>User</label>
                        <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} style={inputStyle}>
                            <option value="">All Users</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
                        <label style={labelStyle}>Event</label>
                        <select value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))} style={inputStyle}>
                            <option value="">All Events</option>
                            {['login','created','updated','deleted'].map(ev => (
                                <option key={ev} value={ev}>{ev.charAt(0).toUpperCase() + ev.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={labelStyle}>From</label>
                        <input type="date" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={labelStyle}>To</label>
                        <input type="date" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" style={btnPrimary}>Filter</button>
                        <button type="button" onClick={clearFilters} style={btnSecondary}>Clear</button>
                    </div>
                </form>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>Audit Log</span>
                        <span style={{ background: '#f1f5f9', color: '#334155', fontWeight: 500, padding: '0.2rem 0.55rem', borderRadius: 4, fontSize: '0.75rem' }}>
                            {audits.total} entries
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                                    {['User','Event','Model','Detail','IP Address','Date & Time'].map(h => (
                                        <th key={h} style={thStyle}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {audits.data.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No audit records found.</td></tr>
                                ) : audits.data.map((a, i) => (
                                    <AuditRow key={i} audit={a} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {audits.last_page > 1 && (
                        <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                Showing {audits.from}–{audits.to} of {audits.total}
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {audits.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        preserveState
                                        style={{
                                            padding: '0.3rem 0.6rem', borderRadius: 4, fontSize: '0.78rem', border: '1px solid #e2e8f0',
                                            background: link.active ? '#6366f1' : '#fff',
                                            color: link.active ? '#fff' : '#475569',
                                            textDecoration: 'none', pointerEvents: link.url ? 'auto' : 'none', opacity: link.url ? 1 : 0.4,
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DmsLayout>
    );
}

function AuditRow({ audit }) {
    const [showDetail, setShowDetail] = useState(false);
    const ec = EVENT_COLORS[audit.event] ?? { bg: '#f8fafc', color: '#64748b' };
    const hasDetail = audit.newValues && Object.keys(audit.newValues).length > 0;

    return (
        <>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
            >
                <td style={tdStyle}><span style={{ fontWeight: 600, color: '#0f172a' }}>{audit.user}</span></td>
                <td style={tdStyle}>
                    <span style={{ background: ec.bg, color: ec.color, borderRadius: 4, padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 600 }}>
                        {audit.event}
                    </span>
                </td>
                <td style={tdStyle}><span style={{ background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '0.15rem 0.45rem', fontSize: '0.72rem' }}>{audit.model}</span></td>
                <td style={tdStyle}>
                    {hasDetail && (
                        <button onClick={() => setShowDetail(v => !v)} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
                            {showDetail ? 'Hide' : 'View'} changes
                        </button>
                    )}
                </td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>{audit.ipAddress ?? '—'}</td>
                <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{audit.dateTime}</td>
            </tr>
            {showDetail && hasDetail && (
                <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={6} style={{ padding: '0.75rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            {Object.keys(audit.oldValues ?? {}).length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Before</div>
                                    <pre style={{ margin: 0, fontSize: '0.72rem', color: '#ef4444', background: '#fff1f2', padding: '0.5rem 0.75rem', borderRadius: 4, maxWidth: 300, overflow: 'auto' }}>
                                        {JSON.stringify(audit.oldValues, null, 2)}
                                    </pre>
                                </div>
                            )}
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>After</div>
                                <pre style={{ margin: 0, fontSize: '0.72rem', color: '#16a34a', background: '#f0fdf4', padding: '0.5rem 0.75rem', borderRadius: 4, maxWidth: 300, overflow: 'auto' }}>
                                    {JSON.stringify(audit.newValues, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

const labelStyle = { fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' };
const inputStyle = { padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.83rem', color: '#334155', background: '#f8fafc', outline: 'none', minWidth: 140 };
const btnPrimary   = { padding: '0.48rem 1rem', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.83rem', borderRadius: 6, border: 'none', cursor: 'pointer' };
const btnSecondary = { padding: '0.48rem 1rem', background: '#fff', color: '#475569', fontWeight: 500, fontSize: '0.83rem', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer' };
const thStyle = { padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' };
const tdStyle = { padding: '0.75rem 1rem', color: '#334155' };
