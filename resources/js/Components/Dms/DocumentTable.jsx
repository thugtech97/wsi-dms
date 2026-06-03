import { useState, useEffect, useCallback } from 'react';
import Badge from './Badge';
import { useResponsive } from '@/hooks/useResponsive';

const TH = { fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b', padding: '0.85rem 1.25rem', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' };
const TD = { padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#334155' };

export default function DocumentTable({ documents }) {
    const [selected, setSelected] = useState(null);
    const { isMobile, isTablet } = useResponsive();

    return (
        <>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>
                        <ListIcon /> Core Index Repositories
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#334155', fontWeight: 500, padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.8rem' }}>
                        {documents.length} {documents.length === 1 ? 'item' : 'items'}
                    </span>
                </div>

                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 340 : undefined }}>
                        <thead>
                            <tr>
                                <th style={{ ...TH, width: isMobile ? 80 : 120 }}>Asset</th>
                                <th style={TH}>Document</th>
                                <th style={TH}>Type</th>
                                {!isMobile && <th style={TH}>Storage</th>}
                                {!isMobile && <th style={TH}>Owner</th>}
                                {!isTablet && !isMobile && <th style={TH}>Indexed On</th>}
                                <th style={{ ...TH, width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={isMobile ? 4 : isTablet ? 5 : 7} style={{ ...TD, textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                                        No documents found.
                                    </td>
                                </tr>
                            ) : documents.map((doc, i) => (
                                <DocumentRow key={doc.id ?? i} doc={doc} onView={() => setSelected(doc)} isMobile={isMobile} isTablet={isTablet} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selected && (
                <DocumentViewModal doc={selected} onClose={() => setSelected(null)} />
            )}
        </>
    );
}

function DocumentRow({ doc, onView, isMobile, isTablet }) {
    const isQR = doc.codeType === 'QR';
    const imgSize = isMobile ? 44 : 65;
    return (
        <tr style={{ transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
        >
            <td style={{ ...TD, padding: isMobile ? '0.65rem 0.75rem' : TD.padding }}>
                <div style={{ display: 'inline-block', textAlign: 'center' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: 3, background: '#fff', display: 'inline-block' }}>
                        <img
                            src={doc.codeImage}
                            alt={isQR ? 'QR' : 'Barcode'}
                            style={isQR
                                ? { width: imgSize, height: imgSize }
                                : { width: isMobile ? 60 : 90, height: isMobile ? 24 : 32, objectFit: 'contain' }
                            }
                        />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                        {doc.codeId}
                    </div>
                </div>
            </td>
            <td style={{ ...TD, padding: isMobile ? '0.65rem 0.75rem' : TD.padding }}>
                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: isMobile ? '0.8rem' : '0.85rem', wordBreak: 'break-word' }}>
                    {doc.name}
                </span>
                {/* On mobile show owner below name */}
                {isMobile && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{doc.owner}</div>}
            </td>
            <td style={{ ...TD, padding: isMobile ? '0.65rem 0.75rem' : TD.padding }}>
                <Badge type={doc.type} />
            </td>
            {!isMobile && <td style={TD}><small style={{ color: '#94a3b8' }}>{doc.storage}</small></td>}
            {!isMobile && <td style={TD}>{doc.owner}</td>}
            {!isTablet && !isMobile && <td style={TD}>{doc.indexedOn}</td>}
            <td style={{ ...TD, padding: isMobile ? '0.65rem 0.5rem' : TD.padding }}>
                <button
                    onClick={onView}
                    title="View document"
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', borderRadius: 4, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                    <ChevronRightIcon />
                </button>
            </td>
        </tr>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function DocumentViewModal({ doc, onClose }) {
    const isQR = doc.codeType === 'QR';

    // Close on Escape key
    const handleKey = useCallback(e => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [handleKey]);

    function handleDownload() {
        const a = document.createElement('a');
        a.href = doc.fileUrl;
        a.download = doc.name;
        a.target = '_blank';
        a.click();
    }

    function handleDownloadCode() {
        const a = document.createElement('a');
        a.href = doc.codeImage;
        a.download = `${doc.codeId.replace('#', '')}.svg`;
        a.click();
    }

    return (
        // Backdrop
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(15,23,42,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                backdropFilter: 'blur(2px)',
                animation: 'fadeIn 0.15s ease',
            }}
        >
            {/* Modal card — stop propagation so clicking inside doesn't close */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                    overflow: 'hidden',
                    animation: 'slideUp 0.18s ease',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DocumentDetailIcon />
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>Document Details</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#334155'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                    >
                        <XIcon />
                    </button>
                </div>

                {/* Code image section */}
                <div style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: isQR ? 16 : 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <img
                            src={doc.codeImage}
                            alt={isQR ? 'QR Code' : 'Barcode'}
                            style={isQR
                                ? { width: 160, height: 160, display: 'block' }
                                : { width: 260, height: 80, objectFit: 'contain', display: 'block' }
                            }
                        />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#6366f1', fontWeight: 600, background: '#eef2ff', padding: '0.25rem 0.6rem', borderRadius: 4 }}>
                        {doc.codeId}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                        {isQR ? 'QR Code' : 'Barcode'} · {doc.codeType}
                    </span>
                </div>

                {/* Details grid */}
                <div style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                        <DetailItem label="Document Name" value={doc.name} full />
                        <DetailItem label="Document Type" value={<Badge type={doc.type} />} />
                        <DetailItem label="Owner" value={doc.owner} />
                        <DetailItem label="Storage Location" value={<span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.78rem' }}>{doc.storage}</span>} />
                        <DetailItem label="Indexed On" value={doc.indexedOn} />
                    </div>
                </div>

                {/* Footer actions */}
                <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#fafafa', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleDownload}
                        style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.55rem 1rem', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.85rem', borderRadius: 7, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
                        onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
                    >
                        <DownloadIcon /> Download File
                    </button>
                    <button
                        onClick={handleDownloadCode}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.55rem 0.9rem', background: '#fff', color: '#475569', fontWeight: 500, fontSize: '0.82rem', borderRadius: 7, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                        <QrDownloadIcon /> Download {isQR ? 'QR' : 'Barcode'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.55rem 1rem', background: '#fff', color: '#64748b', fontWeight: 500, fontSize: '0.85rem', borderRadius: 7, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                        Close
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
            `}</style>
        </div>
    );
}

function DetailItem({ label, value, full }) {
    return (
        <div style={{ gridColumn: full ? 'span 2' : 'span 1' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#94a3b8', marginBottom: 4 }}>{label}</p>
            <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>{value}</div>
        </div>
    );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ListIcon() {
    return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}><line strokeLinecap="round" x1="8" y1="6" x2="21" y2="6"/><line strokeLinecap="round" x1="8" y1="12" x2="21" y2="12"/><line strokeLinecap="round" x1="8" y1="18" x2="21" y2="18"/><line strokeLinecap="round" x1="3" y1="6" x2="3.01" y2="6"/><line strokeLinecap="round" x1="3" y1="12" x2="3.01" y2="12"/><line strokeLinecap="round" x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function ChevronRightIcon() {
    return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>;
}
function XIcon() {
    return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>;
}
function DownloadIcon() {
    return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
}
function DocumentDetailIcon() {
    return <svg width="16" height="16" fill="none" stroke="#6366f1" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline strokeLinecap="round" points="14 2 14 8 20 8"/><line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13"/><line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function QrDownloadIcon() {
    return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path strokeLinecap="round" d="M14 14h2v2h-2zM18 18h3v3h-3zM18 14v2M14 18v2"/></svg>;
}
