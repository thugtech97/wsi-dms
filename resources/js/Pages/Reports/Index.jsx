import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

export default function ReportsIndex({ tab, userActivity, documentList, users, docTypes, filters }) {
    const activeTab = tab ?? 'user-activity';

    function switchTab(t) {
        router.get(route('reports.index'), { ...filters, tab: t }, { preserveState: false, replace: true });
    }

    function openPrint() {
        const isUA  = activeTab === 'user-activity';
        const base  = isUA ? route('reports.print.user-activity') : route('reports.print.document-list');
        const params = new URLSearchParams(
            isUA
                ? { ua_user: filters.ua_user ?? '', ua_from: filters.ua_from ?? '', ua_to: filters.ua_to ?? '' }
                : { dl_type: filters.dl_type ?? '', dl_user: filters.dl_user ?? '', dl_from: filters.dl_from ?? '', dl_to: filters.dl_to ?? '' }
        );
        window.open(`${base}?${params}`, 'printWindow', 'width=1000,height=700,scrollbars=yes');
    }

    return (
        <DmsLayout activePage="Reports">
            <Head title="Reports" />
            <div style={{ padding: '1.5rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h5 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', margin: 0 }}>Reports</h5>
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Filtered data reports for system activity and document inventory.</p>
                    </div>
                    <button onClick={openPrint} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.5rem 1.1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#4f46e5'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}>
                        <PrintIcon /> Print Report
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0, marginBottom: '1.25rem', borderBottom: '2px solid #e2e8f0' }}>
                    {[
                        { key: 'user-activity', label: 'User Activity' },
                        { key: 'document-list', label: 'Document List per Type' },
                    ].map(t => (
                        <button key={t.key} onClick={() => switchTab(t.key)} style={{
                            padding: '0.65rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', border: 'none', background: 'none', cursor: 'pointer',
                            color: activeTab === t.key ? '#4f46e5' : '#64748b',
                            borderBottom: activeTab === t.key ? '2px solid #4f46e5' : '2px solid transparent',
                            marginBottom: -2, transition: 'all 0.15s',
                        }}>{t.label}</button>
                    ))}
                </div>

                {activeTab === 'user-activity'
                    ? <UserActivityTab data={userActivity} users={users} filters={filters} />
                    : <DocumentListTab data={documentList} docTypes={docTypes} filters={filters} />
                }
            </div>
        </DmsLayout>
    );
}

// ── User Activity Report ────────────────────────────────────────────────────

function UserActivityTab({ data, users, filters }) {
    const [form, setForm] = useState({
        ua_user: filters.ua_user ?? '',
        ua_from: filters.ua_from ?? '',
        ua_to:   filters.ua_to   ?? '',
    });

    function apply(e) {
        e.preventDefault();
        router.get(route('reports.index'), { tab: 'user-activity', ...form }, { preserveState: true, replace: true });
    }
    function clear() {
        const empty = { ua_user: '', ua_from: '', ua_to: '' };
        setForm(empty);
        router.get(route('reports.index'), { tab: 'user-activity', ...empty }, { replace: true });
    }

    return (
        <>
            {/* Filters */}
            <form onSubmit={apply} style={filterBarStyle}>
                <FilterField label="User">
                    <select value={form.ua_user} onChange={e => setForm(f => ({ ...f, ua_user: e.target.value }))} style={inputStyle}>
                        <option value="">All Users</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </FilterField>
                <FilterField label="From">
                    <input type="date" value={form.ua_from} onChange={e => setForm(f => ({ ...f, ua_from: e.target.value }))} style={inputStyle} />
                </FilterField>
                <FilterField label="To">
                    <input type="date" value={form.ua_to} onChange={e => setForm(f => ({ ...f, ua_to: e.target.value }))} style={inputStyle} />
                </FilterField>
                <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                    <button type="submit" style={btnPrimary}>Filter</button>
                    <button type="button" onClick={clear} style={btnSecondary}>Clear</button>
                </div>
            </form>

            {/* Table */}
            <DataTable
                total={data.total}
                headers={['User','Date & Time','Activity','Document Name','Document Type']}
                empty="No activity records found."
                links={data.links}
                from={data.from} to={data.to}
            >
                {data.data.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                        <td style={tdStyle}><span style={{ fontWeight: 600, color: '#0f172a' }}>{row.user}</span></td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: '#64748b' }}>{row.dateTime}</td>
                        <td style={tdStyle}><ActivityBadge activity={row.activity} /></td>
                        <td style={tdStyle}>{row.documentName}</td>
                        <td style={tdStyle}>
                            {row.documentType !== '—' && (
                                <span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 4, padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>
                                    {row.documentType}
                                </span>
                            )}
                            {row.documentType === '—' && <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                    </tr>
                ))}
            </DataTable>
        </>
    );
}

// ── Document List per Type ──────────────────────────────────────────────────

