import { Head, Link, useForm } from '@inertiajs/react';
import DmsGuestLayout from '@/Layouts/DmsGuestLayout';
import { useSystem } from '@/hooks/useSystem';

export default function Login({ status, canResetPassword }) {
    const { remember_me: rememberEnabled } = useSystem();
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e) {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    }

    return (
        <DmsGuestLayout title="Welcome back" subtitle="Sign in to your account to continue.">
            <Head title="Sign In — Ombudsman DMS" />

            {status && (
                <div style={alertStyle('#f0fdf4', '#16a34a', '#bbf7d0')}>{status}</div>
            )}

            <form onSubmit={submit}>
                <Field label="Email Address" error={errors.email}>
                    <input
                        autoFocus
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        placeholder="you@example.com"
                        style={inputSt}
                        autoComplete="username"
                        required
                    />
                </Field>

                <Field label="Password" error={errors.password}>
                    <input
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        placeholder="••••••••"
                        style={inputSt}
                        autoComplete="current-password"
                        required
                    />
                </Field>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    {rememberEnabled ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}>
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={e => setData('remember', e.target.checked)}
                                style={{ accentColor: '#6366f1', width: 15, height: 15 }}
                            />
                            Remember me
                        </label>
                    ) : <span />}
                    {canResetPassword && (
                        <Link href={route('password.request')} style={{ fontSize: '0.82rem', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                            Forgot password?
                        </Link>
                    )}
                </div>

                <button type="submit" disabled={processing} style={btnSt(processing)}>
                    {processing ? 'Signing in…' : 'Sign In'}
                </button>

                <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    Don't have an account?{' '}
                    <Link href={route('register')} style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                        Create one
                    </Link>
                </p>
            </form>
        </DmsGuestLayout>
    );
}

const inputSt = {
    width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.875rem',
    border: '1px solid #cbd5e1', borderRadius: 8, color: '#1e293b',
    outline: 'none', boxSizing: 'border-box', background: '#fff',
    transition: 'border-color 0.15s',
};
const btnSt = (disabled) => ({
    width: '100%', padding: '0.65rem 1rem',
    background: disabled ? '#a5b4fc' : '#6366f1',
    color: '#fff', fontWeight: 600, fontSize: '0.9rem',
    borderRadius: 8, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
    letterSpacing: '0.01em',
});
const alertStyle = (bg, color, border) => ({
    background: bg, color, border: `1px solid ${border}`,
    borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.82rem',
    marginBottom: '1.25rem',
});

function Field({ label, error, children }) {
    return (
        <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ fontWeight: 500, fontSize: '0.8rem', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                {label}
            </label>
            {children}
            {error && <p style={{ color: '#ef4444', fontSize: '0.76rem', marginTop: 4 }}>{error}</p>}
        </div>
    );
}
