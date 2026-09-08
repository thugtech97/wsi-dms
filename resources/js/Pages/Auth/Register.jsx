import { Head, Link, useForm } from '@inertiajs/react';
import DmsGuestLayout from '@/Layouts/DmsGuestLayout';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    }

    return (
        <DmsGuestLayout title="Create an account" subtitle="Join the Ombudsman DMS to manage your documents.">
            <Head title="Register — Ombudsman DMS" />

            <form onSubmit={submit}>
                <Field label="Full Name" error={errors.name}>
                    <input
                        autoFocus
                        type="text"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        placeholder="Juan Dela Cruz"
                        style={inputSt}
                        autoComplete="name"
                        required
                    />
                </Field>

                <Field label="Email Address" error={errors.email}>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        placeholder="you@example.com"
                        style={inputSt}
                        autoComplete="username"
                        required
                    />
                </Field>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Field label="Password" error={errors.password} style={{ flex: 1 }}>
                        <input
                            type="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            placeholder="••••••••"
                            style={inputSt}
                            autoComplete="new-password"
                            required
                        />
                    </Field>
                    <Field label="Confirm Password" error={errors.password_confirmation} style={{ flex: 1 }}>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            placeholder="••••••••"
                            style={inputSt}
                            autoComplete="new-password"
                            required
                        />
                    </Field>
                </div>

                <button type="submit" disabled={processing} style={{ ...btnSt, background: processing ? '#a5b4fc' : '#6366f1', cursor: processing ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}>
                    {processing ? 'Creating account…' : 'Create Account'}
                </button>

                <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    Already have an account?{' '}
                    <Link href={route('login')} style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                        Sign in
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
};
const btnSt = {
    width: '100%', padding: '0.65rem 1rem',
    color: '#fff', fontWeight: 600, fontSize: '0.9rem',
    borderRadius: 8, border: 'none', transition: 'background 0.15s',
    letterSpacing: '0.01em',
};

function Field({ label, error, style: wrapStyle, children }) {
    return (
        <div style={{ marginBottom: '1.1rem', ...wrapStyle }}>
            <label style={{ fontWeight: 500, fontSize: '0.8rem', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                {label}
            </label>
            {children}
            {error && <p style={{ color: '#ef4444', fontSize: '0.76rem', marginTop: 4 }}>{error}</p>}
        </div>
    );
}
