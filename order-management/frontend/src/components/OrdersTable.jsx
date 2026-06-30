import StatusBadge from './StatusBadge';
import { STATUS_COLORS, PAYMENT_STATUS_COLORS } from '../constants/orderStatus';

const COLUMNS = [
  { key: 'orderId', label: 'Order ID' },
  { key: 'customerName', label: 'Customer' },
  { key: 'phoneNumber', label: 'Phone' },
  { key: 'productName', label: 'Product' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'paymentStatus', label: 'Payment' },
  { key: 'createdTime', label: 'Created' },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SkeletonRow() {
  return (
    <tr>
      {COLUMNS.map((col) => (
        <td key={col.key} style={{ padding: '14px 16px' }}>
          <div
            style={{
              height: '14px',
              borderRadius: '4px',
              background: 'var(--surface-raised)',
              width: '70%',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function OrdersTable({ orders, isLoading, error, onRetry }) {
  if (error) {
    return (
      <div
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          background: 'var(--danger-dim)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--danger)',
        }}
      >
        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Couldn't load orders</p>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{error}</p>
        <button
          onClick={onRetry}
          style={{
            background: 'transparent',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!isLoading && orders.length === 0) {
    return (
      <div
        style={{
          padding: '60px 24px',
          textAlign: 'center',
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--text-primary)' }}>No orders found</p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Try a different status filter or search term, or create a new order.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : orders.map((order) => (
                <tr
                  key={order.orderId}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                    {order.orderId}
                  </td>
                  <td style={{ padding: '14px 16px' }}>{order.customerName}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{order.phoneNumber}</td>
                  <td style={{ padding: '14px 16px' }}>{order.productName}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(order.amount)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={order.status} colorMap={STATUS_COLORS} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={order.paymentStatus} colorMap={PAYMENT_STATUS_COLORS} />
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {formatDate(order.createdTime)}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
