/**
 * A document carries one or two tracking codes (a QR, a barcode, or both).
 * Everything that shows a code — the index table, the view modal, reports, the
 * scan result — renders it through here so the two stay visually consistent.
 *
 * Every `codes` array is the shape produced by DocumentCode::toDisplayArray():
 *   { id, type: 'QR' | 'Barcode', codeId, value, image, scanUrl }
 */

export const isQrCode = code => code?.type === 'QR';

/**
 * What a scanner actually typed, reduced to a code. A QR encodes the document's
 * scan URL, so phone and handheld scanners hand back the whole URL; a barcode
 * still arrives as the plain value and passes through untouched.
 */
export function normaliseScanInput(input = '') {
    const value = String(input).trim();
    if (!/^https?:\/\//i.test(value)) return value;

    try {
        const path = new URL(value).pathname.replace(/\/+$/, '');
        const last = path.split('/').filter(Boolean).pop();
        return last ? decodeURIComponent(last) : value;
    } catch {
        return value;
    }
}

/** Sizing differs per type: a QR is square, a barcode is a wide strip. */
export function codeImageStyle(code, { qr = 52, bcW = 76, bcH = 26 } = {}) {
    return isQrCode(code)
        ? { width: qr, height: qr, display: 'block' }
        : { width: bcW, height: bcH, objectFit: 'contain', display: 'block' };
}

export const codeLabel = code => (isQrCode(code) ? 'QR Code' : 'Barcode');
export const codeGlyph = code => (isQrCode(code) ? '⬛' : '▐▌');

/** The first code — used wherever only one can be shown. */
export const primaryCode = codes => (codes?.length ? codes[0] : null);

/** "#QR-12345 · #BC-12345" — for titles, filenames and one-line summaries. */
export const codeIdList = codes => (codes ?? []).map(c => c.codeId).join(' · ');

/**
 * Table-cell rendering: the document's codes side by side, each with its
 * reference underneath.
 */
export function CodeCell({ codes = [], compact = false }) {
    if (codes.length === 0) {
        return <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>No code</span>;
    }

    const sizes = compact
        ? { qr: 36, bcW: 52, bcH: 20 }
        : { qr: 52, bcW: 76, bcH: 26 };

    return (
        <div style={{ display: 'inline-flex', flexDirection: 'row', gap: compact ? 8 : 12, alignItems: 'flex-start', justifyContent: 'center' }}>
            {codes.map(code => (
                <div key={code.id ?? code.codeId} style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: 3, background: '#fff', display: 'inline-block' }}>
                        <img src={code.image} alt={codeLabel(code)} style={codeImageStyle(code, sizes)} />
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                        {code.codeId}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * The larger presentation used inside modals: image, reference chip, type name,
 * and an optional action button under each code.
 */
export function CodePanel({ codes = [], sizes, renderAction, align = 'center' }) {
    if (codes.length === 0) {
        return <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No tracking code on this document.</span>;
    }

    return (
        <>
            {codes.map(code => (
                <div
                    key={code.id ?? code.codeId}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: align, gap: 8 }}
                >
                    <div style={{ background: '#fff', borderRadius: 12, padding: isQrCode(code) ? 12 : 16, boxShadow: '0 4px 20px rgba(99,102,241,0.1)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={code.image} alt={codeLabel(code)} style={codeImageStyle(code, sizes)} />
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '0.28rem 0.7rem', letterSpacing: '0.5px' }}>
                        {code.codeId}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                        {codeGlyph(code)} {codeLabel(code)}
                    </div>
                    {isQrCode(code) && code.scanUrl && (
                        <a
                            href={code.scanUrl}
                            title={code.scanUrl}
                            style={{ fontSize: '0.68rem', color: '#6366f1', textDecoration: 'none', wordBreak: 'break-all', maxWidth: 240, textAlign: align === 'center' ? 'center' : 'left' }}
                        >
                            🔗 {code.scanUrl}
                        </a>
                    )}
                    {renderAction?.(code)}
                </div>
            ))}
        </>
    );
}
