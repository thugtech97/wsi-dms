import { useState } from 'react';
import DmsLayout from '@/Layouts/DmsLayout';
import DocumentFilter from '@/Components/Dms/DocumentFilter';
import DocumentTable from '@/Components/Dms/DocumentTable';
import UploadPanel from '@/Components/Dms/UploadPanel';
import { useResponsive } from '@/hooks/useResponsive';

export default function DocumentsIndex({ documents, documentTypes, filters: serverFilters }) {
    const { isMobile, isTablet } = useResponsive();
    const [filters, setFilters]   = useState({
        name:  serverFilters?.name  ?? '',
        type:  serverFilters?.type  ?? '',
        owner: serverFilters?.owner ?? '',
    });
    const [scanValue, setScanValue]         = useState('');
    const [showUploadPanel, setShowUpload]  = useState(false);

    function handleFilterChange(key, value) {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    function handleClear() {
        setFilters({ name: '', type: '', owner: '' });
        setScanValue('');
    }

    const filtered = documents.filter(doc => {
        const n = filters.name.toLowerCase();
        const t = filters.type.toLowerCase();
        const o = filters.owner.toLowerCase();
        const s = scanValue.toLowerCase().trim();
        return doc.name.toLowerCase().includes(n)
            && (t === '' || doc.type.toLowerCase().includes(t))
            && doc.owner.toLowerCase().includes(o)
            && (s === '' || doc.codeId.toLowerCase().includes(s));
    });

    const stacked = isMobile || isTablet;

    return (
        <DmsLayout activePage="Documents" scanValue={scanValue} onScanChange={setScanValue}>
            <div style={{
                display: 'flex',
                flexDirection: stacked ? 'column' : 'row',
                gap: 0,
            }}>
                {/* Main content */}
                <div style={{ flex: 1, padding: stacked ? '1rem' : '1.5rem', minWidth: 0 }}>
                    {/* Mobile: upload toggle button */}
                    {stacked && (
                        <button
                            onClick={() => setShowUpload(o => !o)}
                            style={{
                                width: '100%', marginBottom: '1rem',
                                padding: '0.6rem 1rem', background: '#6366f1', color: '#fff',
                                fontWeight: 600, fontSize: '0.875rem', borderRadius: 8,
                                border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            <UploadIcon />
                            {showUploadPanel ? 'Hide Upload Panel' : 'Upload Document'}
                        </button>
                    )}

                    {/* Mobile: upload panel shown inline above table */}
                    {stacked && showUploadPanel && (
                        <div style={{ marginBottom: '1rem' }}>
                            <UploadPanel documentTypes={documentTypes} onSuccess={() => setShowUpload(false)} />
                        </div>
                    )}

                    <DocumentFilter filters={filters} onChange={handleFilterChange} onClear={handleClear} documentTypes={documentTypes} />
                    <DocumentTable documents={filtered} />
                </div>

                {/* Desktop: right sidebar upload panel */}
                {!stacked && (
                    <div style={{ width: 320, minWidth: 280, padding: '1.5rem 1.5rem 1.5rem 0', flexShrink: 0 }}>
                        <UploadPanel documentTypes={documentTypes} />
                    </div>
                )}
            </div>
        </DmsLayout>
    );
}

function UploadIcon() {
    return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline strokeLinecap="round" points="16 16 12 12 8 16"/><line strokeLinecap="round" x1="12" y1="12" x2="12" y2="21"/><path strokeLinecap="round" d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>;
}
