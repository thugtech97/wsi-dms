import { Head, useForm } from '@inertiajs/react';
import DmsGuestLayout from '@/Layouts/DmsGuestLayout';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    }

    return (
        <DmsGuestLayout title="Set a new password" subtitle="Choose a strong password for your account.">
            <Head title="Reset Password — Webfocus DMS" />

            <form onSubmit={submit}>
                <Field label="Email Address" error={errors.email}>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        style={inputSt}
                        autoComplete="username"
                        required
                    />
                </Field>

                <Field label="New Password" error={errors.password}>
                    <input
                        autoFocus
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        placeholder="••••••••"
                        style={inputSt}
                        autoComplete="new-password"
                        required
                    />
                </Field>

                <Field label="Confirm New Password" error={errors.password_confirmation}>
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

                <button type="submit" disabled={processing} style={{ width: '100%', padding: '0.65rem 1rem', background: processing ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.9rem', borderRadius: 8, border: 'none', cursor: processing ? 'not-allowed' : 'pointer', marginTop: '0.25rem' }}>
                    {processing ? 'Resetting…' : 'Reset Password'}
                </button>
            </form>
        </DmsGuestLayout>
    );
}

const inputSt = {
    width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.875rem',
    border: '1px solid #cbd5e1', borderRadius: 8, color: '#1e293b',
    outline: 'none', boxSizing: 'border-box', background: '#fff',
};

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
