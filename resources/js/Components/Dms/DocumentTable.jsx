import { useState, useEffect, useCallback } from 'react';
import { router, useForm } from '@inertiajs/react';
import Badge from './Badge';
import DynamicFormFields, {
    formDataFromDocument,
    documentFieldValue,
    formatFieldValue,
    fieldIcon,
} from './DynamicFormFields';
import { useResponsive } from '@/hooks/useResponsive';

const TH = { fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b', padding: '0.85rem 1.25rem', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' };
const TD = { padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#334155' };

export default function DocumentTable({ documents, documentTypes = [], users = [], roles = [], formFields = [] }) {
    const [selected, setSelected] = useState(null);
    const { isMobile, isTablet } = useResponsive();

    return (
        <>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>
                        <ListIcon /> Document Index
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#334155', fontWeight: 500, padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.8rem' }}>
                        {documents.length} {documents.length === 1 ? 'item' : 'items'}
                    </span>
                </div>

                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 340 : undefined }}>
                        <thead>
                            <tr>
                                <th style={{ ...TH, width: isMobile ? 60 : 90 }}>Asset</th>
                                <th style={TH}>Label</th>
                                <th style={TH}>Document Class</th>
                                {!isMobile && <th style={TH}>URL</th>}
                                {/* {!isMobile && <th style={TH}>Department</th>} */}
                                {!isMobile && <th style={TH}>Added By</th>}
                                {!isMobile && <th style={TH}>Document Date</th>}
                                {!isMobile && <th style={TH}>Scan Count</th>}
                                <th style={{ ...TH, width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={isMobile ? 3 : 6} style={{ ...TD, textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
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
                <DocumentViewModal
                    doc={selected}
                    documentTypes={documentTypes}
                    users={users}
                    roles={roles}
                    formFields={formFields}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    );
}

function DocumentRow({ doc, onView, isMobile }) {
    const isQR = doc.codeType === 'QR';
    const imgSize = isMobile ? 36 : 52;
    return (
        <tr style={{ transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
            className="text-center"
        >
            <td style={{ ...TD, padding: isMobile ? '0.6rem 0.75rem' : TD.padding }}>
                <div style={{ display: 'inline-block', textAlign: 'center' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: 3, background: '#fff', display: 'inline-block' }}>
                        <img
                            src={doc.codeImage}
                            alt={isQR ? 'QR' : 'Barcode'}
                            style={isQR
                                ? { width: imgSize, height: imgSize }
                                : { width: isMobile ? 52 : 76, height: isMobile ? 20 : 26, objectFit: 'contain' }
                            }
                        />
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                        {doc.codeId}
                    </div>
                </div>
            </td>
            <td style={{ ...TD, padding: isMobile ? '0.6rem 0.75rem' : TD.padding }}>
                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: isMobile ? '0.8rem' : '0.85rem', wordBreak: 'break-word' }}>
                    {doc.label}
                </span>
                {isMobile && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{doc.department !== '—' ? doc.department : ''}</div>}
            </td>
            <td style={{ ...TD, padding: isMobile ? '0.6rem 0.75rem' : TD.padding }}>
                <Badge type={doc.type} />
            </td>
            {!isMobile && <td style={TD}><span style={{ color: '#64748b', fontSize: '0.82rem' }}>{doc.link_document_url}</span></td>}
            {/* {!isMobile && <td style={TD}><span style={{ color: '#64748b', fontSize: '0.82rem' }}>{doc.department}</span></td>} */}
            {!isMobile && <td style={TD}><span style={{ color: '#64748b', fontSize: '0.82rem' }}>{doc.owner}</span></td>}
            {!isMobile && <td style={TD}><span style={{ color: '#64748b', fontSize: '0.82rem' }}>{doc.documentDate}</span></td>}
            {!isMobile && <td style={TD}><span style={{ color: '#64748b', fontSize: '0.82rem' }}>{doc.scanCount}</span></td>}
            <td style={{ ...TD, padding: isMobile ? '0.6rem 0.5rem' : TD.padding }}>
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
function DocumentViewModal({ doc, documentTypes, users, roles, formFields = [], onClose }) {
    const isQR = doc.codeType === 'QR';
    const [activeTab,     setActiveTab]     = useState('details');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting]           = useState(false);
    const [editing, setEditing]             = useState(false);
    const { isMobile }                      = useResponsive();

    const sources = { document_types: documentTypes, users, roles };

    // Everything on the form that the fixed cards above don't already cover.
    const SHOWN_ABOVE  = ['label', 'document_type_id', 'department'];
    const extraFields  = formFields.filter(f => f.is_active && !SHOWN_ABOVE.includes(f.key));

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

    function handleDelete() {
        setDeleting(true);
        router.delete(route('documents.destroy', doc.id), {
            onSuccess: () => { setDeleting(false); onClose(); },
            onError:   () => setDeleting(false),
        });
    }

    function handlePrint() {
        const win = window.open('', '_blank', 'width=480,height=600');
        win.document.write(`<!DOCTYPE html><html><head><title>Print – ${doc.codeId}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'Inter',Arial,sans-serif; background:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh; }
            .card { border:1.5px solid #e2e8f0; border-radius:12px; padding:28px 32px; max-width:360px; width:100%; text-align:center; }
            .label { font-size:1rem; font-weight:700; color:#0f172a; margin-bottom:18px; word-break:break-word; }
            .img-wrap { display:inline-block; padding:${isQR ? '10px' : '12px 16px'}; border:1px solid #e2e8f0; border-radius:8px; background:#fff; margin-bottom:14px; }
            img { display:block; ${isQR ? 'width:180px;height:180px;' : 'width:220px;height:68px;object-fit:contain;'} }
            .code { font-family:monospace; font-size:0.9rem; font-weight:700; color:#4f46e5; background:#eef2ff; border:1px solid #c7d2fe; border-radius:6px; padding:4px 14px; display:inline-block; margin-bottom:16px; letter-spacing:0.5px; }
            .meta { font-size:0.78rem; color:#64748b; line-height:1.8; }
            .meta strong { color:#334155; }
            @media print { body { min-height:unset; } .card { border:none; } }
        </style></head><body>
        <div class="card">
            <div class="label">${doc.label}</div>
            <div class="img-wrap"><img src="${doc.codeImage}" /></div>
            <div class="code">${doc.codeId}</div>
            <div class="meta">
                <div><strong>Document Class:</strong> ${doc.type}</div>
                <div><strong>Department:</strong> ${doc.department}</div>
                <div><strong>Document Date:</strong> ${doc.documentDate}</div>
                <div><strong>Added By:</strong> ${doc.owner}</div>
            </div>
        </div>
        <script>window.onload=function(){ window.print(); window.onafterprint=function(){ window.close(); }; }<\/script>
        </body></html>`);
        win.document.close();
    }

    const qrSize = isMobile ? 140 : 190;
    const bcW    = isMobile ? 170 : 210;
    const bcH    = isMobile ? 56  : 72;
    const leftW  = isMobile ? '100%' : 240;

    const tabBtn = (key, label) => (
        <button onClick={() => setActiveTab(key)} style={{
            padding: '0.55rem 1.1rem', fontSize: '0.82rem', fontWeight: 600,
            border: 'none', background: 'none', cursor: 'pointer',
            color: activeTab === key ? '#4f46e5' : '#64748b',
            borderBottom: activeTab === key ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
        }}>{label}</button>
    );

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(15,23,42,0.6)',
            display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
            padding: isMobile ? 0 : '1rem',
            backdropFilter: 'blur(3px)',
            animation: 'fadeIn 0.15s ease',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#fff',
                borderRadius: isMobile ? '16px 16px 0 0' : 16,
                width: '100%', maxWidth: isMobile ? '100%' : 740,
                maxHeight: isMobile ? '92vh' : '90vh',
                boxShadow: '0 25px 80px rgba(0,0,0,0.22)',
                overflow: 'hidden',
                animation: 'slideUp 0.2s ease',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '1rem 1.1rem' : '1.1rem 1.5rem', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', paddingLeft: isMobile ? '1.1rem' : '1.5rem', flexShrink: 0 }}>
                    {tabBtn('details', '📋 Details')}
                    {tabBtn('print-preview', '🖨️ Print Preview')}
                </div>

                {/* ── Details tab ── */}
                {activeTab === 'details' && (
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, minHeight: 0, overflowY: isMobile ? 'auto' : 'hidden' }}>

                        {/* Code panel */}
                        <div style={{
                            width: leftW, flexShrink: 0,
                            background: 'linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%)',
                            borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
                            borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
                            display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: isMobile ? '1rem 1.25rem' : '2rem 1.5rem',
                            gap: 16, flexWrap: isMobile ? 'wrap' : 'nowrap',
                        }}>
                            <div style={{ background: '#fff', borderRadius: 12, padding: isQR ? 12 : 16, boxShadow: '0 4px 20px rgba(99,102,241,0.1)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <img src={doc.codeImage} alt={isQR ? 'QR Code' : 'Barcode'}
                                    style={isQR ? { width: qrSize, height: qrSize, display: 'block' } : { width: bcW, height: bcH, objectFit: 'contain', display: 'block' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center', gap: 8, flex: isMobile ? 1 : 'unset' }}>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '0.28rem 0.7rem', display: 'inline-block', letterSpacing: '0.5px' }}>
                                    {doc.codeId}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                                    {isQR ? '⬛ QR Code' : '▐▌ Barcode'}
                                </div>
                                <button onClick={() => setActiveTab('print-preview')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.85rem', background: '#fff', border: '1px solid #c7d2fe', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', cursor: 'pointer' }}>
                                    <PrintIcon /> Print {isQR ? 'QR' : 'Barcode'}
                                </button>
                            </div>
                        </div>

                        {/* Details panel */}
                        <div style={{ flex: 1, padding: isMobile ? '1rem 1.25rem' : '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: isMobile ? 'visible' : 'auto' }}>
                            <div>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Label</div>
                                <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, wordBreak: 'break-word' }}>{doc.label}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                                <DetailCard label="Document Class" icon="🏷️"><Badge type={doc.type} /></DetailCard>
                                <DetailCard label="Department" icon="🏢"><span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{doc.department}</span></DetailCard>
                                <DetailCard label="Document Date" icon="📅"><span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{doc.documentDate}</span></DetailCard>
                                <DetailCard label="Added By" icon="👤"><span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{doc.owner}</span></DetailCard>
                            </div>

                            {/* Admin-configured fields from Settings → Document Form */}
                            {extraFields.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                                        Additional Information
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                                        {extraFields.map(field => (
                                            <DetailCard key={field.key} label={field.label} icon={fieldIcon(field.type)}>
                                                <CustomFieldValue field={field} doc={doc} sources={sources} />
                                            </DetailCard>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isMobile && <div style={{ flex: 1 }} />}

                            {confirmDelete ? (
                                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, padding: '0.9rem 1rem' }}>
                                    <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#b91c1c', marginBottom: 3 }}>⚠ Confirm Deletion</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                                        Permanently deletes <strong>{doc.label}</strong> and its tracking code. Cannot be undone.
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '0.5rem', background: '#fff', color: '#475569', fontSize: '0.82rem', fontWeight: 600, borderRadius: 7, border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cancel</button>
                                        <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '0.5rem', background: deleting ? '#fca5a5' : '#ef4444', color: '#fff', fontSize: '0.82rem', fontWeight: 700, borderRadius: 7, border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <TrashIcon /> {deleting ? 'Deleting…' : 'Yes, Delete'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    {doc.fileUrl && (
                                        <button onClick={() => { const a = document.createElement('a'); a.href = doc.fileUrl; a.download = doc.label; a.target = '_blank'; a.click(); }}
                                            style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.58rem 0.9rem', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.82rem', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                                            <DownloadIcon /> Download File
                                        </button>
                                    )}
                                    <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.58rem 0.9rem', background: '#fff', color: '#4f46e5', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8, border: '1px solid #c7d2fe', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <EditIcon /> Edit
                                    </button>
                                    <button onClick={() => setConfirmDelete(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.58rem 0.9rem', background: '#fff', color: '#ef4444', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8, border: '1px solid #fecaca', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <TrashIcon /> Delete
                                    </button>
                                    <button onClick={onClose} style={{ padding: '0.58rem 0.9rem', background: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Print Preview tab ── */}
                {activeTab === 'print-preview' && (
                    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1.25rem 1rem' : '1.75rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', background: '#f8fafc' }}>
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', alignSelf: 'flex-start' }}>Preview of the printed {isQR ? 'QR code' : 'barcode'} label.</p>

                        {/* Print card */}
                        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '28px 32px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 18, wordBreak: 'break-word' }}>{doc.label}</div>
                            <div style={{ display: 'inline-block', padding: isQR ? 10 : '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', marginBottom: 14 }}>
                                <img src={doc.codeImage} alt={isQR ? 'QR' : 'Barcode'}
                                    style={isQR ? { width: 180, height: 180, display: 'block' } : { width: 220, height: 68, objectFit: 'contain', display: 'block' }} />
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '4px 14px', display: 'inline-block', marginBottom: 16, letterSpacing: '0.5px' }}>
                                {doc.codeId}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.9, textAlign: 'left' }}>
                                <div><strong style={{ color: '#334155' }}>Document Class:</strong> {doc.type}</div>
                                <div><strong style={{ color: '#334155' }}>Department:</strong> {doc.department}</div>
                                <div><strong style={{ color: '#334155' }}>Document Date:</strong> {doc.documentDate}</div>
                                <div><strong style={{ color: '#334155' }}>Added By:</strong> {doc.owner}</div>
                            </div>
                        </div>

                        {/* Print button */}
                        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.75rem', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.88rem', borderRadius: 9, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                            <PrintIcon size={16} /> Print {isQR ? 'QR Code' : 'Barcode'}
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
            `}</style>
            {editing && (
                <DocumentEditModal
                    doc={doc}
                    documentTypes={documentTypes}
                    users={users}
                    roles={roles}
                    formFields={formFields}
                    onClose={() => setEditing(false)}
                    onSuccess={onClose}
                />
            )}
        </div>
    );
}

function DocumentEditModal({ doc, documentTypes, users, roles, formFields = [], onClose, onSuccess }) {
    // Same admin-managed schema as the Add New Document form.
    const { data, setData, put, processing, errors } = useForm(formDataFromDocument(formFields, doc));

    const sources = { document_types: documentTypes, users, roles };

    function submit(e) {
        e.preventDefault();
        put(route('documents.update', doc.id), { onSuccess });
    }

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 210, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(3px)' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 80px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>Edit Document</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Update this document’s information.</div>
                    </div>
                    <button onClick={onClose} aria-label="Close edit modal" style={{ width: 30, height: 30, borderRadius: 7, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b' }}><XIcon /></button>
                </div>
                <form onSubmit={submit} style={{ padding: '1.25rem', overflowY: 'auto' }}>
                    <DynamicFormFields
                        fields={formFields}
                        data={data}
                        setData={setData}
                        errors={errors}
                        sources={sources}
                    />

                    {/* Tracking code is fixed at creation time and shown read-only here. */}
                    <EditField label="Tracking Code">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.7rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7 }}>
                            <span style={{ fontSize: '0.95rem' }}>{doc.codeType === 'QR' ? '⬛' : '▐▌'}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: '#4f46e5' }}>{doc.codeId}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto' }}>Cannot be changed</span>
                        </div>
                    </EditField>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1.25rem' }}>
                        <button type="button" onClick={onClose} disabled={processing} style={{ padding: '0.58rem 0.95rem', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.82rem', borderRadius: 7, border: '1px solid #cbd5e1', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={processing} style={{ padding: '0.58rem 0.95rem', background: processing ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.82rem', borderRadius: 7, border: 'none', cursor: processing ? 'not-allowed' : 'pointer' }}>{processing ? 'Updating…' : 'Update Document'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditField({ label, error, children }) {
    return <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 5 }}>{label}</label>{children}{error && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '4px 0 0' }}>{error}</p>}</div>;
}

function CustomFieldValue({ field, doc, sources }) {
    const text  = formatFieldValue(field, documentFieldValue(field, doc), sources);
    const blank = text === '—';
    const style = { fontSize: '0.85rem', fontWeight: 600, color: blank ? '#cbd5e1' : '#1e293b', wordBreak: 'break-word' };

    if (field.type === 'url' && !blank) {
        return (
            <a href={text} target="_blank" rel="noopener noreferrer"
                style={{ ...style, color: '#4f46e5', textDecoration: 'underline' }}>
                {text}
            </a>
        );
    }

    if (field.type === 'checkbox') {
        const on = text === 'Yes';
        return (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: on ? '#15803d' : '#94a3b8', background: on ? '#f0fdf4' : '#f8fafc', border: `1px solid ${on ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 999, padding: '2px 9px' }}>
                {text}
            </span>
        );
    }

    return <span style={style}>{text}</span>;
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
function ListIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}><line strokeLinecap="round" x1="8" y1="6" x2="21" y2="6"/><line strokeLinecap="round" x1="8" y1="12" x2="21" y2="12"/><line strokeLinecap="round" x1="8" y1="18" x2="21" y2="18"/><line strokeLinecap="round" x1="3" y1="6" x2="3.01" y2="6"/><line strokeLinecap="round" x1="3" y1="12" x2="3.01" y2="12"/><line strokeLinecap="round" x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function ChevronRightIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>; }
function XIcon() { return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>; }
function DownloadIcon() { return <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>; }
function DocumentDetailIcon() { return <svg width="16" height="16" fill="none" stroke="#6366f1" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline strokeLinecap="round" points="14 2 14 8 20 8"/><line strokeLinecap="round" x1="16" y1="13" x2="8" y2="13"/><line strokeLinecap="round" x1="16" y1="17" x2="8" y2="17"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline strokeLinecap="round" points="3 6 5 6 21 6"/><path strokeLinecap="round" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }
function EditIcon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>; }
function QrDownloadIcon() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path strokeLinecap="round" d="M14 14h2v2h-2zM18 18h3v3h-3zM18 14v2M14 18v2"/></svg>; }
function PrintIcon({ size = 13 }) { return <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline strokeLinecap="round" points="6 9 6 2 18 2 18 9"/><path strokeLinecap="round" d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>; }
