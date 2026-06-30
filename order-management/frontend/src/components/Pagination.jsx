export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        {from}–{to} of {total} orders
      </span>
      <div style={{ display: 'flex', gap: '6px' }}>
        <PageBtn label="← Prev" disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
            acc.push(p);
            return acc;
          }, [])
          .map((item, i) =>
            item === '…' ? (
              <span key={`ellipsis-${i}`} style={{ padding: '6px 4px', color: 'var(--text-muted)' }}>
                …
              </span>
            ) : (
              <PageBtn key={item} label={item} active={item === page} onClick={() => onPageChange(item)} />
            )
          )}
        <PageBtn label="Next →" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} />
      </div>
    </div>
  );
}

function PageBtn({ label, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        fontSize: '12px',
        fontFamily: 'var(--font-mono)',
        background: active ? 'var(--accent-dim)' : 'var(--surface-raised)',
        color: active ? 'var(--accent)' : disabled ? 'var(--text-muted)' : 'var(--text-primary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}
