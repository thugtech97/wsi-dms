import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * In-app replacement for window.confirm / window.alert.
 *
 *   const { confirm, notify, dialog } = useConfirm();
 *
 *   async function remove(user) {
 *       if (!await confirm({ title: 'Delete user?', message: '…', tone: 'danger' })) return;
 *       …
 *   }
 *
 * Render {dialog} once anywhere inside the component.
 */
export function useConfirm() {
    const [request, setRequest] = useState(null);

    const ask = useCallback((options, mode) => new Promise(resolve => {
        setRequest({
            mode,
            title:        options.title ?? (mode === 'alert' ? 'Notice' : 'Are you sure?'),
            message:      options.message ?? '',
            detail:       options.detail ?? null,
            confirmLabel: options.confirmLabel ?? (mode === 'alert' ? 'OK' : 'Confirm'),
            cancelLabel:  options.cancelLabel ?? 'Cancel',
            tone:         options.tone ?? 'default',
            resolve,
        });
    }), []);

    const confirm = useCallback(
        options => ask(typeof options === 'string' ? { message: options } : options, 'confirm'),
        [ask],
    );

    const notify = useCallback(
        options => ask(typeof options === 'string' ? { message: options } : options, 'alert'),
        [ask],
    );

    const settle = useCallback(answer => {
        setRequest(current => {
            current?.resolve(answer);
            return null;
        });
    }, []);

    const dialog = <ConfirmDialog request={request} onSettle={settle} />;

    return { confirm, notify, dialog };
}

const TONES = {
    default: { accent: '#6366f1', ring: '#e0e7ff', icon: '?' },
    danger:  { accent: '#dc2626', ring: '#fee2e2', icon: '!' },
    warning: { accent: '#d97706', ring: '#fef3c7', icon: '!' },
};

function ConfirmDialog({ request, onSettle }) {
    const confirmRef  = useRef(null);
    const restoreRef  = useRef(null);
    const open        = !!request;

    // Keep the keyboard in the dialog's world: Esc cancels, Enter confirms.
    useEffect(() => {
        if (!open) return;

        restoreRef.current = document.activeElement;
        confirmRef.current?.focus();

        function onKeyDown(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                onSettle(false);
            }
        }

        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            restoreRef.current?.focus?.();
        };
    }, [open, onSettle]);

    if (!open) return null;

    const tone    = TONES[request.tone] ?? TONES.default;
    const isAlert = request.mode === 'alert';

    return (
        <div
            onClick={() => onSettle(false)}
            style={{
                position: 'fixed', inset: 0, zIndex: 400,
                background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420,
                    boxShadow: '0 20px 45px rgba(15,23,42,0.28)', overflow: 'hidden',
                }}
            >
                <div style={{ padding: '1.35rem 1.5rem 1.1rem', display: 'flex', gap: '0.9rem' }}>
                    <span
                        aria-hidden="true"
                        style={{
                            flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
                            background: tone.ring, color: tone.accent,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '1.05rem',
                        }}
                    >
                        {tone.icon}
                    </span>
                    <div style={{ minWidth: 0 }}>
                        <h2 id="confirm-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                            {request.title}
                        </h2>
                        {request.message && (
                            <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: 6, lineHeight: 1.5 }}>
                                {request.message}
                            </p>
                        )}
                        {request.detail && (
                            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 8, lineHeight: 1.5 }}>
                                {request.detail}
                            </p>
                        )}
                    </div>
                </div>

                <div style={{
                    display: 'flex', justifyContent: 'flex-end', gap: 8,
                    padding: '0.85rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9',
                }}>
                    {!isAlert && (
                        <button
                            type="button"
                            onClick={() => onSettle(false)}
                            style={{
                                padding: '0.45rem 0.95rem', fontSize: '0.83rem', fontWeight: 500,
                                border: '1px solid #e2e8f0', borderRadius: 6,
                                background: '#fff', color: '#475569', cursor: 'pointer',
                            }}
                        >
                            {request.cancelLabel}
                        </button>
                    )}
                    <button
                        ref={confirmRef}
                        type="button"
                        onClick={() => onSettle(true)}
                        style={{
                            padding: '0.45rem 0.95rem', fontSize: '0.83rem', fontWeight: 600,
                            border: 'none', borderRadius: 6,
                            background: tone.accent, color: '#fff', cursor: 'pointer',
                        }}
                    >
                        {request.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
