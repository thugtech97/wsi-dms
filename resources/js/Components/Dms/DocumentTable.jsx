import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
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
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting]           = useState(false);
    const { isMobile }                      = useResponsive();

    // Close on Escape key
    const handleKey = useCallback(e => {
        if (e.key === 'Escape') { setConfirmDelete(false); onClose(); }
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

    function handleDelete() {
        setDeleting(true);
        router.delete(route('documents.destroy', doc.id), {
            onSuccess: () => { setDeleting(false); onClose(); },
            onError:   () => setDeleting(false),
        });
    }

    function handleDownloadCode() {
        const a = document.createElement('a');
        a.href = doc.codeImage;
        a.download = `${doc.codeId.replace('#', '')}.svg`;
        a.click();
    }

    // responsive sizes
    const qrSize      = isMobile ? 140 : 200;
    const bcW         = isMobile ? 170 : 210;
    const bcH         = isMobile ? 56  : 80;
    const leftW       = isMobile ? '100%' : 260;
    const detailCols  = isMobile ? '1fr' : '1fr 1fr';

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(15,23,42,0.6)',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : '1rem',
            backdropFilter: 'blur(3px)',
            animation: 'fadeIn 0.15s ease',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#fff',
                borderRadius: isMobile ? '16px 16px 0 0' : 16,
                width: '100%',
                maxWidth: isMobile ? '100%' : 780,
                maxHeight: isMobile ? '92vh' : '90vh',
                boxShadow: '0 25px 80px rgba(0,0,0,0.22)',
                overflow: 'hidden',
                animation: isMobile ? 'slideUp 0.22s ease' : 'slideUp 0.2s ease',
                display: 'flex', flexDirection: 'column',
            }}>

                {/* ── Header ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '1rem 1.1rem' : '1.1rem 1.5rem', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <DocumentDetailIcon />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', lineHeight: 1 }}>Document Details</div>
                            {!isMobile && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>View and manage document record</div>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <XIcon />
                    </button>
                </div>

                {/* ── Body ───────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, minHeight: 0, overflowY: isMobile ? 'auto' : 'hidden' }}>

                    {/* Code image panel */}
                    <div style={{
                        width: leftW, flexShrink: 0,
                        background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%)',
                        borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
                        borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
                        display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: isMobile ? '1.1rem 1.25rem' : '2rem 1.5rem',
                        gap: isMobile ? 16 : 16,
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                    }}>
                        {/* Code image */}
                        <div style={{ background: '#fff', borderRadius: 12, padding: isQR ? 12 : 16, boxShadow: '0 4px 20px rgba(99,102,241,0.1)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img
                                src={doc.codeImage}
                                alt={isQR ? 'QR Code' : 'Barcode'}
                                style={isQR
                                    ? { width: qrSize, height: qrSize, display: 'block' }
                                    : { width: bcW, height: bcH, objectFit: 'contain', display: 'block' }
                                }
                            />
                        </div>

                        {/* Code info + download */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center', gap: 8, flex: isMobile ? 1 : 'unset' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '0.28rem 0.7rem', display: 'inline-block', letterSpacing: '0.5px' }}>
                                {doc.codeId}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                                {isQR ? '⬛ QR Code' : '▐▌ Barcode'} · {doc.codeType}
                            </div>
                            <button onClick={handleDownloadCode} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.85rem', background: '#fff', border: '1px solid #c7d2fe', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', cursor: 'pointer' }}>
                                <QrDownloadIcon /> Download {isQR ? 'QR' : 'Barcode'}
                            </button>
                        </div>
                    </div>

                    {/* Document details */}
                    <div style={{ flex: 1, padding: isMobile ? '1.1rem 1.25rem' : '1.75rem 1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: isMobile ? 'visible' : 'auto' }}>

                        {/* Document name */}
                        <div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Document Name</div>
                            <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, wordBreak: 'break-word' }}>{doc.name}</div>
                        </div>

                        {/* Detail grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: detailCols, gap: '0.75rem' }}>
                            <DetailCard label="Document Type" icon="🏷️">
                                <Badge type={doc.type} />
                            </DetailCard>
                            <DetailCard label="Owner" icon="👤">
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{doc.owner}</span>
                            </DetailCard>
                            <DetailCard label="Storage Location" icon="☁️">
                                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6366f1', background: '#eef2ff', padding: '0.2rem 0.45rem', borderRadius: 4 }}>{doc.storage}</span>
                            </DetailCard>
                            <DetailCard label="Indexed On" icon="📅">
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{doc.indexedOn}</span>
                            </DetailCard>
                        </div>

                        {/* Status strip */}
                        <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9', padding: '0.65rem 0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>
                                Indexed on <strong>Cloud://default-node</strong>. Tracking code active.
                            </span>
                        </div>

                        {!isMobile && <div style={{ flex: 1 }} />}

                        {/* Actions */}
                        {confirmDelete ? (
                            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, padding: '0.9rem 1rem' }}>
                                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#b91c1c', marginBottom: 3 }}>⚠ Confirm Deletion</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                                    Permanently deletes <strong>{doc.name}</strong> and its {isQR ? 'QR code' : 'barcode'} from storage. Cannot be undone.
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '0.5rem', background: '#fff', color: '#475569', fontSize: '0.82rem', fontWeight: 600, borderRadius: 7, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                        Cancel
                                    </button>
                                    <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '0.5rem', background: deleting ? '#fca5a5' : '#ef4444', color: '#fff', fontSize: '0.82rem', fontWeight: 700, borderRadius: 7, border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <TrashIcon /> {deleting ? 'Deleting…' : 'Yes, Delete'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <button onClick={handleDownload} style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.58rem 0.9rem', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.82rem', borderRadius: 8, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}>
                                    <DownloadIcon /> Download File
                                </button>
                                <button onClick={() => setConfirmDelete(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.58rem 0.9rem', background: '#fff', color: '#ef4444', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8, border: '1px solid #fecaca', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                                    <TrashIcon /> Delete
                                </button>
                                <button onClick={onClose} style={{ padding: '0.58rem 0.9rem', background: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
            `}</style>
        </div>
    );
}


function DetailCard({ label, icon, children }) {
    return (
        <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{icon}</span>{label}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>{children}</div>
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
function TrashIcon() {
    return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline strokeLinecap="round" points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;
}
function QrDownloadIcon() {
    return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path strokeLinecap="round" d="M14 14h2v2h-2zM18 18h3v3h-3zM18 14v2M14 18v2"/></svg>;
}
