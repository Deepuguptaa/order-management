import { useState } from 'react';
import { createOrder } from '../api/client';

const INITIAL_FORM = {
  customerName: '',
  phoneNumber: '',
  productName: '',
  amount: '',
  paymentStatus: 'PENDING',
};

export default function CreateOrderModal({ onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      // Generate a client-side idempotency key to prevent double-submit
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await createOrder({ ...form, amount: Number(form.amount), idempotencyKey });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface-raised)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '9px 12px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '28px',
          width: '100%',
          maxWidth: '440px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-display)' }}>New Order</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '20px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { name: 'customerName', label: 'Customer Name', type: 'text' },
            { name: 'phoneNumber', label: 'Phone Number', type: 'tel' },
            { name: 'productName', label: 'Product Name', type: 'text' },
            { name: 'amount', label: 'Amount (₹)', type: 'number' },
          ].map(({ name, label, type }) => (
            <div key={name}>
              <label style={labelStyle}>{label}</label>
              <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                style={inputStyle}
                min={type === 'number' ? 0 : undefined}
              />
            </div>
          ))}

          <div>
            <label style={labelStyle}>Payment Status</label>
            <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange} style={inputStyle}>
              {['PENDING', 'PAID', 'FAILED'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p
            style={{
              marginTop: '16px',
              marginBottom: 0,
              padding: '10px 14px',
              background: 'var(--danger-dim)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              fontSize: '13px',
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '9px 18px',
              background: isSubmitting ? 'var(--accent-dim)' : 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#0f1115',
              fontWeight: 700,
              cursor: isSubmitting ? 'default' : 'pointer',
              fontSize: '13px',
            }}
          >
            {isSubmitting ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
