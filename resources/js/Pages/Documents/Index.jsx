import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';
import DocumentFilter from '@/Components/Dms/DocumentFilter';
import DocumentTable from '@/Components/Dms/DocumentTable';
import UploadPanel from '@/Components/Dms/UploadPanel';
import { useResponsive } from '@/hooks/useResponsive';

export default function DocumentsIndex({ documents, documentTypes, users = [], roles = [], formFields = [], filters: serverFilters, openDocId }) {
    const { isMobile, isTablet } = useResponsive();
    const [filters, setFilters]   = useState({
        label:      serverFilters?.label      ?? '',
        type:       serverFilters?.type       ?? '',
        department: serverFilters?.department ?? '',
        owner:      serverFilters?.owner      ?? '',
    });
    const [scanValue, setScanValue]         = useState('');
    // const [showUploadPanel, setShowUpload]  = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [scanPopupDoc, setScanPopupDoc]   = useState(null);

    useEffect(() => {
        if (openDocId) {
            const doc = documents.find(d => d.id === openDocId);
            if (doc) setScanPopupDoc(doc);
        }
    }, [openDocId]);

    function handleFilterChange(key, value) {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    function handleClear() {
        setFilters({ label: '', type: '', department: '', owner: '' });
        setScanValue('');
    }

    function handleScanEnter(value) {
        const s = value.toLowerCase().trim();
        if (!s) return;
        const match = documents.find(doc => doc.codeId.toLowerCase().includes(s));
        setScanPopupDoc(match ?? null);
        if (!match) alert(`No document found for "${value}"`);
    }

    const filtered = documents.filter(doc => {
        const l = filters.label.toLowerCase();
        const t = filters.type.toLowerCase();
        const d = filters.department.toLowerCase();
        const o = filters.owner.toLowerCase();
        const s = scanValue.toLowerCase().trim();
        return doc.label.toLowerCase().includes(l)
            && (t === '' || doc.type.toLowerCase().includes(t))
            && (d === '' || doc.department.toLowerCase().includes(d))
            && (o === '' || doc.owner.toLowerCase().includes(o))
            && (s === '' || doc.codeId.toLowerCase().includes(s));
    });

    const stacked = isMobile || isTablet;

    return (
        
        // <DmsLayout activePage="Documents" onScanChange={setScanValue} onSearchEnter={handleScanEnter}>
        //     <Head title="Documents" />
        //     <div style={{
        //         display: 'flex',
        //         flexDirection: stacked ? 'column' : 'row',
        //         gap: 0,
        //     }}>
        //         {/* Main content */}
        //         <div style={{ flex: 1, padding: stacked ? '1rem' : '1.5rem', minWidth: 0 }}>
        //             {/* Mobile: upload toggle button */}
        //             {stacked && (
        //                 <button
        //                     onClick={() => setShowUpload(o => !o)}
        //                     style={{
        //                         width: '100%', marginBottom: '1rem',
        //                         padding: '0.6rem 1rem', background: '#6366f1', color: '#fff',
        //                         fontWeight: 600, fontSize: '0.875rem', borderRadius: 8,
        //                         border: 'none', cursor: 'pointer',
        //                         display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        //                     }}
        //                 >
        //                     <UploadIcon />
        //                     {showUploadPanel ? 'Hide Upload Panel' : 'Upload Document'}
        //                 </button>
        //             )}

        //             {/* Mobile: upload panel shown inline above table */}
        //             {stacked && showUploadPanel && (
        //                 <div style={{ marginBottom: '1rem' }}>
        //                     <UploadPanel documentTypes={documentTypes} onSuccess={() => setShowUpload(false)} />
        //                 </div>
        //             )}

        //             <DocumentFilter filters={filters} onChange={handleFilterChange} onClear={handleClear} documentTypes={documentTypes} />
        //             <DocumentTable documents={filtered} documentTypes={documentTypes} users={users} roles={roles} />
        //         </div>

        //         {/* Desktop: right sidebar upload panel */}
        //         {!stacked && (
        //             <div style={{ width: 320, minWidth: 280, padding: '1.5rem 1.5rem 1.5rem 0', flexShrink: 0 }}>
        //                 <UploadPanel 
        //                     documentTypes={documentTypes} 
        //                     users={users} 
        //                     roles={roles}
        //                 />
        //             </div>
        //         )}
        //     </div>
        //     {scanPopupDoc && (
        //         <ScanResultModal doc={scanPopupDoc} onClose={() => setScanPopupDoc(null)} />
        //     )}
        // </DmsLayout>

        <DmsLayout activePage="Documents" onScanChange={setScanValue} onSearchEnter={handleScanEnter}>
            <Head title="Documents" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Main content */}
                <div style={{ flex: 1, padding: stacked ? '1rem' : '1.5rem', minWidth: 0 }}>
                    <DocumentFilter 
                        filters={filters} 
                        onChange={handleFilterChange} 
                        onClear={handleClear} 
                        onAddNew={() => setShowUploadModal(true)}
                        documentTypes={documentTypes} 
                    />
                    <DocumentTable documents={filtered} documentTypes={documentTypes} users={users} roles={roles} formFields={formFields} />
                </div>
            </div>

            {/* Global Document Upload Modal */}
            {showUploadModal && (
                <UploadModal
                    documentTypes={documentTypes}
                    users={users}
                    roles={roles}
                    formFields={formFields}
                    onClose={() => setShowUploadModal(false)}
                />
            )}

            {scanPopupDoc && (
                <ScanResultModal doc={scanPopupDoc} onClose={() => setScanPopupDoc(null)} />
            )}
        </DmsLayout>
    );
}

