const mongoose = require('mongoose');
const { ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES, ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

// Embedded sub-document: every status change (manual or scheduler-driven) is
// appended here. This gives a full audit trail per order without needing a
// separate collection + join for the common case of "show me this order's history".
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      // 'SYSTEM' for scheduler-driven transitions, 'USER' for manual API calls
      type: String,
      enum: ['SYSTEM', 'USER'],
      default: 'USER',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Human-friendly, unique, sequential-looking order ID separate from Mongo's _id.
    // Generated server-side to guarantee uniqueness and prevent client-supplied duplicates.
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUS.PENDING,
    },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: ORDER_STATUS.PLACED,
      index: true,
    },
    // Timestamp the current status was entered. Used by the scheduler to decide
    // whether an order has been "sitting" in its current status long enough to transition.
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    // Idempotency key supplied by the client (or derived) to prevent duplicate
    // order creation on retry (e.g. double-submit from a flaky network).
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'createdTime', updatedAt: 'updatedTime' },
  }
);

// Compound index to make "filter by status, sorted by newest" fast — the
// dashboard's primary query pattern.
orderSchema.index({ status: 1, createdTime: -1 });

module.exports = mongoose.model('Order', orderSchema);
