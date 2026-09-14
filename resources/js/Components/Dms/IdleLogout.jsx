import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { useSystem } from '@/hooks/useSystem';

/**
 * Settings → Session Settings, applied in the browser. After `session_timeout`
 * minutes without activity the user is signed out; `idle_logout_warning`
 * minutes before that a dialog counts down and offers to stay signed in.
 *
 * Activity is shared across tabs through localStorage, so typing in one tab
 * keeps the others alive. While the user is active the server session is
 * pinged now and then, so it never expires under a page that is still in use.
 */

const ACTIVITY_KEY    = 'dms-last-activity';
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'];
const TICK_MS         = 1000;

export default function IdleLogout() {
    const { session_timeout: timeoutMin, idle_logout_warning: warnMin } = useSystem();
    const [secondsLeft, setSecondsLeft] = useState(null); // null = no warning shown
    const warningRef   = useRef(false);
    const loggingOut   = useRef(false);
    const lastPingRef  = useRef(Date.now());

    useEffect(() => {
        const timeoutMs = Math.max(1, timeoutMin) * 60_000;
        const warnMs    = Math.min(Math.max(1, warnMin) * 60_000, timeoutMs / 2);
        // Keep the server session alive well inside its lifetime.
        const pingEvery = Math.min(5 * 60_000, timeoutMs / 3);

        const touch = () => localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
        const lastActivity = () => Number(localStorage.getItem(ACTIVITY_KEY)) || Date.now();

        touch();

        // Ordinary activity only counts while no warning is showing — once it
        // is, only the Stay signed in button (or another tab) resets the clock.
        let throttle = 0;
        function onActivity() {
            if (warningRef.current) return;
            const now = Date.now();
            if (now - throttle < 1000) return;
            throttle = now;
            touch();
        }
        ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }));

        const timer = setInterval(() => {
            if (loggingOut.current) return;

            const idle = Date.now() - lastActivity();

            if (idle >= timeoutMs) {
                loggingOut.current = true;
                localStorage.removeItem(ACTIVITY_KEY);
                router.post(route('logout'));
                return;
            }

            if (idle >= timeoutMs - warnMs) {
                warningRef.current = true;
                setSecondsLeft(Math.ceil((timeoutMs - idle) / 1000));
            } else {
                if (warningRef.current) {
                    warningRef.current = false;
                    setSecondsLeft(null);
                }
                if (Date.now() - lastPingRef.current >= pingEvery) {
                    lastPingRef.current = Date.now();
                    window.axios?.get(route('session.ping')).catch(() => {});
                }
            }
        }, TICK_MS);

        return () => {
            clearInterval(timer);
            ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, onActivity));
        };
    }, [timeoutMin, warnMin]);

    function stay() {
        localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
        lastPingRef.current = Date.now();
        warningRef.current  = false;
        setSecondsLeft(null);
        window.axios?.get(route('session.ping')).catch(() => {});
    }

    function logoutNow() {
        loggingOut.current = true;
        localStorage.removeItem(ACTIVITY_KEY);
        router.post(route('logout'));
    }

    if (secondsLeft === null) return null;

    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="idle-title"
                style={{
                    background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420,
                    boxShadow: '0 20px 45px rgba(15,23,42,0.28)', overflow: 'hidden',
                }}
            >
                <div style={{ padding: '1.35rem 1.5rem 1.1rem', display: 'flex', gap: '0.9rem' }}>
                    <span aria-hidden="true" style={{
                        flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
                        background: '#fef3c7', color: '#d97706',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '1.05rem',
                    }}>!</span>
                    <div style={{ minWidth: 0 }}>
                        <h2 id="idle-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                            Still there?
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: 6, lineHeight: 1.5 }}>
                            You have been inactive for a while. For your security you will be signed out in
                        </p>
                        <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#d97706', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
                            {mm}:{ss}
                        </p>
                    </div>
                </div>
                <div style={{ padding: '0.85rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" onClick={logoutNow} style={{
                        padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0',
                        background: '#fff', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer',
                    }}>
                        Sign out
                    </button>
                    <button type="button" onClick={stay} autoFocus style={{
                        padding: '0.5rem 1rem', borderRadius: 8, border: 'none',
                        background: '#6366f1', fontSize: '0.82rem', fontWeight: 700, color: '#fff', cursor: 'pointer',
                    }}>
                        Stay signed in
                    </button>
                </div>
            </div>
        </div>
    );
}
