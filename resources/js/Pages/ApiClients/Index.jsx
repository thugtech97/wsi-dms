import { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import DmsLayout from '@/Layouts/DmsLayout';
import { useConfirm } from '@/Components/Dms/ConfirmDialog';

const DEFAULT_ABILITIES = ['documents:create', 'documents:read'];

export default function ApiClientsIndex({ clients, users, abilityList, apiBaseUrl }) {
    const { flash } = usePage().props;
    const [editing, setEditing] = useState(null);
    const [showDocs, setShowDocs] = useState(false);
    const { confirm, dialog } = useConfirm();

    const blank = {
        name: '', description: '', contact_email: '', user_id: '',
        abilities: DEFAULT_ABILITIES, allowed_ips: '', rate_limit_per_minute: 60, is_active: true,
    };

    const createForm = useForm(blank);
    const editForm   = useForm(blank);
    const actionForm = useForm({});

    function handleCreate(e) {
        e.preventDefault();
        createForm.post(route('api-clients.store'), {
            preserveScroll: true,
            onSuccess: () => createForm.setData(blank),
        });
    }

    function startEdit(client) {
        setEditing(client.id);
        editForm.setData({
            name: client.name,
            description: client.description ?? '',
            contact_email: client.contact_email ?? '',
            user_id: String(client.user_id),
            abilities: client.abilities ?? [],
            allowed_ips: (client.allowed_ips ?? []).join(', '),
            rate_limit_per_minute: client.rate_limit_per_minute,
            is_active: client.is_active,
        });
    }

    function handleEdit(e, id) {
        e.preventDefault();
        editForm.put(route('api-clients.update', id), {
            preserveScroll: true,
            onSuccess: () => setEditing(null),
        });
    }

    async function regenerate(client) {
        const ok = await confirm({
            title: `Issue a new token for “${client.name}”?`,
            message: 'The current token stops working immediately.',
            detail: 'Any app still using it will start getting 401 errors until it is updated.',
            confirmLabel: 'Issue new token',
            tone: 'warning',
        });
        if (!ok) return;

        actionForm.post(route('api-clients.regenerate', client.id), { preserveScroll: true });
    }

    function toggle(client) {
        actionForm.post(route('api-clients.toggle', client.id), { preserveScroll: true });
    }

    async function remove(client) {
        const ok = await confirm({
            title: `Remove “${client.name}”?`,
            message: 'Its token stops working right away.',
            detail: 'Documents it created stay in the DMS.',
            confirmLabel: 'Remove application',
            tone: 'danger',
        });
        if (!ok) return;

        actionForm.delete(route('api-clients.destroy', client.id), { preserveScroll: true });
    }

    return (
        <DmsLayout activePage="API Applications">
            <Head title="API Applications" />
            <div style={{ padding: '1.5rem', maxWidth: 1080 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '1.25rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>API Applications</h1>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
                            External systems that may create and read documents through the integration API.
                        </p>
                    </div>
                    <GhostBtn onClick={() => setShowDocs(d => !d)}>
                        {showDocs ? 'Hide' : 'View'} API reference
                    </GhostBtn>
                </div>

                {flash?.success && <Banner tone="success">{flash.success}</Banner>}

                {flash?.newToken && <TokenBanner payload={flash.newToken} />}

                {showDocs && <ApiReference baseUrl={apiBaseUrl} />}

                {/* ── Register ───────────────────────────────────────── */}
                <Card title="Register an Application">
                    <form onSubmit={handleCreate}>
                        <ClientFields form={createForm} users={users} abilityList={abilityList} />
                        <div style={{ marginTop: '1rem' }}>
                            <IndigoBtn type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'Registering…' : 'Register & Issue Token'}
                            </IndigoBtn>
                        </div>
                    </form>
                </Card>

                {/* ── List ───────────────────────────────────────────── */}
                <Card title={`${clients.length} Application${clients.length !== 1 ? 's' : ''}`}>
                    {clients.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No applications registered yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {clients.map(client => (
                                <div key={client.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                                    {editing === client.id ? (
                                        <form onSubmit={e => handleEdit(e, client.id)}>
                                            <ClientFields form={editForm} users={users} abilityList={abilityList} />
                                            <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
                                                <IndigoBtn type="submit" small disabled={editForm.processing}>Save changes</IndigoBtn>
                                                <GhostBtn type="button" onClick={() => setEditing(null)}>Cancel</GhostBtn>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{client.name}</span>
                                                        <StatusPill active={client.is_active} />
                                                    </div>
                                                    {client.description && (
                                                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{client.description}</p>
                                                    )}
                                                    <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#4f46e5', marginTop: 8 }}>
                                                        {client.masked_token}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                                    <GhostBtn onClick={() => startEdit(client)}>Edit</GhostBtn>
                                                    <GhostBtn onClick={() => regenerate(client)}>Regenerate token</GhostBtn>
                                                    <GhostBtn onClick={() => toggle(client)}>{client.is_active ? 'Disable' : 'Enable'}</GhostBtn>
                                                    <DangerBtn onClick={() => remove(client)}>Delete</DangerBtn>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #f1f5f9' }}>
                                                <Meta label="Documents owned by">{client.user_name ?? '—'}</Meta>
                                                <Meta label="Documents created">{client.documents_count}</Meta>
                                                <Meta label="Requests">{client.request_count}</Meta>
                                                <Meta label="Rate limit">{client.rate_limit_per_minute}/min</Meta>
                                                <Meta label="Last used">{client.last_used_at ?? 'never'}{client.last_used_ip ? ` (${client.last_used_ip})` : ''}</Meta>
                                                <Meta label="Token issued">{client.token_generated_at ?? '—'}</Meta>
                                                {client.contact_email && <Meta label="Contact">{client.contact_email}</Meta>}
                                                {client.allowed_ips.length > 0 && <Meta label="IP allowlist">{client.allowed_ips.join(', ')}</Meta>}
                                            </div>

                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                                {(client.abilities ?? []).length === 0
                                                    ? <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>No permissions granted — every call will be rejected.</span>
                                                    : client.abilities.map(a => (
                                                        <span key={a} style={{ fontSize: '0.72rem', fontFamily: 'monospace', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: 4, padding: '0.15rem 0.45rem' }}>{a}</span>
                                                    ))}
                                            </div>

                                            <button
                                                onClick={() => router.get(route('documents.index'))}
                                                style={{ marginTop: '0.85rem', background: 'none', border: 'none', padding: 0, color: '#6366f1', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                View documents in DMS →
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
            {dialog}
        </DmsLayout>
    );
}

function ClientFields({ form, users, abilityList }) {
    const { data, setData, errors } = form;

    function toggleAbility(key) {
        const next = data.abilities.includes(key)
            ? data.abilities.filter(a => a !== key)
            : [...data.abilities, key];
        setData('abilities', next);
    }

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem' }}>
                <Field label="Application name" error={errors.name}>
                    <input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. HR Portal" style={inputSt} required />
                </Field>
                <Field label="Documents owned by" error={errors.user_id} hint="API-created documents are filed under this DMS user.">
                    <select value={data.user_id} onChange={e => setData('user_id', e.target.value)} style={inputSt} required>
                        <option value="">Select a user…</option>
                        {users.map(u => <option key={u.id} value={String(u.id)}>{u.name} — {u.email}</option>)}
                    </select>
                </Field>
                <Field label="Contact email (optional)" error={errors.contact_email}>
                    <input type="email" value={data.contact_email} onChange={e => setData('contact_email', e.target.value)} placeholder="dev@partner.com" style={inputSt} />
                </Field>
                <Field label="Description (optional)" error={errors.description}>
                    <input value={data.description} onChange={e => setData('description', e.target.value)} placeholder="What this app does" style={inputSt} />
                </Field>
                <Field label="Rate limit (requests / minute)" error={errors.rate_limit_per_minute}>
                    <input type="number" min="1" max="10000" value={data.rate_limit_per_minute} onChange={e => setData('rate_limit_per_minute', e.target.value)} style={inputSt} required />
                </Field>
                <Field label="IP allowlist (optional)" error={errors.allowed_ips} hint="Comma separated. Leave empty to allow any IP.">
                    <input value={data.allowed_ips} onChange={e => setData('allowed_ips', e.target.value)} placeholder="203.0.113.10, 203.0.113.11" style={inputSt} />
                </Field>
            </div>

            <div style={{ marginTop: '1rem' }}>
                <label style={labelSt}>Permissions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {abilityList.map(a => (
                        <label key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', color: '#334155', cursor: 'pointer' }}>
                            <input type="checkbox" checked={data.abilities.includes(a.key)} onChange={() => toggleAbility(a.key)} />
                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#4f46e5' }}>{a.key}</span>
                            <span style={{ color: '#64748b' }}>— {a.label}</span>
                        </label>
                    ))}
                </div>
                {errors.abilities && <Err>{errors.abilities}</Err>}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', color: '#334155', marginTop: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                Active — the token may be used right away
            </label>
        </>
    );
}

function TokenBanner({ payload }) {
    const [copied, setCopied] = useState(false);

    function copy() {
        navigator.clipboard?.writeText(payload.token).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 600, color: '#065f46', fontSize: '0.88rem' }}>
                Token for “{payload.client}” — copy it now
            </div>
            <p style={{ fontSize: '0.78rem', color: '#047857', marginTop: 4 }}>
                Only a hash is stored, so this is the last time it can be shown. If it is lost, regenerate a new one.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <code style={{ flex: 1, minWidth: 240, background: '#fff', border: '1px solid #a7f3d0', borderRadius: 6, padding: '0.5rem 0.7rem', fontSize: '0.8rem', color: '#065f46', wordBreak: 'break-all' }}>
                    {payload.token}
                </code>
                <IndigoBtn type="button" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</IndigoBtn>
            </div>
        </div>
    );
}

function ApiReference({ baseUrl }) {
    const endpoints = [
        ['GET',    '/ping',                  'Health check (no token required)'],
        ['GET',    '/me',                    'Token owner, permissions and usage'],
        ['GET',    '/form-fields',           'Fields this DMS expects when creating a document'],
        ['GET',    '/document-types',        'Valid document_type_id values'],
        ['GET',    '/users',                 'Valid allowed_users values'],
        ['GET',    '/roles',                 'Valid allowed_roles values'],
        ['POST',   '/documents',             'Create a document and issue its QR / barcode'],
        ['GET',    '/documents',             'List documents this app created (paginated, filterable)'],
        ['GET',    '/documents/{id}',        'Fetch one document'],
        ['GET',    '/documents/lookup/{code}','Resolve a scanned code (?record_scan=1 to count it)'],
        ['POST',   '/documents/{id}/scan',   'Increment the scan counter'],
        ['PATCH',  '/documents/{id}',        'Update the keys you send'],
        ['DELETE', '/documents/{id}',        'Delete a document it created'],
    ];

    const example = `curl -X POST ${baseUrl}/documents \\
  -H "Authorization: Bearer wsi_your_token_here" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "label": "Purchase Order 2026-118",
    "document_type_id": 1,
    "department": "Procurement",
    "code_type": "QR"
  }'`;

    const response = `{
  "success": true,
  "data": {
    "id": 42,
    "label": "Purchase Order 2026-118",
    "document_type": { "id": 1, "name": "Purchase Order" },
    "code": {
      "type": "QR",
      "reference": "#QR-48213",
      "value": "DOC-48213",
      "image_url": "${baseUrl.replace('/api/v1', '')}/storage/codes/qr-48213.svg"
    },
    "scan_count": 0,
    "created_at": "2026-08-03T09:14:22+08:00"
  }
}`;

    return (
        <Card title="Integration API — v1">
            <p style={{ fontSize: '0.83rem', color: '#475569', marginBottom: '0.9rem' }}>
                Base URL <code style={codeSt}>{baseUrl}</code>. Authenticate every call with{' '}
                <code style={codeSt}>Authorization: Bearer &lt;token&gt;</code> or <code style={codeSt}>X-Api-Key: &lt;token&gt;</code>.
                Send <code style={codeSt}>Accept: application/json</code>. Field keys come from Settings → Document Form, so always
                read <code style={codeSt}>/form-fields</code> rather than hard-coding them.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                    <tbody>
                        {endpoints.map(([method, path, desc]) => (
                            <tr key={method + path}>
                                <td style={{ ...tdSt, width: 70 }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: methodColor(method) }}>{method}</span>
                                </td>
                                <td style={{ ...tdSt, fontFamily: 'monospace', fontSize: '0.78rem', color: '#0f172a', whiteSpace: 'nowrap' }}>{path}</td>
                                <td style={{ ...tdSt, color: '#64748b' }}>{desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                <div>
                    <div style={labelSt}>Create a document</div>
                    <pre style={preSt}>{example}</pre>
                </div>
                <div>
                    <div style={labelSt}>Response — 201 Created</div>
                    <pre style={preSt}>{response}</pre>
                </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.9rem' }}>
                Errors always come back as <code style={codeSt}>{'{ "success": false, "message": "…" }'}</code> —
                <strong> 401</strong> bad/missing token, <strong>403</strong> missing permission or blocked IP,
                <strong> 422</strong> validation (with an <code style={codeSt}>errors</code> object), <strong>429</strong> rate limit.
            </p>
        </Card>
    );
}

function methodColor(method) {
    return { GET: '#0369a1', POST: '#15803d', PATCH: '#b45309', DELETE: '#dc2626' }[method] ?? '#475569';
}

function Meta({ label, children }) {
    return (
        <div>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: 2 }}>{children}</div>
        </div>
    );
}

function StatusPill({ active }) {
    return (
        <span style={{
            fontSize: '0.68rem', fontWeight: 700, borderRadius: 999, padding: '0.12rem 0.5rem',
            background: active ? '#dcfce7' : '#fee2e2',
            color: active ? '#166534' : '#b91c1c',
        }}>
            {active ? 'ACTIVE' : 'DISABLED'}
        </span>
    );
}

function Field({ label, hint, error, children }) {
    return (
        <div>
            <label style={labelSt}>{label}</label>
            {children}
            {hint && <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>{hint}</p>}
            {error && <Err>{error}</Err>}
        </div>
    );
}

function Banner({ tone, children }) {
    const tones = {
        success: { bg: '#ecfdf5', border: '#a7f3d0', color: '#065f46' },
        error:   { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
    }[tone] ?? { bg: '#f8fafc', border: '#e2e8f0', color: '#334155' };

    return (
        <div style={{ background: tones.bg, border: `1px solid ${tones.border}`, color: tones.color, borderRadius: 8, padding: '0.7rem 1rem', fontSize: '0.83rem', marginBottom: '1rem' }}>
            {children}
        </div>
    );
}

const labelSt = { fontWeight: 500, fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' };
const inputSt = { width: '100%', padding: '0.47rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', boxSizing: 'border-box' };
const tdSt    = { padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', textAlign: 'left', verticalAlign: 'top' };
const codeSt  = { fontFamily: 'monospace', fontSize: '0.76rem', background: '#f1f5f9', borderRadius: 4, padding: '0.1rem 0.35rem', color: '#0f172a' };
const preSt   = { background: '#0f172a', color: '#e2e8f0', borderRadius: 8, padding: '0.85rem', fontSize: '0.72rem', lineHeight: 1.55, overflowX: 'auto', margin: 0 };

function Card({ title, children }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{title}</div>
            <div style={{ padding: '1.25rem' }}>{children}</div>
        </div>
    );
}
function Err({ children }) {
    return <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4 }}>{children}</p>;
}
function IndigoBtn({ children, small, ...props }) {
    return (
        <button {...props} style={{ padding: small ? '0.35rem 0.75rem' : '0.5rem 1rem', background: props.disabled ? '#a5b4fc' : '#6366f1', color: '#fff', fontWeight: 500, fontSize: '0.85rem', borderRadius: 6, border: 'none', cursor: props.disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {children}
        </button>
    );
}
function GhostBtn({ children, ...props }) {
    return (
        <button {...props} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {children}
        </button>
    );
}
function DangerBtn({ children, ...props }) {
    return (
        <button {...props} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', border: '1px solid #fecaca', borderRadius: 6, background: '#fff5f5', color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {children}
        </button>
    );
}
