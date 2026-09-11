import { useResponsive } from '@/hooks/useResponsive';

// export default function DocumentFilter({ filters, onChange, onClear, documentTypes = [] }) {
export default function DocumentFilter({ filters, onChange, onClear, onAddNew, documentTypes = [] }) {
    const { isMobile } = useResponsive();

    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1rem' }}>
            <div style={{ padding: '0.85rem 1rem' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    flexWrap: 'wrap',
                    gap: '0.6rem',
                    alignItems: isMobile ? 'stretch' : 'center',
                }}>
                    {/* Label search */}
                    <div style={{ display: 'flex', alignItems: 'center', flex: isMobile ? undefined : 1, minWidth: isMobile ? undefined : 160, border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', color: '#94a3b8', flexShrink: 0 }}>
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            value={filters.label}
                            onChange={e => onChange('label', e.target.value)}
                            placeholder="Search label…"
                            style={{ flex: 1, padding: '0.45rem 0.5rem', fontSize: '0.85rem', outline: 'none', border: 'none', color: '#1e293b', minWidth: 0 }}
                        />
                    </div>

                    {/* Document Class filter */}
                    <select
                        value={filters.type}
                        onChange={e => onChange('type', e.target.value)}
                        style={{ flex: isMobile ? undefined : 1, minWidth: isMobile ? undefined : 140, padding: '0.47rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', background: '#fff' }}
                    >
                        <option value="">All Classes</option>
                        {documentTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>

                    {/* text search + action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flex: isMobile ? undefined : 1 }}>
                        <input
                            type="text"
                            value={filters.owner}
                            onChange={e => onChange('owner', e.target.value)}
                            placeholder="Filter by owner…"
                            style={{ flex: 1, padding: '0.47rem 0.75rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 6, color: '#1e293b', outline: 'none', minWidth: 0 }}
                        />
                        <button
                            onClick={onClear}
                            style={{ padding: '0.47rem 0.85rem', fontSize: '0.82rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                            Clear
                        </button>
                        {/* <button
                            onClick={onClear}
                            style={{ padding: '0.47rem 0.85rem', fontSize: '0.82rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#6366f1', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                            Add New Document
                        </button> */}
                        {onAddNew && (
                            <button
                                onClick={onAddNew}
                                style={{ padding: '0.47rem 0.85rem', fontSize: '0.82rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#6366f1', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 500 }}
                            >
                                Add New Document
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SearchIcon() {
    return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>;
}