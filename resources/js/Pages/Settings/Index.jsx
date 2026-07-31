import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';
import DocumentFormBuilder from '@/Components/Dms/DocumentFormBuilder';

export default function SettingsIndex({ settings, systemInfo, formFields = [], fieldTypes = [], choiceTypes = [] }) {
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

    const [saving, setSaving]     = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    function set(key, value) { setForm(f => ({ ...f, [key]: value })); }

    function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        router.post(route('settings.update'), form, {
            onFinish: () => setSaving(false),
            preserveScroll: true,
            preserveState: true,
            only: ['settings', 'flash'],
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

                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', gap: 0 }}>
                    {[['general','General Settings'], ['form','Document Form'], ['code','Code Format']].map(([key, label]) => (
                        <button key={key} type="button" onClick={() => setActiveTab(key)} style={{
                            padding: '0.55rem 1.25rem', fontSize: '0.83rem', fontWeight: 600, border: 'none',
                            borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent',
                            marginBottom: -2, background: 'none', cursor: 'pointer',
                            color: activeTab === key ? '#2563eb' : '#64748b',
                            transition: 'color 0.15s',
                        }}>{label}</button>
                    ))}
                </div>

                {activeTab === 'general' && <>
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
                </>}

                {activeTab === 'form' && <>
                    {flash?.success && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1.25rem', fontSize: '0.83rem', color: '#16a34a', fontWeight: 500 }}>
                            {flash.success}
                        </div>
                    )}
                    <DocumentFormBuilder
                        formFields={formFields}
                        fieldTypes={fieldTypes}
                        choiceTypes={choiceTypes}
                    />
                </>}

                {activeTab === 'code' && <CodeCustomizer />}

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

// ── Code Format Customizer Tab ────────────────────────────────────────────────

function useScript(src) {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        if (document.querySelector(`script[src="${src}"]`)) { setLoaded(true); return; }
        const el = document.createElement('script');
        el.src = src;
        el.onload = () => setLoaded(true);
        document.head.appendChild(el);
    }, [src]);
    return loaded;
}

function CodeCustomizer() {
    const [codeTab, setCodeTab] = useState('qr');
    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
                {[['qr','⬛ QR Code'], ['barcode','▐▌ Barcode']].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setCodeTab(k)} style={{
                        padding: '0.5rem 1.2rem', fontSize: '0.83rem', fontWeight: 600, borderRadius: 8,
                        border: codeTab === k ? '2px solid #6366f1' : '2px solid #e2e8f0',
                        background: codeTab === k ? '#eef2ff' : '#fff',
                        color: codeTab === k ? '#4f46e5' : '#64748b',
                        cursor: 'pointer', transition: 'all 0.15s',
                    }}>{l}</button>
                ))}
            </div>
            {codeTab === 'qr'      && <QrCustomizer />}
            {codeTab === 'barcode' && <BarcodeCustomizer />}
        </div>
    );
}