function DocumentListTab({ data, docTypes, filters }) {
    const [form, setForm] = useState({
        dl_type: filters.dl_type ?? '',
        dl_user: filters.dl_user ?? '',
        dl_from: filters.dl_from ?? '',
        dl_to:   filters.dl_to   ?? '',
    });

    function apply(e) {
        e.preventDefault();
        router.get(route('reports.index'), { tab: 'document-list', ...form }, { preserveState: true, replace: true });
    }
    function clear() {
        const empty = { dl_type: '', dl_user: '', dl_from: '', dl_to: '' };
        setForm(empty);
        router.get(route('reports.index'), { tab: 'document-list', ...empty }, { replace: true });
    }

    return (
        <>
            {/* Filters */}
            <form onSubmit={apply} style={filterBarStyle}>
                <FilterField label="Document Type">
                    <select value={form.dl_type} onChange={e => setForm(f => ({ ...f, dl_type: e.target.value }))} style={inputStyle}>
                        <option value="">All Types</option>
                        {docTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                </FilterField>
                <FilterField label="User">
                    <input type="text" value={form.dl_user} onChange={e => setForm(f => ({ ...f, dl_user: e.target.value }))} placeholder="Filter by owner..." style={inputStyle} />
                </FilterField>
                <FilterField label="Uploaded From">
                    <input type="date" value={form.dl_from} onChange={e => setForm(f => ({ ...f, dl_from: e.target.value }))} style={inputStyle} />
                </FilterField>
                <FilterField label="Uploaded To">
                    <input type="date" value={form.dl_to} onChange={e => setForm(f => ({ ...f, dl_to: e.target.value }))} style={inputStyle} />
                </FilterField>
                <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                    <button type="submit" style={btnPrimary}>Filter</button>
                    <button type="button" onClick={clear} style={btnSecondary}>Clear</button>
                </div>
            </form>

            {/* Table */}
            <DataTable
                total={data.total}
                headers={['QR / Barcode','Document Name','Document Type','Uploaded Date','User']}
                empty="No documents found."
                links={data.links}
                from={data.from} to={data.to}
            >
                {data.data.map((doc, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: 2, background: '#fff' }}>
                                    <img src={doc.codeImage} alt={doc.codeType} style={doc.codeType === 'QR' ? { width: 48, height: 48 } : { width: 72, height: 24, objectFit: 'contain' }} />
                                </div>
                                <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'monospace' }}>{doc.codeId}</span>
                            </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#0f172a' }}>{doc.name}</td>
                        <td style={tdStyle}>
                            <span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 4, padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 600 }}>
                                {doc.type}
                            </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{doc.uploadedDate}</td>
                        <td style={tdStyle}>{doc.owner}</td>
                    </tr>
                ))}
            </DataTable>
        </>
    );
}

// ── Shared Components ────────────────────────────────────────────────────────

function DataTable({ total, headers, children, empty, links, from, to }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>Results</span>
                <span style={{ background: '#f1f5f9', color: '#334155', fontWeight: 500, padding: '0.2rem 0.55rem', borderRadius: 4, fontSize: '0.75rem' }}>{total} records</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                            {headers.map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {total === 0
                            ? <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>{empty}</td></tr>
                            : children
                        }
                    </tbody>
                </table>
            </div>
            {links && links.length > 3 && (
                <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Showing {from}–{to} of {total}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {links.map((link, i) => (
                            <Link key={i} href={link.url ?? '#'} preserveState style={{
                                padding: '0.3rem 0.6rem', borderRadius: 4, fontSize: '0.78rem', border: '1px solid #e2e8f0',
                                background: link.active ? '#6366f1' : '#fff',
                                color: link.active ? '#fff' : '#475569',
                                textDecoration: 'none', pointerEvents: link.url ? 'auto' : 'none', opacity: link.url ? 1 : 0.4,
                            }} dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterField({ label, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
            {children}
        </div>
    );
}

const activityColorMap = {
    'Logged In':             { bg: '#eef2ff', color: '#4f46e5' },
    'Uploaded Document':     { bg: '#f0fdf4', color: '#16a34a' },
    'Deleted Document':      { bg: '#fff1f2', color: '#e11d48' },
    'Updated Document':      { bg: '#fffbeb', color: '#d97706' },
    'Created Document Type': { bg: '#f0fdf4', color: '#16a34a' },
    'Deleted Document Type': { bg: '#fff1f2', color: '#e11d48' },
    'Registered':            { bg: '#f0f9ff', color: '#0284c7' },
};

function ActivityBadge({ activity }) {
    const c = activityColorMap[activity] ?? { bg: '#f1f5f9', color: '#475569' };
    return <span style={{ background: c.bg, color: c.color, borderRadius: 4, padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{activity}</span>;
}

function PrintIcon() {
    return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline strokeLinecap="round" points="6 9 6 2 18 2 18 9"/><path strokeLinecap="round" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>;
}

const filterBarStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' };
const inputStyle     = { padding: '0.45rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.83rem', color: '#334155', background: '#f8fafc', outline: 'none', minWidth: 140 };
const btnPrimary     = { padding: '0.48rem 1rem', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.83rem', borderRadius: 6, border: 'none', cursor: 'pointer' };
const btnSecondary   = { padding: '0.48rem 1rem', background: '#fff', color: '#475569', fontWeight: 500, fontSize: '0.83rem', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer' };
const thStyle        = { padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' };
const tdStyle        = { padding: '0.75rem 1rem', color: '#334155' };
