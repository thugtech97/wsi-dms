import { useState, useEffect, useCallback, useMemo } from 'react';
import { router, useForm } from '@inertiajs/react';
import Badge from './Badge';
import DynamicFormFields, {
    formDataFromDocument,
    documentFieldValue,
    formatFieldValue,
    fieldIcon,
} from './DynamicFormFields';
import { useResponsive } from '@/hooks/useResponsive';
import { useSystem } from '@/hooks/useSystem';
import {
    CodeCell,
    CodePanel,
    isQrCode,
    codeLabel,
    codeImageStyle,
    codeIdList,
} from './DocumentCodes';

const TH = { fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', color: '#64748b', padding: '0.85rem 1.25rem', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' };
const TD = { padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#334155' };

const PAGE_SIZES = [10, 25, 50, 100];

export default function DocumentTable({ documents, documentTypes = [], users = [], roles = [], formFields = [] }) {
    const [selected, setSelected] = useState(null);
    const [page, setPage]         = useState(1);
    const [perPage, setPerPage]   = useState(PAGE_SIZES[0]);
    const { isMobile, isTablet } = useResponsive();

    const total      = documents.length;
    const pageCount  = Math.max(1, Math.ceil(total / perPage));
    // Filtering upstream can shrink the list under the current page.
    const current    = Math.min(page, pageCount);
    const firstIndex = (current - 1) * perPage;
    const pageDocs   = useMemo(
        () => documents.slice(firstIndex, firstIndex + perPage),
        [documents, firstIndex, perPage],
    );

    // Snap back to the first page whenever the filtered set changes.
    useEffect(() => { setPage(1); }, [total]);

    return (
        <>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>
                        <ListIcon /> Document Index
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#334155', fontWeight: 500, padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.8rem' }}>
                        {total} {total === 1 ? 'item' : 'items'}
                    </span>
                </div>

                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 340 : undefined }}>
                        <thead>
                            <tr>
                                {/* Wide enough for a QR and a barcode side by side. */}
                                <th style={{ ...TH, width: isMobile ? 110 : 175 }}>Asset</th>
                                {/* Label column hidden on request — it usually repeats the Document Type. */}
                                {/* <th style={TH}>Label</th> */}
                                <th style={TH}>Document Type</th>
                                {!isMobile && <th style={TH}>URL</th>}
                                {/* {!isMobile && <th style={TH}>Department</th>} */}
                                {!isMobile && <th style={TH}>Added By</th>}
                                {!isMobile && <th style={TH}>Document Date</th>}
                                {!isMobile && <th style={TH}>Scan Count</th>}
                                <th style={{ ...TH, width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {total === 0 ? (
                                <tr>
                                    <td colSpan={isMobile ? 3 : 7} style={{ ...TD, textAlign: 'center', color: '#94a3b8', padding: '2.5rem' }}>
                                        No documents found.
                                    </td>
                                </tr>
                            ) : pageDocs.map((doc, i) => (
                                <DocumentRow key={doc.id ?? i} doc={doc} onView={() => setSelected(doc)} isMobile={isMobile} isTablet={isTablet} />
                            ))}
                        </tbody>
                    </table>
                </div>

                {total > 0 && (
                    <Pagination
                        page={current}
                        pageCount={pageCount}
                        perPage={perPage}
                        total={total}
                        firstIndex={firstIndex}
                        shown={pageDocs.length}
                        isMobile={isMobile}
                        onPage={setPage}
                        onPerPage={size => { setPerPage(size); setPage(1); }}
                    />
                )}
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

// ── Pagination ────────────────────────────────────────────────────────────────
/**
 * Pages the already-filtered list client side, so the instant filtering and the
 * scan lookup keep working on the whole set while the table renders a slice.
 */
function Pagination({ page, pageCount, perPage, total, firstIndex, shown, isMobile, onPage, onPerPage }) {
    const from = total === 0 ? 0 : firstIndex + 1;
    const to   = firstIndex + shown;

    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12,
            alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0.75rem 0.9rem' : '0.85rem 1.25rem',
            borderTop: '1px solid #f1f5f9', background: '#fafbfc',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', color: '#64748b' }}>
                <span>
                    Showing <strong style={{ color: '#334155' }}>{from}–{to}</strong> of{' '}
                    <strong style={{ color: '#334155' }}>{total}</strong>
                </span>
                {!isMobile && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Rows</span>
                        <select
                            value={perPage}
                            onChange={e => onPerPage(Number(e.target.value))}
                            style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.2rem 0.4rem', fontSize: '0.78rem', color: '#334155', background: '#fff', cursor: 'pointer' }}
                        >
                            {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </label>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PageButton label="‹" title="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)} />
                {pageNumbers(page, pageCount).map((p, i) =>
                    p === '…'
                        ? <span key={`gap-${i}`} style={{ padding: '0 4px', color: '#cbd5e1', fontSize: '0.78rem' }}>…</span>
                        : <PageButton key={p} label={p} active={p === page} onClick={() => onPage(p)} />
                )}
                <PageButton label="›" title="Next page" disabled={page === pageCount} onClick={() => onPage(page + 1)} />
            </div>
        </div>
    );
}

function PageButton({ label, title, active = false, disabled = false, onClick }) {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            style={{
                minWidth: 30, height: 30, padding: '0 7px',
                borderRadius: 6, fontSize: '0.78rem', fontWeight: active ? 700 : 500,
                border: `1px solid ${active ? '#6366f1' : '#e2e8f0'}`,
                background: active ? '#6366f1' : '#fff',
                color: active ? '#fff' : (disabled ? '#cbd5e1' : '#475569'),
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, color 0.15s',
            }}
        >
            {label}
        </button>
    );
}

/** 1 … 4 [5] 6 … 12 — always the ends, plus a window around the current page. */
function pageNumbers(page, pageCount) {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

    const pages = new Set([1, pageCount, page, page - 1, page + 1]);
    if (page <= 3)              [2, 3, 4].forEach(p => pages.add(p));
    if (page >= pageCount - 2)  [pageCount - 3, pageCount - 2, pageCount - 1].forEach(p => pages.add(p));

    const sorted = [...pages].filter(p => p >= 1 && p <= pageCount).sort((a, b) => a - b);

    return sorted.flatMap((p, i) =>
        i > 0 && p - sorted[i - 1] > 1 ? ['…', p] : [p]);
}

function DocumentRow({ doc, onView, isMobile }) {
    return (
        <tr style={{ transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
            className="text-center"
        >
            <td style={{ ...TD, padding: isMobile ? '0.6rem 0.75rem' : TD.padding }}>
                <CodeCell codes={doc.codes} compact={isMobile} />
            </td>
            {/* <td style={{ ...TD, padding: isMobile ? '0.6rem 0.75rem' : TD.padding }}>
                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: isMobile ? '0.8rem' : '0.85rem', wordBreak: 'break-word' }}>
                    {doc.label}
                </span>
                {isMobile && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>{doc.department !== '—' ? doc.department : ''}</div>}
            </td> */}
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
    const codes = doc.codes ?? [];
    const [activeTab,     setActiveTab]     = useState('details');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting]           = useState(false);
    const [editing, setEditing]             = useState(false);
    const { isMobile }                      = useResponsive();
    const system                            = useSystem();

    const sources = { document_types: documentTypes, users, roles, system };

    // Everything on the form that the fixed cards above don't already cover.
    const SHOWN_ABOVE  = ['label', 'document_type_id', 'department'];
    const extraFields  = formFields.filter(f => f.is_active && !SHOWN_ABOVE.includes(f.key));

    // Rows under the code on a printed label: the fixed details, then every
    // extra form field, with Added By last. Blank values drop their row.
    const printMeta = useMemo(() => {
        const rows = [
            ['Document Type', doc.type],
            ['Department',    doc.department],
            ['Document Date', doc.documentDate],
            ...extraFields.map(f => [f.label, formatFieldValue(f, documentFieldValue(f, doc), sources)]),
            ['Added By',      doc.owner],
        ];
        return rows.filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== '—');
    }, [doc, extraFields, documentTypes, users, roles]);

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

    /**
     * Prints one label card per code, so a document holding both a QR and a
     * barcode comes out as two cards on their own pages.
     */
    function handlePrint(only = null) {
        const printing = only ? [only] : codes;
        if (printing.length === 0) return;

        const cards = printing.map(code => `
        <div class="card ${isQrCode(code) ? 'qr' : 'bc'}">
            <div class="label">${doc.label}</div>
            <div class="img-wrap"><img src="${code.image}" /></div>
            <div class="code">${code.codeId}</div>
            <div class="meta">
                ${printMeta.map(([label, value]) => `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`).join('')}
            </div>
        </div>`).join('');

        const win = window.open('', '_blank', 'width=480,height=600');
        win.document.write(`<!DOCTYPE html><html><head><title>Print – ${codeIdList(printing)}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'Inter',Arial,sans-serif; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; min-height:100vh; padding:24px; }
            .card { border:1.5px solid #e2e8f0; border-radius:12px; padding:28px 32px; max-width:360px; width:100%; text-align:center; }
            .card + .card { page-break-before:always; }
            .label { font-size:1rem; font-weight:700; color:#0f172a; margin-bottom:18px; word-break:break-word; }
            .img-wrap { display:inline-block; border:1px solid #e2e8f0; border-radius:8px; background:#fff; margin-bottom:14px; }
            .qr .img-wrap { padding:10px; }
            .bc .img-wrap { padding:12px 16px; }
            img { display:block; }
            .qr img { width:180px; height:180px; }
            .bc img { width:220px; height:68px; object-fit:contain; }
            .code { font-family:monospace; font-size:0.9rem; font-weight:700; color:#4f46e5; background:#eef2ff; border:1px solid #c7d2fe; border-radius:6px; padding:4px 14px; display:inline-block; margin-bottom:16px; letter-spacing:0.5px; }
            .meta { font-size:0.78rem; color:#64748b; line-height:1.8; }
            .meta strong { color:#334155; }
            @media print { body { min-height:unset; padding:0; gap:0; } .card { border:none; } }
        </style></head><body>
        ${cards}
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
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: isMobile ? '1rem 1.25rem' : '2rem 1.5rem',
                            gap: 20, flexWrap: 'wrap',
                            overflowY: 'auto',
                        }}>
                            <CodePanel
                                codes={codes}
                                sizes={{ qr: qrSize, bcW, bcH }}
                                align={isMobile ? 'flex-start' : 'center'}
                                renderAction={code => (
                                    <button onClick={() => handlePrint(code)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.85rem', background: '#fff', border: '1px solid #c7d2fe', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', cursor: 'pointer' }}>
                                        <PrintIcon /> Print {isQrCode(code) ? 'QR' : 'Barcode'}
                                    </button>
                                )}
                            />
                            {codes.length > 1 && (
                                <button onClick={() => setActiveTab('print-preview')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.85rem', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', cursor: 'pointer' }}>
                                    <PrintIcon /> Preview both labels
                                </button>
                            )}
                        </div>

                        {/* Details panel */}
                        <div style={{ flex: 1, padding: isMobile ? '1rem 1.25rem' : '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: isMobile ? 'visible' : 'auto' }}>
                            <div>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Label</div>
                                <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, wordBreak: 'break-word' }}>{doc.label}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                                <DetailCard label="Document Type" icon="🏷️"><Badge type={doc.type} /></DetailCard>
                                <DetailCard label="Created At" icon="🕒"><span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{doc.createdAt}</span></DetailCard>
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
                                    {doc.canManage !== false && (
                                        <>
                                            <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.58rem 0.9rem', background: '#fff', color: '#4f46e5', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8, border: '1px solid #c7d2fe', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                <EditIcon /> Edit
                                            </button>
                                            <button onClick={() => setConfirmDelete(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.58rem 0.9rem', background: '#fff', color: '#ef4444', fontWeight: 600, fontSize: '0.82rem', borderRadius: 8, border: '1px solid #fecaca', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                <TrashIcon /> Delete
                                            </button>
                                        </>
                                    )}
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
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', alignSelf: 'flex-start' }}>
                            {codes.length > 1
                                ? 'Preview of the printed labels — each code prints on its own page.'
                                : `Preview of the printed ${codes[0] ? codeLabel(codes[0]).toLowerCase() : 'code'} label.`}
                        </p>

                        {/* One print card per code */}
                        {codes.map(code => (
                            <div key={code.id ?? code.codeId} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '28px 32px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 18, wordBreak: 'break-word' }}>{doc.label}</div>
                                <div style={{ display: 'inline-block', padding: isQrCode(code) ? 10 : '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', marginBottom: 14 }}>
                                    <img src={code.image} alt={codeLabel(code)}
                                        style={codeImageStyle(code, { qr: 180, bcW: 220, bcH: 68 })} />
                                </div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '4px 14px', display: 'inline-block', marginBottom: 16, letterSpacing: '0.5px' }}>
                                    {code.codeId}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.9, textAlign: 'left' }}>
                                    {printMeta.map(([label, value]) => (
                                        <div key={label}><strong style={{ color: '#334155' }}>{label}:</strong> {value}</div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Print button */}
                        <button onClick={() => handlePrint()} disabled={codes.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.75rem', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.88rem', borderRadius: 9, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                            <PrintIcon size={16} /> {codes.length > 1 ? 'Print Both Labels' : `Print ${codes[0] ? codeLabel(codes[0]) : 'Label'}`}
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
                    documentTypes={documentTypes.filter(t => t.can_manage !== false)}
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

                    {/* Tracking codes are fixed at creation time and shown read-only here. */}
                    <EditField label={(doc.codes ?? []).length > 1 ? 'Tracking Codes' : 'Tracking Code'}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(doc.codes ?? []).map(code => (
                                <div key={code.id ?? code.codeId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.7rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7 }}>
                                    <span style={{ fontSize: '0.95rem' }}>{isQrCode(code) ? '⬛' : '▐▌'}</span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: '#4f46e5' }}>{code.codeId}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto' }}>Cannot be changed</span>
                                </div>
                            ))}
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

/** Values on the printed label are interpolated into HTML, so keep any markup in them inert. */
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