// ── QR Code Customizer ────────────────────────────────────────────────────────
function QrCustomizer() {
    const qrLoaded = useScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
    const qrRef    = useRef(null);

    const [data,       setData]       = useState('https://google.com');
    const [labelText,  setLabelText]  = useState('Scan Me!');
    const [showLabel,  setShowLabel]  = useState(true);
    const [showLink,   setShowLink]   = useState(false);
    const [layout,     setLayout]     = useState('label-top');
    const [qrColor,    setQrColor]    = useState('#000000');
    const [labelColor, setLabelColor] = useState('#212529');
    const [size,       setSize]       = useState(200);

    useEffect(() => {
        if (!qrLoaded || !qrRef.current) return;
        qrRef.current.innerHTML = '';
        try {
            new window.QRCode(qrRef.current, {
                text: data || ' ',
                width: size, height: size,
                colorDark: qrColor,
                colorLight: '#ffffff',
                correctLevel: window.QRCode.CorrectLevel.H,
            });
        } catch {}
    }, [qrLoaded, data, size, qrColor]);

    const flexDir = { 'label-top': 'column', 'label-bottom': 'column-reverse', 'label-left': 'row', 'label-right': 'row-reverse' }[layout];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Controls */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' }}>QR Code Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <CField label="QR Code Data / Link">
                        <CInput value={data} onChange={setData} placeholder="Enter URL or text" />
                    </CField>
                    <CField label="Label Text">
                        <CInput value={labelText} onChange={setLabelText} placeholder="Enter label" />
                    </CField>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.85rem' }}>
                        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.6rem' }}>Visibility</p>
                        <CToggleRow label="Show Text Label" checked={showLabel} onChange={setShowLabel} />
                        <CToggleRow label="Show QR Code Link" checked={showLink} onChange={setShowLink} />
                    </div>
                    <CField label="Layout Position">
                        <select value={layout} onChange={e => setLayout(e.target.value)} style={cInputSt}>
                            <option value="label-top">Label on Top, QR on Bottom</option>
                            <option value="label-bottom">QR on Top, Label on Bottom</option>
                            <option value="label-left">Label on Left, QR on Right</option>
                            <option value="label-right">QR on Left, Label on Right</option>
                        </select>
                    </CField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <CField label="QR Color">
                            <input type="color" value={qrColor} onChange={e => setQrColor(e.target.value)} style={{ ...cInputSt, padding: '0.2rem', height: 38, cursor: 'pointer' }} />
                        </CField>
                        <CField label="Label Color">
                            <input type="color" value={labelColor} onChange={e => setLabelColor(e.target.value)} style={{ ...cInputSt, padding: '0.2rem', height: 38, cursor: 'pointer' }} />
                        </CField>
                    </div>
                    <CField label={`QR Code Size: ${size}px`}>
                        <input type="range" min={128} max={300} step={16} value={size} onChange={e => setSize(Number(e.target.value))} style={{ width: '100%' }} />
                    </CField>
                </div>
            </div>

            {/* Live Preview */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' }}>Live Preview</h3>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 340 }}>
                    <div style={{
                        display: 'flex', flexDirection: flexDir, alignItems: 'center', justifyContent: 'center',
                        padding: 20, border: '2px dashed #e2e8f0', borderRadius: 12, background: '#fff', gap: 10,
                        transition: 'flex-direction 0.2s',
                    }}>
                        {showLabel && (
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: labelColor, textAlign: 'center', wordBreak: 'break-word', margin: 8 }}>
                                {labelText || 'Label'}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div ref={qrRef} style={{ display: 'inline-block' }} />
                            {showLink && (
                                <div style={{ fontSize: '0.78rem', color: labelColor, wordBreak: 'break-all', textAlign: 'center', maxWidth: 240, marginTop: 4 }}>
                                    {data}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>Changes apply instantly as you tweak the settings.</p>
            </div>
        </div>
    );
}

// ── Barcode Customizer ────────────────────────────────────────────────────────
function BarcodeCustomizer() {
    const bcLoaded = useScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js');
    const svgRef   = useRef(null);

    const [data,         setData]         = useState('CODE128DEMO');
    const [labelText,    setLabelText]    = useState('Product Package');
    const [showLabel,    setShowLabel]    = useState(true);
    const [showLink,     setShowLink]     = useState(false);
    const [layout,       setLayout]       = useState('label-top');
    const [barcodeColor, setBarcodeColor] = useState('#000000');
    const [labelColor,   setLabelColor]   = useState('#212529');
    const [barWidth,     setBarWidth]     = useState(2);
    const [barHeight,    setBarHeight]    = useState(80);

    useEffect(() => {
        if (!bcLoaded || !svgRef.current) return;
        try {
            window.JsBarcode(svgRef.current, data || ' ', {
                format: 'CODE128', width: barWidth, height: barHeight,
                lineColor: barcodeColor, background: 'transparent', displayValue: false,
            });
            svgRef.current.style.maxWidth = '100%';
        } catch {}
    }, [bcLoaded, data, barWidth, barHeight, barcodeColor]);

    const flexDir = { 'label-top': 'column', 'label-bottom': 'column-reverse', 'label-left': 'row', 'label-right': 'row-reverse' }[layout];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Controls */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' }}>Barcode Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <CField label="Barcode Value / Data">
                        <CInput value={data} onChange={setData} placeholder="Enter alphanumeric text" />
                    </CField>
                    <CField label="Label Text">
                        <CInput value={labelText} onChange={setLabelText} placeholder="Enter label" />
                    </CField>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.85rem' }}>
                        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.6rem' }}>Visibility</p>
                        <CToggleRow label="Show Text Label" checked={showLabel} onChange={setShowLabel} />
                        <CToggleRow label="Show Plaintext Value Below" checked={showLink} onChange={setShowLink} />
                    </div>
                    <CField label="Layout Position">
                        <select value={layout} onChange={e => setLayout(e.target.value)} style={cInputSt}>
                            <option value="label-top">Label on Top, Barcode on Bottom</option>
                            <option value="label-bottom">Barcode on Top, Label on Bottom</option>
                            <option value="label-left">Label on Left, Barcode on Right</option>
                            <option value="label-right">Barcode on Left, Label on Right</option>
                        </select>
                    </CField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <CField label="Barcode Color">
                            <input type="color" value={barcodeColor} onChange={e => setBarcodeColor(e.target.value)} style={{ ...cInputSt, padding: '0.2rem', height: 38, cursor: 'pointer' }} />
                        </CField>
                        <CField label="Label Color">
                            <input type="color" value={labelColor} onChange={e => setLabelColor(e.target.value)} style={{ ...cInputSt, padding: '0.2rem', height: 38, cursor: 'pointer' }} />
                        </CField>
                    </div>
                    <CField label={`Bar Width: ${barWidth}`}>
                        <input type="range" min={1} max={4} step={1} value={barWidth} onChange={e => setBarWidth(Number(e.target.value))} style={{ width: '100%' }} />
                    </CField>
                    <CField label={`Bar Height: ${barHeight}px`}>
                        <input type="range" min={40} max={150} step={10} value={barHeight} onChange={e => setBarHeight(Number(e.target.value))} style={{ width: '100%' }} />
                    </CField>
                </div>
            </div>

            {/* Live Preview */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' }}>Live Preview</h3>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 340 }}>
                    <div style={{
                        display: 'flex', flexDirection: flexDir, alignItems: 'center', justifyContent: 'center',
                        padding: 25, border: '2px dashed #e2e8f0', borderRadius: 12, background: '#fff', gap: 10,
                        transition: 'flex-direction 0.2s',
                    }}>
                        {showLabel && (
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: labelColor, textAlign: 'center', wordBreak: 'break-word', margin: 8 }}>
                                {labelText || 'Label'}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
                            {showLink && (
                                <div style={{ fontSize: '0.82rem', color: labelColor, wordBreak: 'break-all', textAlign: 'center', maxWidth: 300, marginTop: 4 }}>
                                    {data}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>Changes apply instantly as you tweak the settings.</p>
            </div>
        </div>
    );
}

// ── Code Customizer shared helpers ────────────────────────────────────────────
function CField({ label, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    );
}
function CInput({ value, onChange, placeholder }) {
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={cInputSt} />;
}
function CToggleRow({ label, checked, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.82rem', color: '#475569' }}>{label}</span>
            <div onClick={() => onChange(!checked)} style={{ width: 34, height: 18, borderRadius: 999, background: checked ? '#6366f1' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: checked ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
        </div>
    );
}
const cInputSt = { width: '100%', padding: '0.47rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.83rem', color: '#334155', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' };
