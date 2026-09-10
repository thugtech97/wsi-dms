import { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

// Metric card color palette — cycles if more than 4 types
const CARD_THEMES = [
    { bg: '#f0fdf4', color: '#16a34a', icon: <ReceiptIcon /> },
    { bg: '#eef2ff', color: '#4f46e5', icon: <SignatureIcon /> },
    { bg: '#fffbeb', color: '#d97706', icon: <GavelIcon /> },
    { bg: '#f0f9ff', color: '#0284c7', icon: <UserTieIcon /> },
    { bg: '#fff1f2', color: '#e11d48', icon: <ReceiptIcon /> },
];

const CHART_COLORS = ['#22c55e','#6366f1','#f59e0b','#38bdf8','#f43f5e','#a78bfa'];

export default function Dashboard({ docsByType, chartData, recentAudits, filters }) {
    return (
        <DmsLayout activePage="Dashboard">
            <Head title="Dashboard" />
            <div style={{ padding: '1.5rem 2rem', background: '#f6f8fa', minHeight: 'calc(100vh - 53px)' }}>

                {/* ── Section Header ────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div>
                        <h5 style={{ fontWeight: 600, fontSize: '1rem', color: '#1e293b', margin: '0 0 2px' }}>System Metrics Dashboard</h5>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Indexed assets and activity for the selected period.</p>
                    </div>
                    {/* The icon used to wrap onto a line of its own; a flex row
                        that will not wrap keeps it beside the label. */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 2 }}>
                        <CalendarIcon />
                        {rangeLabel(filters)}
                    </div>
                </div>

                {/* ── Date Filter ──────────────────────────────── */}
                <DateFilter filters={filters} />

                {/* ── Row 1: Metric Cards (one per document type) ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {docsByType.length === 0 ? (
                        <div style={{ ...cardStyle, padding: '1.25rem', color: '#94a3b8', fontSize: '0.82rem', gridColumn: '1 / -1', textAlign: 'center' }}>
                            No document types configured yet.
                        </div>
                    ) : docsByType.map((dt, i) => {
                        const theme = CARD_THEMES[i % CARD_THEMES.length];
                        return (
                            <div key={dt.name} style={{ ...cardStyle, padding: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <span style={{ fontSize: '0.76rem', fontWeight: 500, color: '#64748b' }}>Total {dt.name}</span>
                                        <div style={{ fontSize: '1.55rem', fontWeight: 700, color: '#0f172a', lineHeight: 1, marginTop: 3 }}>
                                            {dt.count.toLocaleString()}
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2, display: 'block' }}>
                                            indexed documents
                                        </span>
                                    </div>
                                    <div style={{ width: 42, height: 42, borderRadius: 8, background: theme.bg, color: theme.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {theme.icon}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Row 2: Charts ─────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <ChartCard title="File Indexing Velocity Trend" icon={<LineChartIcon />} action={
                        <span style={{ fontSize: '0.72rem', border: '1px solid #e2e8f0', borderRadius: 4, padding: '0.15rem 0.5rem', color: '#475569' }}>{rangeLabel(filters)}</span>
                    }>
                        <LineChart labels={chartData.uploadsLabels} counts={chartData.uploadsCounts} />
                    </ChartCard>
                    <ChartCard title="Document Asset Distribution" icon={<PieChartIcon />}>
                        <DoughnutChart labels={chartData.typeLabels} counts={chartData.typeCounts} />
                    </ChartCard>
                </div>

                {/* ── Row 3: Activity + Quicklinks ──────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <ChartCard title="Latest User Activity" icon={<UserClockIcon />} action={
                        <Link href={route('audit-trail.index')} style={{ fontSize: '0.72rem', color: '#94a3b8', textDecoration: 'none' }}>View Audit Log</Link>
                    }>
                        <ActivityTimeline items={recentAudits} />
                    </ChartCard>
                    <ChartCard title="Operational Quicklinks" icon={<BoltIcon />}>
                        <QuickLinks />
                    </ChartCard>
                </div>

            </div>
        </DmsLayout>
    );
}

// ── Date Filter ──────────────────────────────────────────────────────────────

const PRESETS = [
    { key: '7d',  label: 'Last 7 days'  },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 90 days' },
    { key: 'all', label: 'All time'     },
];

/** How the active range reads in the header and on the chart badge. */
function rangeLabel(filters) {
    if (!filters) return '';
    if (filters.preset === 'custom') {
        if (filters.from && filters.to) return `${formatDay(filters.from)} – ${formatDay(filters.to)}`;
        if (filters.from) return `From ${formatDay(filters.from)}`;
        if (filters.to)   return `Up to ${formatDay(filters.to)}`;
        return 'All time';
    }
    return PRESETS.find(p => p.key === filters.preset)?.label ?? 'Last 7 days';
}

function formatDay(iso) {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.valueOf())
        ? iso
        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Scopes the whole page to one period. The range lives in the query string
 * rather than in component state, so the server does the filtering, the view
 * survives a refresh, and a particular period can be shared as a link.
 */
function DateFilter({ filters }) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to,   setTo]   = useState(filters?.to ?? '');

    function apply(params) {
        router.get(route('dashboard'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    // An unfinished custom range would read as "everything", so wait for both
    // ends before reloading.
    function applyCustom(nextFrom, nextTo) {
        if (!nextFrom || !nextTo) return;
        apply({ preset: 'custom', from: nextFrom, to: nextTo });
    }

    const isCustom = filters?.preset === 'custom';

    return (
        <div style={{ ...cardStyle, padding: '0.7rem 0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {PRESETS.map(p => {
                    const active = !isCustom && filters?.preset === p.key;
                    return (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => apply({ preset: p.key })}
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '0.32rem 0.7rem',
                                borderRadius: 6,
                                cursor: 'pointer',
                                border: `1px solid ${active ? '#6366f1' : '#e2e8f0'}`,
                                background: active ? '#eef2ff' : '#fff',
                                color: active ? '#4f46e5' : '#64748b',
                            }}
                        >
                            {p.label}
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Custom</span>
                <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={e => { setFrom(e.target.value); applyCustom(e.target.value, to); }}
                    style={dateInputStyle(isCustom)}
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>–</span>
                <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={e => { setTo(e.target.value); applyCustom(from, e.target.value); }}
                    style={dateInputStyle(isCustom)}
                />
                {isCustom && (
                    <button
                        type="button"
                        onClick={() => { setFrom(''); setTo(''); apply({ preset: '7d' }); }}
                        style={{ fontSize: '0.72rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}

function dateInputStyle(active) {
    return {
        fontSize: '0.75rem',
        fontFamily: 'inherit',
        color: '#334155',
        padding: '0.28rem 0.45rem',
        borderRadius: 6,
        border: `1px solid ${active ? '#6366f1' : '#e2e8f0'}`,
        background: '#fff',
    };
}

// ── Reusable Card Wrapper ────────────────────────────────────────────────────

function ChartCard({ title, icon, action, children }) {
    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#94a3b8' }}>{icon}</span>{title}
                </span>
                {action}
            </div>
            <div style={{ padding: '1.25rem' }}>{children}</div>
        </div>
    );
}

function LineChart({ labels, counts }) {
    const canvasRef = useRef(null);
    const chartRef  = useRef(null);

    useEffect(() => {
        import('chart.js/auto').then(({ default: Chart }) => {
            if (chartRef.current) chartRef.current.destroy();
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.font.size   = 11;
            Chart.defaults.color       = '#64748b';
            const ctx = canvasRef.current.getContext('2d');
            chartRef.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Document Uploads',
                        data: counts,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.03)',
                        fill: true, tension: 0.35, borderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
                    }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { stepSize: 1 } },
                        x: { grid: { display: false } },
                    },
                },
            });
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [labels, counts]);

    return <div style={{ height: 240 }}><canvas ref={canvasRef} /></div>;
}

function DoughnutChart({ labels, counts }) {
    const canvasRef = useRef(null);
    const chartRef  = useRef(null);

    useEffect(() => {
        if (!labels?.length) return;
        import('chart.js/auto').then(({ default: Chart }) => {
            if (chartRef.current) chartRef.current.destroy();
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.font.size   = 11;
            const ctx = canvasRef.current.getContext('2d');
            chartRef.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data: counts,
                        backgroundColor: CHART_COLORS,
                        borderWidth: 4, borderColor: '#ffffff', hoverOffset: 4,
                    }],
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } },
                    },
                },
            });
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [labels, counts]);

    return <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><canvas ref={canvasRef} /></div>;
}

