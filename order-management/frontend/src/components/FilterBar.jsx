import { ORDER_STATUSES } from '../constants/orderStatus';

export default function FilterBar({
  status,
  onStatusChange,
  search,
  onSearchChange,
  onRefresh,
  isRefreshing,
  lastUpdatedAt,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '20px',
      }}
    >
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        aria-label="Filter by status"
        style={{
          background: 'var(--surface-raised)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
        }}
      >
        <option value="">All statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, ' ')}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by order ID or customer name"
        aria-label="Search orders"
        style={{
          background: 'var(--surface-raised)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: '13px',
          minWidth: '260px',
          flex: '1 1 260px',
        }}
      />

      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        style={{
          background: isRefreshing ? 'var(--surface-raised)' : 'var(--accent-dim)',
          color: isRefreshing ? 'var(--text-muted)' : 'var(--accent)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: isRefreshing ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transform: isRefreshing ? 'rotate(360deg)' : 'none',
            transition: 'transform 0.6s linear',
          }}
        >
          ↻
        </span>
        {isRefreshing ? 'Refreshing…' : 'Refresh'}
      </button>

      {lastUpdatedAt && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Updated {lastUpdatedAt.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
