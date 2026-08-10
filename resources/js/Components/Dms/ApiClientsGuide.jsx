/**
 * Plain-language user guide for the API Applications page, written for staff who
 * are not developers. The technical detail lives in the API reference panel —
 * this one only explains what to do and what the words mean.
 */
export default function ApiClientsGuide({ baseUrl, onStartTour }) {
    return (
        <div style={cardSt}>
            <div style={cardHeadSt}>User guide — how this page works</div>
            <div style={{ padding: '1.25rem' }}>
                <p style={leadSt}>
                    This page is where you give another computer system permission to put documents into the DMS
                    by itself — no one has to log in and upload them by hand. Think of it like issuing a key card to
                    a contractor: you say who they are, which doors they may open, and you can take the card back
                    at any time.
                </p>

                {onStartTour && (
                    <button type="button" onClick={onStartTour} style={tourBtnSt}>
                        ▶ Show me on the page instead (1-minute tour)
                    </button>
                )}

                <Section n="1" title="Before you start, collect three things">
                    <ol style={listSt}>
                        <li><strong>The name of the system</strong> that will be sending documents — for example “HR Portal”.</li>
                        <li>
                            <strong>Which DMS user should own the documents it creates.</strong> Every document in the DMS
                            belongs to somebody; documents that arrive through this route are filed under the user you pick
                            here. Pick the person or shared account responsible for that kind of paperwork.
                        </li>
                        <li>
                            <strong>What it is allowed to do</strong> — only send documents, only read them, or both.
                            When in doubt, grant less. You can always add more later.
                        </li>
                    </ol>
                    <Note>
                        The developer of the other system is the person who will use what this page produces. It helps to
                        have them on the phone the first time.
                    </Note>
                </Section>

                <Section n="2" title="Fill in “Register an Application”">
                    <dl style={{ margin: 0 }}>
                        <Term word="Application name">
                            A label so you recognise it later in the list. Nothing technical depends on it.
                        </Term>
                        <Term word="Documents owned by">
                            The DMS user whose name will appear as the owner of every document this system creates.
                        </Term>
                        <Term word="Contact email">
                            Who to email if the system starts misbehaving. Optional, but very useful a year from now.
                        </Term>
                        <Term word="Description">
                            One line about why this system exists, for whoever reads this page after you.
                        </Term>
                        <Term word="Rate limit (requests / minute)">
                            The maximum number of times per minute this system may contact the DMS. It is a safety valve:
                            if the other system develops a fault and starts calling thousands of times a minute, the DMS
                            turns it away instead of slowing down for everyone. 60 per minute is a sensible default —
                            raise it only if the developer says they need more.
                        </Term>
                        <Term word="IP allowlist">
                            An IP address is the internet “return address” of a computer. If you list one or more here,
                            the DMS will only accept calls coming from those addresses — so even a stolen token is useless
                            from anywhere else. Ask the developer for their server’s fixed IP address. Leave it empty if
                            you do not know it, or if the system runs from changing addresses.
                        </Term>
                        <Term word="Permissions">
                            The individual actions this system may perform, such as creating documents or reading them
                            back. A system with no permissions ticked is registered but can do nothing.
                        </Term>
                        <Term word="Active">
                            Leave this ticked so it works straight away. Untick it to register the system now but keep it
                            switched off until go-live.
                        </Term>
                    </dl>
                </Section>

                <Section n="3" title="Copy the token — you only see it once">
                    <p style={pSt}>
                        When you press <strong>Register &amp; Issue Token</strong>, a green box appears with a long piece of
                        text starting with <code style={codeSt}>wsi_</code>. That is the <strong>token</strong>: the key card
                        itself. Whoever holds it can act as this application.
                    </p>
                    <ul style={listSt}>
                        <li>Press <strong>Copy</strong> and send it to the developer <strong>now</strong>.</li>
                        <li>
                            The DMS stores only a scrambled copy, so <strong>it cannot be shown again</strong>. If it is lost,
                            that is fine — use <strong>Regenerate token</strong> to issue a fresh one.
                        </li>
                        <li>
                            Treat it like a password: send it through a channel you trust, never post it in a public chat,
                            a ticket, or a shared spreadsheet.
                        </li>
                    </ul>
                    <Note tone="warning">
                        If a token is ever seen by someone who should not have it, press <strong>Regenerate token</strong>
                        immediately. The old one stops working the moment you confirm.
                    </Note>
                </Section>

                <Section n="4" title="Hand over to the developer">
                    <p style={pSt}>Send them these three things and nothing else is needed:</p>
                    <ul style={listSt}>
                        <li>The token you just copied.</li>
                        <li>The address of the API: <code style={codeSt}>{baseUrl}</code></li>
                        <li>
                            A pointer to <strong>View API reference</strong> at the top of this page — that panel lists every
                            command their software can send, with examples they can paste straight into their code.
                        </li>
                    </ul>
                </Section>

                <Section n="5" title="Check that it is working">
                    <p style={pSt}>
                        Once the other system starts sending documents, its card in the list below fills in on its own:
                    </p>
                    <ul style={listSt}>
                        <li><strong>Requests</strong> — how many times it has contacted the DMS in total. Still 0? It has never connected.</li>
                        <li><strong>Last used</strong> — when it last called, and from which IP address.</li>
                        <li><strong>Documents created</strong> — how many documents it has filed. Click <strong>View documents in DMS</strong> to see them.</li>
                    </ul>
                </Section>

                <Section n="6" title="Managing an application later">
                    <dl style={{ margin: 0 }}>
                        <Term word="Edit">
                            Change the name, owner, permissions, rate limit or IP list. The token keeps working — nobody
                            has to update anything on their side.
                        </Term>
                        <Term word="Regenerate token">
                            Issues a brand new token and kills the old one instantly. Use it when a token may have leaked,
                            when it was lost, or when the person who held it leaves. <strong>The other system stops working
                            until the developer installs the new token</strong>, so warn them first.
                        </Term>
                        <Term word="Disable">
                            A pause button. The application and its history stay, but every call is refused until you press
                            Enable again. This is the right choice when something looks wrong and you are not sure yet.
                        </Term>
                        <Term word="Delete">
                            Removes the application and its token for good. Documents it already created stay in the DMS.
                            Prefer Disable unless you are certain.
                        </Term>
                    </dl>
                </Section>

                <Section n="7" title="When the developer reports an error">
                    <p style={pSt}>
                        They will quote a three-digit number. Here is what each one means on your side of the fence:
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableSt}>
                            <tbody>
                                <Row code="401" meaning="The token is wrong, missing, or was replaced.">
                                    Confirm they are using the newest token. If unsure, regenerate and send it again.
                                </Row>
                                <Row code="403" meaning="Recognised, but not allowed to do that.">
                                    Either a permission is not ticked, the application is Disabled, or their server’s IP
                                    address is not in the allowlist.
                                </Row>
                                <Row code="422" meaning="The document details they sent are incomplete or invalid.">
                                    This one is theirs to fix — the reply says which field is wrong. Fields come from
                                    Settings → Document Form, so it also changes if you edit that form.
                                </Row>
                                <Row code="429" meaning="They exceeded the rate limit.">
                                    Their system is calling too often. Ask why, then raise the rate limit with Edit if the
                                    volume is genuine.
                                </Row>
                            </tbody>
                        </table>
                    </div>
                </Section>

                <Section n="8" title="Words you will hear">
                    <dl style={{ margin: 0 }}>
                        <Term word="API">
                            A doorway built for software rather than for people. Same DMS, no screen — one program talking
                            to another.
                        </Term>
                        <Term word="Token">
                            A long secret password that identifies an application instead of a person.
                        </Term>
                        <Term word="Endpoint">
                            One specific command the other system can send, such as “create a document”.
                        </Term>
                        <Term word="Request">
                            One single call from the other system to the DMS.
                        </Term>
                        <Term word="IP address">
                            The return address of a computer on the internet.
                        </Term>
                    </dl>
                </Section>

                <Note>
                    Golden rule: a token is a key, not a setting. Anything that changes who holds a key —
                    a person leaving, a laptop lost, a token pasted somewhere public — is a reason to regenerate it.
                </Note>
            </div>
        </div>
    );
}

