import { useResponsive } from '@/hooks/useResponsive';

export default function DmsGuestLayout({ children, title, subtitle }) {
    const { isMobile } = useResponsive();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Left branding panel — hidden on mobile ── */}
            {!isMobile && (
                <div style={{
                    width: '42%', minHeight: '100vh', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(155deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    padding: '3rem 3.5rem', color: '#fff', flexShrink: 0,
                }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -100, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(99,102,241,0.18)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -80, left: -70, width: 280, height: 280, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '60%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(165,180,252,0.07)', pointerEvents: 'none' }} />

                    {/* Logo + title */}
                    <div style={{ marginBottom: '2.25rem', position: 'relative' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.12)', borderRadius: 14,
                            width: 56, height: 56, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', marginBottom: '1.5rem',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}>
                            <FolderTreeIcon />
                        </div>
                        <h1 style={{ fontSize: '1.45rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
                            Webfocus<br />Document Management<br />System
                        </h1>
                        <p style={{ color: 'rgba(199,210,254,0.75)', fontSize: '0.875rem' }}>
                            Secure. Organized. Accessible.
                        </p>
                    </div>

                    {/* Feature bullets */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', position: 'relative' }}>
                        {FEATURES.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.1)', borderRadius: 8,
                                    width: 32, height: 32, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0,
                                }}>
                                    {f.icon}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: 2 }}>{f.title}</p>
                                    <p style={{ color: 'rgba(199,210,254,0.7)', fontSize: '0.78rem', lineHeight: 1.5 }}>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p style={{ position: 'absolute', bottom: '1.5rem', left: '3.5rem', fontSize: '0.7rem', color: 'rgba(199,210,254,0.35)' }}>
                        © 2026 Webfocus Inc. All rights reserved.
                    </p>
                </div>
            )}

            {/* ── Right form panel ── */}
            <div style={{
                flex: 1,
                background: isMobile ? '#fff' : '#f6f8fa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: isMobile ? '2rem 1.25rem' : '2rem',
                minHeight: '100vh',
            }}>
                <div style={{ width: '100%', maxWidth: 430 }}>
                    {/* Mobile: show mini branding at top */}
                    {isMobile && (
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                background: '#eef2ff', borderRadius: 12, width: 48, height: 48,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 0.75rem',
                            }}>
                                <FolderTreeIconIndigo />
                            </div>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Webfocus DMS</p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Document Management System</p>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.75rem' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                            {title}
                        </h2>
                        {subtitle && (
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{subtitle}</p>
                        )}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}

const FEATURES = [
    { icon: <ShieldIcon />, title: 'Role-Based Access Control',  desc: 'Separate admin and user permissions keep your data safe.' },
    { icon: <QrIcon />,     title: 'QR & Barcode Tracking',     desc: 'Every document gets a unique scannable tracking code.' },
    { icon: <SearchIcon />, title: 'Instant Scan Search',        desc: 'Locate any file in seconds by scanning its code.' },
];

function FolderTreeIcon() {
    return <svg width="26" height="26" fill="none" stroke="rgba(199,210,254,0.9)" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>;
}
function FolderTreeIconIndigo() {
    return <svg width="22" height="22" fill="none" stroke="#6366f1" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>;
}
function ShieldIcon() {
    return <svg width="16" height="16" fill="none" stroke="rgba(199,210,254,0.85)" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function QrIcon() {
    return <svg width="16" height="16" fill="none" stroke="rgba(199,210,254,0.85)" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path strokeLinecap="round" d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z"/></svg>;
}
function SearchIcon() {
    return <svg width="16" height="16" fill="none" stroke="rgba(199,210,254,0.85)" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>;
}
