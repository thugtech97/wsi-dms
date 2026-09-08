import { useResponsive } from '@/hooks/useResponsive';
import { APP_NAME, APP_SUBTITLE } from '@/Components/Dms/OmbudsmanLogo';
import AuthSeal from '@/Components/Dms/AuthSeal';

export default function DmsGuestLayout({ children, title, subtitle }) {
    const { isMobile } = useResponsive();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Left branding panel — hidden on mobile ── */}
            {!isMobile && (
                <div style={{
                    width: '42%', minHeight: '100vh', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(155deg, #dbe9fd 0%, #bfd6f9 55%, #9dbdf2 100%)',
                    borderRight: '1px solid #b9cdf0',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    padding: '3rem 3.5rem', color: '#0f172a', flexShrink: 0,
                }}>
                    {/* Decorative circles */}
                    <div style={{ position: 'absolute', top: -100, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(255,255,255,0.38)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -80, left: -70, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '60%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.20)', pointerEvents: 'none' }} />

                    {/* Logo + title */}
                    <div style={{ marginBottom: '2.25rem', position: 'relative' }}>
                        <AuthSeal size={168} style={{ marginBottom: '1.35rem' }} />
                        <h1 style={{ fontSize: '1.45rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '0.6rem', letterSpacing: '-0.01em', color: '#1e1b4b' }}>
                            Office of the<br />Ombudsman<br />Document Management System
                        </h1>
                        <p style={{ color: '#3730a3', fontSize: '0.875rem', fontWeight: 500 }}>
                            Secure. Organized. Accessible.
                        </p>
                    </div>

                    <p style={{ position: 'absolute', bottom: '1.5rem', left: '3.5rem', fontSize: '0.7rem', color: '#5b6b8c' }}>
                        © 2026 Office of the Ombudsman. All rights reserved.
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
                            <AuthSeal size={96} style={{ margin: '0 auto 0.75rem' }} />
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{APP_NAME}</p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{APP_SUBTITLE}</p>
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

