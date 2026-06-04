import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useResponsive } from '@/hooks/useResponsive';

const ALL_NAV_ITEMS = [
    { label: 'Dashboard',       icon: <DashboardIcon />, routeName: 'dashboard',            adminOnly: true },
    { label: 'User Management', icon: <UsersIcon />,     routeName: 'users.index',          adminOnly: true },
    { label: 'Documents',       icon: <DocumentIcon />,  routeName: 'documents.index',      adminOnly: false },
    { label: 'Document Types',  icon: <TagsIcon />,      routeName: 'document-types.index', adminOnly: true },
    { label: 'Audit Trail',     icon: <AuditIcon />,     routeName: 'audit-trail.index',    adminOnly: true },
    { label: 'Reports',         icon: <ChartIcon />,     routeName: 'reports.index',        adminOnly: true },
    { label: 'Settings',        icon: <SettingsIcon />,  routeName: 'settings.index',       adminOnly: true },
];

export default function DmsLayout({ activePage, scanValue = '', onScanChange, children }) {
    const { auth, unreadNotificationsCount } = usePage().props;
    const { isMobile, isTablet } = useResponsive();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const notifCount = unreadNotificationsCount ?? 0;
    const isAdmin    = auth?.user?.role === 'admin';
    const NAV_ITEMS  = ALL_NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

    // Close sidebar on route change or resize to desktop
    useEffect(() => {
        if (!isMobile) setSidebarOpen(false);
    }, [isMobile]);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobile && sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobile, sidebarOpen]);

    const navbarHeight = 53;
    const sidebarWidth = isTablet ? 60 : 220;
    const showLabels   = !isTablet;

    return (
        <div style={{ minHeight: '100vh', background: '#f6f8fa', fontFamily: "'Inter', sans-serif", color: '#334155' }}>

            {/* ── Navbar ────────────────────────────────────────────── */}
            <nav style={{
                background: '#fff', borderBottom: '1px solid #e2e8f0',
                padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.5rem',
                position: 'sticky', top: 0, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
                {/* Left: hamburger (mobile/tablet) + brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    {(isMobile || isTablet) && (
                        <button
                            onClick={() => setSidebarOpen(o => !o)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 6, display: 'flex', flexShrink: 0 }}
                        >
                            <HamburgerIcon />
                        </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: isMobile ? '0.85rem' : '1.05rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <FolderTreeIcon />
                        {isMobile
                            ? <span>Webfocus DMS</span>
                            : <span>Webfocus Document Management System</span>
                        }
                    </div>
                </div>

                {/* Center: scan search (hidden on mobile) */}
                {!isMobile && (
                    <div style={{ flex: 1, maxWidth: 400 }}>
                        <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
                            <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: '#f8fafc', color: '#6366f1', borderRight: '1px solid #cbd5e1' }}>
                                <BarcodeIcon />
                            </span>
                            <input
                                type="text"
                                value={scanValue}
                                onChange={e => onScanChange && onScanChange(e.target.value)}
                                placeholder="Scan Barcode or QR Code…"
                                style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.82rem', outline: 'none', border: 'none', color: '#1e293b', minWidth: 0 }}
                            />
                            {scanValue && (
                                <button onClick={() => onScanChange && onScanChange('')}
                                    style={{ padding: '0 10px', background: '#fff', border: 'none', borderLeft: '1px solid #cbd5e1', cursor: 'pointer', color: '#94a3b8' }}>
                                    <XIcon />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Right: user */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#64748b', flexShrink: 0 }}>
                    <BadgeIcon />
                    {!isMobile && <span>{auth?.user?.name ?? 'Guest'}</span>}
                </div>
            </nav>

            {/* Mobile scan bar (below navbar) */}
            {isMobile && (
                <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0.5rem 1rem' }}>
                    <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: '#f8fafc', color: '#6366f1', borderRight: '1px solid #cbd5e1' }}>
                            <BarcodeIcon />
                        </span>
                        <input
                            type="text"
                            value={scanValue}
                            onChange={e => onScanChange && onScanChange(e.target.value)}
                            placeholder="Scan Barcode or QR Code…"
                            style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.82rem', outline: 'none', border: 'none', color: '#1e293b' }}
                        />
                        {scanValue && (
                            <button onClick={() => onScanChange && onScanChange('')}
                                style={{ padding: '0 10px', background: '#fff', border: 'none', borderLeft: '1px solid #cbd5e1', cursor: 'pointer', color: '#94a3b8' }}>
                                <XIcon />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', position: 'relative' }}>

                {/* ── Mobile backdrop ──────────────────────────────── */}
                {isMobile && sidebarOpen && (
                    <div
                        onClick={() => setSidebarOpen(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 40,
                            background: 'rgba(15,23,42,0.45)',
                            backdropFilter: 'blur(1px)',
                        }}
                    />
                )}

                {/* ── Sidebar ──────────────────────────────────────── */}
                <aside style={{
                    background: '#fff',
                    borderRight: '1px solid #e2e8f0',
                    width: isMobile ? 240 : sidebarWidth,
                    flexShrink: 0,
                    padding: '1.25rem 0.6rem',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    // Desktop/tablet: sticky
                    ...(isMobile ? {
                        position: 'fixed',
                        top: 0, left: 0, bottom: 0,
                        zIndex: 45,
                        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 0.25s ease',
                        boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
                        padding: '1.25rem 0.75rem',
                    } : {
                        position: 'sticky',
                        top: navbarHeight,
                        height: `calc(100vh - ${navbarHeight}px)`,
                    }),
                }}>
                    {/* Mobile sidebar header */}
                    {isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Menu</span>
                            <button onClick={() => setSidebarOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                                <XIcon />
                            </button>
                        </div>
                    )}

                    <nav style={{ display: 'flex', flexDirection: 'column' }}>
                        {NAV_ITEMS.map(item => (
                            <SidebarLink key={item.label} item={item} active={activePage === item.label} showLabel={showLabels || isMobile} onNavigate={() => setSidebarOpen(false)} />
                        ))}

                        <SidebarLink
                            item={{ label: 'Notifications', icon: <BellIcon />, routeName: 'notifications.index' }}
                            active={activePage === 'Notifications'}
                            badge={notifCount > 0 ? notifCount : null}
                            showLabel={showLabels || isMobile}
                            onNavigate={() => setSidebarOpen(false)}
                        />

                        <div style={{ height: 1, background: '#e2e8f0', margin: '0.75rem 0' }} />

                        <SidebarLink
                            item={{ label: 'User Profile', icon: <ProfileIcon />, routeName: 'profile.edit' }}
                            active={activePage === 'User Profile'}
                            showLabel={showLabels || isMobile}
                            onNavigate={() => setSidebarOpen(false)}
                        />
                        <SidebarLink
                            item={{ label: 'Logout', icon: <LogoutIcon />, routeName: 'logout', method: 'post', danger: true }}
                            active={false}
                            showLabel={showLabels || isMobile}
                            onNavigate={() => {}}
                        />
                    </nav>
                </aside>

                {/* ── Main content ─────────────────────────────────── */}
                <main style={{ flex: 1, minWidth: 0 }}>
                    {children}
                </main>
            </div>
        </div>
    );
}

function SidebarLink({ item, active, badge, showLabel, onNavigate }) {
    const baseStyle = {
        display: 'flex', alignItems: 'center',
        padding: showLabel ? '0.65rem 0.85rem' : '0.75rem',
        justifyContent: showLabel ? 'flex-start' : 'center',
        borderRadius: 6, marginBottom: '0.2rem',
        fontSize: '0.87rem', fontWeight: 500,
        textDecoration: 'none', transition: 'all 0.15s',
        color: active ? '#4f46e5' : (item.danger ? '#ef4444' : '#475569'),
        background: active ? '#eef2ff' : 'transparent',
        cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left',
    };
    const iconStyle = {
        color: active ? '#4f46e5' : (item.danger ? '#ef4444' : '#94a3b8'),
        display: 'flex', alignItems: 'center', flexShrink: 0,
        marginRight: showLabel ? '0.7rem' : 0,
    };

    const inner = (
        <>
            <span style={iconStyle}>{item.icon}</span>
            {showLabel && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
            {showLabel && badge && (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: 9999, fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', marginLeft: 4 }}>
                    {badge}
                </span>
            )}
            {!showLabel && badge && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
            )}
        </>
    );

    const clickProps = { onClick: onNavigate };

    if (!item.routeName) return <button style={{ ...baseStyle, position: 'relative' }} {...clickProps}>{inner}</button>;
    if (item.method === 'post') return <Link href={route(item.routeName)} method="post" as="button" style={{ ...baseStyle, position: 'relative' }} {...clickProps}>{inner}</Link>;
    return <Link href={route(item.routeName)} style={{ ...baseStyle, position: 'relative' }} {...clickProps}>{inner}</Link>;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function HamburgerIcon() {
    return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line strokeLinecap="round" x1="3" y1="6" x2="21" y2="6"/><line strokeLinecap="round" x1="3" y1="12" x2="21" y2="12"/><line strokeLinecap="round" x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function FolderTreeIcon() {
    return <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>;
}
function BarcodeIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 6v12M8 6v12M12 6v12M16 6v12M20 6v12"/></svg>;
}
function XIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>;
}
function BadgeIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="10" r="3"/><path strokeLinecap="round" d="M7 20c0-2.21 2.239-4 5-4s5 1.79 5 4"/></svg>;
}
function UsersIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
function DocumentIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline strokeLinecap="round" points="14 2 14 8 20 8"/><line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13"/><line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function TagsIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line strokeLinecap="round" x1="7" y1="7" x2="7.01" y2="7"/></svg>;
}
function ChartIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21.21 15.89A10 10 0 118 2.83"/><path strokeLinecap="round" d="M22 12A10 10 0 0012 2v10z"/></svg>;
}
function DashboardIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function AuditIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline strokeLinecap="round" points="12 6 12 12 16 14"/></svg>;
}
function SettingsIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function BellIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
function ProfileIcon() {
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function LogoutIcon() {
    return <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
}