function Section({ n, title, children }) {
    return (
        <section style={{ marginTop: '1.4rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>
                <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: '#eef2ff', color: '#4f46e5',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700,
                }}>
                    {n}
                </span>
                {title}
            </h3>
            {children}
        </section>
    );
}

function Term({ word, children }) {
    return (
        <div style={{ display: 'flex', gap: 10, padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
            <dt style={{ flex: '0 0 170px', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{word}</dt>
            <dd style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.55 }}>{children}</dd>
        </div>
    );
}

function Row({ code, meaning, children }) {
    return (
        <tr>
            <td style={{ ...tdSt, width: 56 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', fontWeight: 700, color: '#b45309' }}>{code}</span>
            </td>
            <td style={{ ...tdSt, color: '#334155', fontWeight: 500, width: '32%' }}>{meaning}</td>
            <td style={{ ...tdSt, color: '#64748b' }}>{children}</td>
        </tr>
    );
}

function Note({ tone = 'default', children }) {
    const tones = {
        default: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569' },
        warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
    }[tone];

    return (
        <p style={{
            background: tones.bg, border: `1px solid ${tones.border}`, color: tones.color,
            borderRadius: 8, padding: '0.65rem 0.85rem', fontSize: '0.8rem', lineHeight: 1.55, marginTop: '0.8rem',
        }}>
            {children}
        </p>
    );
}

const cardSt     = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem' };
const cardHeadSt = { padding: '0.85rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' };
const leadSt     = { fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 };
const pSt        = { fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, marginBottom: '0.5rem' };
const listSt     = { fontSize: '0.82rem', color: '#475569', lineHeight: 1.7, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: 4 };
const tableSt    = { width: '100%', borderCollapse: 'collapse', minWidth: 480 };
const tdSt       = { padding: '0.5rem 0.7rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', textAlign: 'left', verticalAlign: 'top', lineHeight: 1.5 };
const codeSt     = { fontFamily: 'monospace', fontSize: '0.76rem', background: '#f1f5f9', borderRadius: 4, padding: '0.1rem 0.35rem', color: '#0f172a' };
const tourBtnSt  = { marginTop: '0.9rem', padding: '0.45rem 0.9rem', fontSize: '0.8rem', fontWeight: 500, border: '1px solid #c7d2fe', borderRadius: 6, background: '#eef2ff', color: '#4f46e5', cursor: 'pointer' };
