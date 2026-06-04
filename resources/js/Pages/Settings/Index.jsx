import { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

export default function SettingsIndex({ settings, systemInfo }) {
    const { flash } = usePage().props;

    const s = (key, def = '') => settings[key] ?? def;

    const [form, setForm] = useState({
        system_name:          s('system_name',          'Webfocus Document Management System'),
        default_language:     s('default_language',     'English'),
        timezone:             s('timezone',             'Asia/Manila'),
        date_format:          s('date_format',          'MMM DD, YYYY'),
        time_format:          s('time_format',          '12-Hour (hh:mm A)'),
        session_timeout:      s('session_timeout',      '30'),
        idle_logout_warning:  s('idle_logout_warning',  '5'),
        numbering_format:     s('numbering_format',     'INV-{YYYY}-{NNNN}'),
        max_file_size:        s('max_file_size',        '20'),
        allowed_types:        s('allowed_types',        'pdf, docx, xlsx, pptx, jpg, png, txt'),
        auto_backup:          s('auto_backup',          '1'),
        backup_frequency:     s('backup_frequency',     'Daily'),
        backup_retention:     s('backup_retention',     '30'),
    });

    const [saving, setSaving] = useState(false);

    function set(key, value) { setForm(f => ({ ...f, [key]: value })); }

    function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        router.post(route('settings.update'), form, {
            onFinish: () => setSaving(false),
            preserveScroll: true,
        });
    }

    const storagePercent = systemInfo.storageTotalMb > 0
        ? Math.min(100, Math.round((systemInfo.storageUsedMb / systemInfo.storageTotalMb) * 100))
        : 0;

    // Numbering preview
    const preview = form.numbering_format
        .replace('{YYYY}', new Date().getFullYear())
        .replace('{MM}', String(new Date().getMonth() + 1).padStart(2, '0'))
        .replace('{NNNN}', '0001');

    return (
        <DmsLayout activePage="Settings">
            <Head title="Settings" />

            {/* ── Page Header (matches settings.html header area) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem 1.5rem', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Settings</h1>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '2px 0 0' }}>Configure system preferences and management options.</p>
                    </div>
                    <Link href={route('audit-trail.index')} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '0.45rem 1rem', background: '#fff',
                        border: '1px solid #e2e8f0', borderRadius: 8,
                        fontSize: '0.82rem', fontWeight: 700, color: '#334155',
                        textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}>
                        <RefreshIcon /> Audit Logs
                    </Link>
                </div>
            </div>

            {/* ── Content ─────────────────────────────────────────── */}
            <div style={{ padding: '1.5rem', background: '#f9fafb', minHeight: 'calc(100vh - 53px - 73px)' }}>

                {flash?.success && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1.25rem', fontSize: '0.83rem', color: '#16a34a', fontWeight: 500 }}>
                        {flash.success}
                    </div>
                )}

                <form onSubmit={handleSave}>
                    {/* 3-column grid matching settings.html exactly */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>

                        {/* ── COLUMN 1 ─────────────────────────────── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* General Settings */}
                            <Card title="General Settings">
                                <Field label="System Name">
                                    <Input value={form.system_name} onChange={v => set('system_name', v)} />
                                </Field>
                                <Field label="Default Language">
                                    <Select value={form.default_language} onChange={v => set('default_language', v)}
                                        options={[['English','English'],['Filipino','Filipino'],['Spanish','Spanish']]} />
                                </Field>
                                <Field label="Default Timezone">
                                    <Select value={form.timezone} onChange={v => set('timezone', v)} options={[
                                        ['Asia/Manila',    '(GMT+08:00) Asia/Manila'],
                                        ['UTC',            'UTC'],
                                        ['America/New_York','(GMT-05:00) America/New_York'],
                                        ['Europe/London',  '(GMT+00:00) Europe/London'],
                                        ['Asia/Tokyo',     '(GMT+09:00) Asia/Tokyo'],
                                        ['Asia/Singapore', '(GMT+08:00) Asia/Singapore'],
                                    ]} />
                                </Field>
                                <Field label="Date Format">
                                    <Select value={form.date_format} onChange={v => set('date_format', v)} options={[
                                        ['MMM DD, YYYY','MMM DD, YYYY'],
                                        ['MM/DD/YYYY','MM/DD/YYYY'],
                                        ['DD/MM/YYYY','DD/MM/YYYY'],
                                        ['YYYY-MM-DD','YYYY-MM-DD'],
                                    ]} />
                                </Field>
                                <Field label="Time Format">
                                    <Select value={form.time_format} onChange={v => set('time_format', v)} options={[
                                        ['12-Hour (hh:mm A)','12-Hour (hh:mm A)'],
                                        ['24-Hour (HH:mm)',  '24-Hour (HH:mm)'],
                                    ]} />
                                </Field>
                                <div style={{ paddingTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                    <SaveBtn saving={saving} />
                                </div>
                            </Card>

                            {/* Session Settings */}
                            <Card title="Session Settings">
                                <Field label={<>Session Timeout <HelpIcon /></>}>
                                    <Select value={form.session_timeout} onChange={v => set('session_timeout', v)} options={[
                                        ['15','15 minutes'],['30','30 minutes'],['60','60 minutes'],['120','2 hours'],['240','4 hours'],
                                    ]} />
                                </Field>
                                <Field label={<>Idle Logout Warning <HelpIcon /></>}>
                                    <Select value={form.idle_logout_warning} onChange={v => set('idle_logout_warning', v)} options={[
                                        ['2','2 minutes before logout'],['5','5 minutes before logout'],['10','10 minutes before logout'],
                                    ]} />
                                </Field>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>Remember Me</span>
                                    <Toggle checked={true} />
                                </div>
                            </Card>

                        </div>

                        {/* ── COLUMN 2 ─────────────────────────────── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Document Numbering */}
                            <Card title="Document Numbering">
                                <Field label={<>Numbering Format <HelpIcon /></>}>
                                    <Input value={form.numbering_format} onChange={v => set('numbering_format', v)} />
                                </Field>
                                <Field label="Preview">
                                    <div style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.83rem', color: '#64748b', fontWeight: 500, boxSizing: 'border-box' }}>
                                        {preview}
                                    </div>
                                </Field>
                                <Field label={<>Reset Sequence <HelpIcon /></>}>
                                    <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: '0.78rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                                        <RefreshIcon /> Reset Counter
                                    </button>
                                </Field>
                            </Card>

                            {/* File & Storage Settings */}
                            <Card title="File & Storage Settings">
                                <Field label={<>Maximum File Size <HelpIcon /></>}>
                                    <Select value={form.max_file_size} onChange={v => set('max_file_size', v)} options={[
                                        ['5','5 MB'],['10','10 MB'],['20','20 MB'],['50','50 MB'],['100','100 MB'],['200','200 MB'],
                                    ]} />
                                </Field>
                                <Field label={<>Allowed File Types <HelpIcon /></>}>
                                    <Input value={form.allowed_types} onChange={v => set('allowed_types', v)} />
                                </Field>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>Virus Scan for Uploads</span>
                                    <Toggle checked={true} />
                                </div>
                            </Card>

                            {/* Backup Settings */}
                            <Card title="Backup Settings">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>Auto Backup</span>
                                    <Toggle checked={form.auto_backup === '1'} onChange={v => set('auto_backup', v ? '1' : '0')} />
                                </div>
                                <Field label="Backup Frequency">
                                    <Select value={form.backup_frequency} onChange={v => set('backup_frequency', v)} options={[
                                        ['Daily','Daily'],['Weekly','Weekly'],['Monthly','Monthly'],
                                    ]} />
                                </Field>
                                <Field label="Backup Retention">
                                    <Select value={form.backup_retention} onChange={v => set('backup_retention', v)} options={[
                                        ['7','7 Days'],['14','14 Days'],['30','30 Days'],['90','90 Days'],
                                    ]} />
                                </Field>
                                <button type="button" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: '0.78rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                                    <DownloadIcon /> Backup Now
                                </button>
                            </Card>

                        </div>

                        {/* ── COLUMN 3 ─────────────────────────────── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* System Information */}
                            <Card title="System Information">
                                <InfoRow label="Version"     value={systemInfo.version} />
                                <InfoRow label="Environment" value={systemInfo.environment} />
                                <InfoRow label="Database"    value={systemInfo.database} />
                                <InfoRow label="Server Time" value={systemInfo.serverTime} />
                                <div style={{ height: 1, background: '#f1f5f9', margin: '0.25rem 0' }} />
                                <InfoRow label="Total Users"     value={systemInfo.totalUsers.toLocaleString()} />
                                <InfoRow label="Total Documents" value={systemInfo.totalDocuments.toLocaleString()} />
                                <div>
                                    <InfoRow label="Storage Used"
                                        value={`${systemInfo.storageUsedMb} MB / 30 GB (${storagePercent}%)`} />
                                    <div style={{ marginTop: 6, width: '100%', background: '#f1f5f9', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                                        <div style={{ width: `${storagePercent}%`, background: '#3b82f6', height: '100%', borderRadius: 999, transition: 'width 0.4s' }} />
                                    </div>
                                </div>
                            </Card>

                            {/* Quick Actions */}
                            <Card title="Quick Actions">
                                {[
                                    { label: 'Manage Document Templates', href: route('document-types.index'), icon: <DocIcon /> },
                                    { label: 'Manage Workflow Templates',  href: null,                         icon: <WorkflowIcon /> },
                                    { label: 'Manage Roles & Permissions', href: route('users.index'),         icon: <RolesIcon /> },
                                    { label: 'Configure Email Settings',   href: null,                         icon: <EmailIcon /> },
                                    { label: 'View Audit Logs',            href: route('audit-trail.index'),   icon: <ClockIcon /> },
                                ].map(a => (
                                    a.href
                                        ? <Link key={a.label} href={a.href} style={qaStyle}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc/50'}>
                                            <span style={{ color: '#94a3b8' }}>{a.icon}</span>{a.label}
                                          </Link>
                                        : <button key={a.label} type="button" style={qaStyle}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,250,252,0.5)'}>
                                            <span style={{ color: '#94a3b8' }}>{a.icon}</span>{a.label}
                                          </button>
                                ))}
                                <button type="button" style={{ ...qaStyle, borderColor: '#fee2e2', background: 'rgba(254,242,242,0.3)', color: '#dc2626', marginTop: 8 }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(254,242,242,0.3)'}>
                                    <span style={{ color: '#dc2626' }}><DangerIcon /></span> Reset System Settings
                                </button>
                            </Card>

                        </div>
                    </div>
                </form>
            </div>
        </DmsLayout>
    );
}

// ── Shared UI components ──────────────────────────────────────────────────────

function Card({ title, children }) {
    return (
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{children}</div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                {label}
            </label>
            {children}
        </div>
    );
}

function Input({ value, onChange, placeholder }) {
    return (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={inputStyle} onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#3b82f6'; }}
            onBlur={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; }} />
    );
}

function Select({ value, onChange, options }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
    );
}

function InfoRow({ label, value }) {
    return (
        <div>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>{label}</p>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', margin: 0 }}>{value}</p>
        </div>
    );
}

function Toggle({ checked: initial, onChange }) {
    const [on, setOn] = useState(initial);
    function toggle() { const next = !on; setOn(next); onChange?.(next); }
    return (
        <div onClick={toggle} style={{ width: 36, height: 20, borderRadius: 999, background: on ? '#2563eb' : '#e2e8f0', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
    );
}

function SaveBtn({ saving }) {
    return (
        <button type="submit" disabled={saving} style={{ padding: '0.45rem 1.5rem', background: '#2563eb', color: '#fff', fontSize: '0.78rem', fontWeight: 700, borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.15)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
        </button>
    );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function HelpIcon()     { return <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#cbd5e1' }}><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"/></svg>; }
function RefreshIcon()  { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>; }
function DownloadIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/></svg>; }
function DocIcon()      { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>; }
function WorkflowIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>; }
function RolesIcon()    { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>; }
function EmailIcon()    { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>; }
function ClockIcon()    { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline strokeLinecap="round" points="12 6 12 12 16 14"/></svg>; }
function DangerIcon()   { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>; }

const inputStyle = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.83rem', color: '#334155', background: '#f8fafc', outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s' };
const qaStyle    = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '0.6rem 1rem', border: '1px solid #f1f5f9', background: 'rgba(248,250,252,0.5)', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, color: '#475569', cursor: 'pointer', textDecoration: 'none', transition: 'background 0.15s' };