// ── Upload Modal Wrapper ──────────────────────────────────────────────────────
function UploadModal({ documentTypes, users, roles, formFields, onClose }) {
    const handleKey = useCallback(e => { if (e.key === 'Escape') onClose(); }, [onClose]);
    
    useEffect(() => {
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [handleKey]);

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 25px 80px rgba(0,0,0,0.22)', overflow: 'hidden', animation: 'slideUp 0.2s ease' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', background: '#fafbff' }}>
                    <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Add New Document</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fill out metadata tags and attach your files.</div>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.9rem' }}>✕</button>
                </div>

                {/* Form Injection Area */}
                <div style={{ padding: '1.25rem', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                    <UploadPanel
                        documentTypes={documentTypes}
                        users={users}
                        roles={roles}
                        formFields={formFields}
                        onSuccess={onClose}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Scan Result Modal ─────────────────────────────────────────────────────────
function ScanResultModal({ doc, onClose }) {
    const isQR = doc.codeType === 'QR';
    // const { isMobile } = useResponsive();

    const handleKey = useCallback(e => { if (e.key === 'Escape') onClose(); }, [onClose]);
    useEffect(() => {
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [handleKey]);

    function downloadCode() {
        const a = document.createElement('a');
        a.href = doc.codeImage;
        a.download = `${doc.codeId.replace('#', '')}.svg`;
        a.click();
    }

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 25px 80px rgba(0,0,0,0.22)', overflow: 'hidden', animation: 'slideUp 0.2s ease' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderBottom: '1px solid #f1f5f9', background: '#fafbff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.1rem' }}>{isQR ? '⬛' : '▐▌'}</span>
                        <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Scan Result</div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{isQR ? 'QR Code' : 'Barcode'} match found</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.9rem' }}>✕</button>
                </div>

                {/* Code image */}
                <div style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem', gap: 12 }}>
                    <div style={{ background: '#fff', borderRadius: 12, padding: isQR ? 14 : 18, boxShadow: '0 4px 20px rgba(99,102,241,0.12)', border: '1px solid #e2e8f0' }}>
                        <img
                            src={doc.codeImage}
                            alt={isQR ? 'QR Code' : 'Barcode'}
                            style={isQR
                                ? { width: 180, height: 180, display: 'block' }
                                : { width: 220, height: 72, objectFit: 'contain', display: 'block' }
                            }
                        />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '0.3rem 0.8rem' }}>
                        {doc.codeId}
                    </span>
                </div>

                {/* Doc info */}
                <div style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Document</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: 2, wordBreak: 'break-word' }}>{doc.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{doc.type} · {doc.owner} · {doc.indexedOn}</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, padding: '0 1.25rem 1.25rem' }}>
                    <button onClick={downloadCode} style={{ flex: 1, padding: '0.55rem', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                        Download {isQR ? 'QR' : 'Barcode'}
                    </button>
                    <button onClick={onClose} style={{ padding: '0.55rem 1rem', background: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                        Close
                    </button>
                </div>

                <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
            </div>
        </div>
    );
}