export const ORDER_STATUSES = [
  'PLACED',
  'PROCESSING',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export const STATUS_COLORS = {
  PLACED: { fg: '#5b9dd9', bg: '#1f3247' },
  PROCESSING: { fg: '#e3b341', bg: '#3d3320' },
  READY_TO_SHIP: { fg: '#4fd1a5', bg: '#2d5f4d' },
  SHIPPED: { fg: '#b18cd9', bg: '#332447' },
  DELIVERED: { fg: '#4fd1a5', bg: '#1f3d33' },
  CANCELLED: { fg: '#e8635f', bg: '#3d2524' },
};

export const PAYMENT_STATUS_COLORS = {
  PENDING: { fg: '#e3b341', bg: '#3d3320' },
  PAID: { fg: '#4fd1a5', bg: '#2d5f4d' },
  FAILED: { fg: '#e8635f', bg: '#3d2524' },
  REFUNDED: { fg: '#8b92a3', bg: '#2a2f3a' },
};
