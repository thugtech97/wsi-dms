import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Spotlight walkthrough. Dims the page, cuts a hole around one element at a
 * time and explains it in a small card.
 *
 *   const steps = [
 *       { title: 'Welcome', body: 'What this page is for.' },              // no target → centred
 *       { target: '[data-tour="name"]', title: 'Name it', body: '…' },
 *       { target: '[data-tour="docs"]', title: 'Docs', body: '…',
 *         before: () => setShowDocs(true) },                               // runs before the step shows
 *   ];
 *
 *   <GuidedTour steps={steps} run={touring} onFinish={() => setTouring(false)} />
 *
 * A step whose target is missing still shows — it just appears centred, so a
 * tour never dead-ends on an element that is not on screen.
 */
export default function GuidedTour({ steps, run, onFinish }) {
    const [index, setIndex] = useState(0);
    const [rect, setRect]   = useState(null);
    const [size, setSize]   = useState({ w: 340, h: 190 });

    const cardRef  = useRef(null);
    const stepsRef = useRef(steps);
    const indexRef = useRef(0);

    stepsRef.current = steps;
    indexRef.current = index;

    const step  = run ? steps[index] : null;
    const total = steps.length;

    const finish = useCallback(() => {
        setIndex(0);
        onFinish?.();
    }, [onFinish]);

    const go = useCallback(delta => {
        const next = indexRef.current + delta;
        if (next < 0) return;
        if (next >= stepsRef.current.length) {
            finish();
            return;
        }
        setIndex(next);
    }, [finish]);

    useEffect(() => {
        if (run) setIndex(0);
    }, [run]);

    // Prepare the step (open a panel, reveal a section…) and bring it on screen.
    useEffect(() => {
        if (!run) return;

        const current = stepsRef.current[index];
        if (!current) return;

        current.before?.();

        // The element may only appear on the next render, so look for it for a moment.
        let cancelled = false;
        const deadline = Date.now() + 1000;

        (function findAndScroll() {
            if (cancelled || !current.target) return;
            const el = document.querySelector(current.target);
            if (el) {
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                return;
            }
            if (Date.now() < deadline) requestAnimationFrame(findAndScroll);
        })();

        return () => { cancelled = true; };
    }, [run, index]);

    // Follow the target while the page scrolls, resizes or reflows.
    useEffect(() => {
        if (!run) {
            setRect(null);
            return;
        }

        let frame;
        function tick() {
            const current = stepsRef.current[indexRef.current];
            const el = current?.target ? document.querySelector(current.target) : null;
            const box = el ? el.getBoundingClientRect() : null;

            setRect(previous => (sameBox(previous, box)
                ? previous
                : (box ? { top: box.top, left: box.left, width: box.width, height: box.height } : null)));

            frame = requestAnimationFrame(tick);
        }

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [run]);

    useEffect(() => {
        if (!run) return;

        function onKeyDown(e) {
            if (e.key === 'Escape')     { e.preventDefault(); finish(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
        }

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [run, go, finish]);

    useLayoutEffect(() => {
        const box = cardRef.current?.getBoundingClientRect();
        if (!box) return;
        setSize(previous => (Math.abs(previous.h - box.height) < 2 && Math.abs(previous.w - box.width) < 2
            ? previous
            : { w: box.width, h: box.height }));
    }, [index, rect, run]);

    if (!run || !step) return null;

    const pad  = 8;
    const hole = rect && rect.width > 0
        ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
        : null;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = Math.min(360, vw - 32);

    let cardTop  = Math.max(16, vh / 2 - size.h / 2);
    let cardLeft = Math.max(16, vw / 2 - cardWidth / 2);

    if (hole) {
        const below = hole.top + hole.height + 14;
        const above = hole.top - 14 - size.h;

        cardTop = below + size.h <= vh - 16
            ? below
            : (above >= 16 ? above : clamp(hole.top, 16, Math.max(16, vh - size.h - 16)));

        cardLeft = clamp(hole.left + hole.width / 2 - cardWidth / 2, 16, Math.max(16, vw - cardWidth - 16));
    }

    const isLast  = index === total - 1;
    const isFirst = index === 0;

    return (
        <div role="dialog" aria-modal="true" aria-label="Guided tour" style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
            {/* Dim everything except the highlighted element. */}
            {hole ? (
                <>
                    <div style={{ ...dimSt, top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
                    <div style={{ ...dimSt, top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
                    <div style={{ ...dimSt, top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
                    <div style={{ ...dimSt, top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'fixed', top: hole.top, left: hole.left, width: hole.width, height: hole.height,
                            border: '2px solid #6366f1', borderRadius: 10, pointerEvents: 'none',
                            boxShadow: '0 0 0 4px rgba(99,102,241,0.22)',
                        }}
                    />
                </>
            ) : (
                <div style={{ ...dimSt, inset: 0 }} />
            )}

            <div
                ref={cardRef}
                style={{
                    position: 'fixed', top: cardTop, left: cardLeft, width: cardWidth,
                    background: '#fff', borderRadius: 12, boxShadow: '0 20px 45px rgba(15,23,42,0.3)',
                    padding: '1.1rem 1.2rem 0.9rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#94a3b8' }}>
                        Step {index + 1} of {total}
                    </span>
                    <button
                        type="button"
                        onClick={finish}
                        style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                        Skip tour
                    </button>
                </div>

                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 8 }}>{step.title}</h2>
                <div style={{ fontSize: '0.83rem', color: '#475569', marginTop: 6, lineHeight: 1.55 }}>{step.body}</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                        {steps.map((_, i) => (
                            <span
                                key={i}
                                aria-hidden="true"
                                style={{ width: 6, height: 6, borderRadius: '50%', background: i === index ? '#6366f1' : '#e2e8f0' }}
                            />
                        ))}
                    </div>
                    {!isFirst && (
                        <button
                            type="button"
                            onClick={() => go(-1)}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#475569', cursor: 'pointer' }}
                        >
                            Back
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => go(1)}
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', borderRadius: 6, background: '#6366f1', color: '#fff', cursor: 'pointer' }}
                    >
                        {isLast ? 'Done' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function sameBox(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return Math.abs(a.top - b.top) < 1 && Math.abs(a.left - b.left) < 1
        && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

const dimSt = { position: 'fixed', background: 'rgba(15,23,42,0.55)' };
