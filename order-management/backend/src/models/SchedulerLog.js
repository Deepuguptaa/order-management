const mongoose = require('mongoose');

// Records every scheduler run, regardless of outcome. This is what powers the
// "scheduler logs" view and lets us debug missed/failed runs after the fact.
const schedulerLogSchema = new mongoose.Schema(
  {
    runAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PARTIAL_FAILURE', 'FAILURE'],
      required: true,
    },
    ordersScanned: {
      type: Number,
      default: 0,
    },
    ordersUpdated: {
      type: Number,
      default: 0,
    },
    // Per-order breakdown of what transitioned, useful for debugging.
    transitions: [
      {
        orderId: String,
        fromStatus: String,
        toStatus: String,
        _id: false,
      },
    ],
    durationMs: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    // Distinguishes a run fired by the cron schedule vs an authenticated manual trigger.
    triggeredBy: {
      type: String,
      enum: ['CRON', 'MANUAL'],
      default: 'CRON',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SchedulerLog', schedulerLogSchema);
