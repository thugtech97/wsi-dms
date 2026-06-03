const VARIANTS = {
    Contract:         { bg: '#eef2ff', color: '#4f46e5' },
    Invoice:          { bg: '#f0fdf4', color: '#16a34a' },
    'Legal Agreement':{ bg: '#fffbeb', color: '#d97706' },
    'HR Document':    { bg: '#f1f5f9', color: '#475569' },
};

export default function Badge({ type }) {
    const style = VARIANTS[type] ?? { bg: '#f1f5f9', color: '#475569' };
    return (
        <span style={{
            background: style.bg,
            color: style.color,
            fontWeight: 500,
            padding: '0.3rem 0.55rem',
            borderRadius: 4,
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
        }}>
            {type}
        </span>
    );
}
