// Centralized order status enum and the allowed flow between them.
// Keeping this in one place avoids magic strings scattered across the codebase
// and makes the status flow easy to audit/extend.

const ORDER_STATUS = Object.freeze({
  PLACED: 'PLACED',
  PROCESSING: 'PROCESSING',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

// Defines which automatic transitions the scheduler is allowed to perform,
// and after how many minutes of being in that status the transition should fire.
// Values are read from env with sane fallbacks so timing can be tuned without code changes.
const AUTO_TRANSITIONS = [
  {
    from: ORDER_STATUS.PLACED,
    to: ORDER_STATUS.PROCESSING,
    afterMinutes: Number(process.env.PLACED_TO_PROCESSING_MINUTES) || 10,
  },
  {
    from: ORDER_STATUS.PROCESSING,
    to: ORDER_STATUS.READY_TO_SHIP,
    afterMinutes: Number(process.env.PROCESSING_TO_READY_MINUTES) || 20,
  },
];

const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);
const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  AUTO_TRANSITIONS,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
};