const DOT_COLORS = { primary: '#6366f1', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };

function ActivityTimeline({ items }) {
    if (!items?.length) {
        return <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>No activity recorded yet.</p>;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item, i) => {
                const isLast = i === items.length - 1;
                const dotColor = DOT_COLORS[item.color] ?? '#cbd5e1';
                return (
                    <div key={i} style={{ position: 'relative', paddingLeft: '1.4rem', paddingBottom: isLast ? 0 : '1.1rem', borderLeft: isLast ? '2px solid transparent' : '2px solid #e2e8f0' }}>
                        <div style={{ position: 'absolute', left: -6, top: 4, width: 10, height: 10, borderRadius: '50%', background: dotColor, border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{item.user}</span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.dateTime}</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                            {item.event === 'login'
                                ? 'Logged in to the system'
                                : `${capitalize(item.event)} ${item.model === 'User' ? 'account' : item.model.toLowerCase()}`}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}


function QuickLinks() {
    const links = [
        { label: 'Add Document',  href: route('documents.index'),     icon: '📄', bc: '#eef2ff', bi: '#c7d2fe', hc: '#4f46e5' },
        { label: 'Manage Types',  href: route('document-types.index'), icon: '🏷️', bc: '#f0fdf4', bi: '#bbf7d0', hc: '#16a34a' },
        { label: 'Manage Users',  href: route('users.index'),          icon: '👥', bc: '#f0f9ff', bi: '#bae6fd', hc: '#0284c7' },
        { label: 'System Reports',href: route('reports.index'),        icon: '📊', bc: '#fffbeb', bi: '#fde68a', hc: '#d97706' },
    ];
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {links.map(l => (
                <Link key={l.label} href={l.href} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '1rem', borderRadius: 8, border: `1px dashed ${l.bi}`, background: l.bc,
                    textDecoration: 'none', color: '#475569', fontSize: '0.8rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.2s ease-in-out',
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderStyle = 'solid'; e.currentTarget.style.borderColor = l.hc; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.color = l.hc; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderStyle = 'dashed'; e.currentTarget.style.borderColor = l.bi; e.currentTarget.style.transform = ''; e.currentTarget.style.color = '#475569'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                    <span style={{ fontSize: '1.25rem' }}>{l.icon}</span>
                    <span>{l.label}</span>
                </Link>
            ))}
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

const cardStyle = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)',
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function ReceiptIcon()    { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><line strokeLinecap="round" x1="9" y1="12" x2="15" y2="12"/><line strokeLinecap="round" x1="9" y1="16" x2="12" y2="16"/></svg>; }
function SignatureIcon()  { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline strokeLinecap="round" points="14 2 14 8 20 8"/><line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13"/><line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17"/></svg>; }
function GavelIcon()     { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>; }
function UserTieIcon()   { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function CalendarIcon()  { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ verticalAlign: 'middle', marginRight: 4 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function LineChartIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline strokeLinecap="round" points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function PieChartIcon()  { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21.21 15.89A10 10 0 118 2.83"/><path strokeLinecap="round" d="M22 12A10 10 0 0012 2v10z"/></svg>; }
function UserClockIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
function BoltIcon()      { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon strokeLinecap="round" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }
