import { Head, Link, useForm } from '@inertiajs/react';
import DmsGuestLayout from '@/Layouts/DmsGuestLayout';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    function submit(e) {
        e.preventDefault();
        post(route('password.email'));
    }

    return (
        <DmsGuestLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
            <Head title="Forgot Password — Ombudsman DMS" />

            {status && (
                <div style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontWeight: 500, fontSize: '0.8rem', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
                        Email Address
                    </label>
                    <input
                        autoFocus
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        placeholder="you@example.com"
                        style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.875rem', border: '1px solid #cbd5e1', borderRadius: 8, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                        required
                    />
                    {errors.email && <p style={{ color: '#ef4444', fontSize: '0.76rem', marginTop: 4 }}>{errors.email}</p>}
                </div>

                <button type="submit" disabled={processing} style={{ width: '100%', padding: '0.65rem 1rem', background: processing ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.9rem', borderRadius: 8, border: 'none', cursor: processing ? 'not-allowed' : 'pointer' }}>
                    {processing ? 'Sending…' : 'Send Reset Link'}
                </button>

                <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    Remembered it?{' '}
                    <Link href={route('login')} style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                        Back to Sign In
                    </Link>
                </p>
            </form>
        </DmsGuestLayout>
    );
}
