import { Head, useForm, usePage } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';

export default function DmsProfileEdit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const profileForm = useForm({ name: user.name, email: user.email });
    const passwordForm = useForm({ current_password: '', password: '', password_confirmation: '' });
    const deleteForm  = useForm({ password: '' });
    const [confirmDelete, setConfirmDelete] = useState(false);

    function updateProfile(e) {
        e.preventDefault();
        profileForm.patch(route('profile.update'), { preserveScroll: true });
    }

    function updatePassword(e) {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    }

    function deleteAccount(e) {
        e.preventDefault();
        deleteForm.delete(route('profile.destroy'), { onSuccess: () => setConfirmDelete(false) });
    }

    return (
        <DmsLayout activePage="User Profile">
            <Head title="User Profile" />
            <div style={{ padding: '1.5rem', maxWidth: 620 }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>User Profile</h1>

                {/* Profile info */}
                <Card title="Profile Information">
                    {status === 'profile-updated' && <SuccessMsg>Profile updated successfully.</SuccessMsg>}
                    <form onSubmit={updateProfile}>
                        <Field label="Name" error={profileForm.errors.name}>
                            <input style={inputSt} value={profileForm.data.name} onChange={e => profileForm.setData('name', e.target.value)} required />
                        </Field>
                        <Field label="Email" error={profileForm.errors.email}>
                            <input style={inputSt} type="email" value={profileForm.data.email} onChange={e => profileForm.setData('email', e.target.value)} required />
                        </Field>
                        <IndigoBtn type="submit" disabled={profileForm.processing}>
                            {profileForm.processing ? 'Saving...' : 'Save Changes'}
                        </IndigoBtn>
                    </form>
                </Card>

                {/* Change password */}
                <Card title="Change Password">
                    {status === 'password-updated' && <SuccessMsg>Password updated.</SuccessMsg>}
                    <form onSubmit={updatePassword}>
                        <Field label="Current Password" error={passwordForm.errors.current_password}>
                            <input style={inputSt} type="password" value={passwordForm.data.current_password} onChange={e => passwordForm.setData('current_password', e.target.value)} required />
                        </Field>
                        <Field label="New Password" error={passwordForm.errors.password}>
                            <input style={inputSt} type="password" value={passwordForm.data.password} onChange={e => passwordForm.setData('password', e.target.value)} required />
                        </Field>
                        <Field label="Confirm New Password" error={passwordForm.errors.password_confirmation}>
                            <input style={inputSt} type="password" value={passwordForm.data.password_confirmation} onChange={e => passwordForm.setData('password_confirmation', e.target.value)} required />
                        </Field>
                        <IndigoBtn type="submit" disabled={passwordForm.processing}>
                            {passwordForm.processing ? 'Updating...' : 'Update Password'}
                        </IndigoBtn>
                    </form>
                </Card>

                {/* Delete account */}
                <Card title="Delete Account">
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                        Once your account is deleted, all data will be permanently removed.
                    </p>
                    {!confirmDelete ? (
                        <button onClick={() => setConfirmDelete(true)}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: '1px solid #fecaca', borderRadius: 6, background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontWeight: 500 }}>
                            Delete Account
                        </button>
                    ) : (
                        <form onSubmit={deleteAccount}>
                            <Field label="Confirm your password" error={deleteForm.errors.password}>
                                <input style={inputSt} type="password" value={deleteForm.data.password} onChange={e => deleteForm.setData('password', e.target.value)} required />
                            </Field>
                            <div className="flex gap-2">
                                <button type="submit" disabled={deleteForm.processing}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                                    {deleteForm.processing ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                                <button type="button" onClick={() => setConfirmDelete(false)}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#64748b', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </DmsLayout>
    );
}

import { useState } from 'react';

const inputSt  = { width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', boxSizing: 'border-box' };

function Card({ title, children }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{title}</div>
            <div style={{ padding: '1.25rem' }}>{children}</div>
        </div>
    );
}
function Field({ label, error, children }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 500, fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>{label}</label>
            {children}
            {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{error}</p>}
        </div>
    );
}
function IndigoBtn({ children, ...props }) {
    return (
        <button {...props} style={{ padding: '0.5rem 1.1rem', background: props.disabled ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 500, fontSize: '0.85rem', borderRadius: 6, border: 'none', cursor: props.disabled ? 'not-allowed' : 'pointer' }}>
            {children}
        </button>
    );
}
function SuccessMsg({ children }) {
    return <p style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.6rem 0.9rem', borderRadius: 6, fontSize: '0.8rem', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>{children}</p>;
}
