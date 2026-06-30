const Order = require('../models/Order');
const SchedulerLog = require('../models/SchedulerLog');
const { AUTO_TRANSITIONS } = require('../config/constants');

/**
 * Runs one pass of the scheduler: for every configured auto-transition rule,
 * finds orders that have been sitting in `from` status longer than
 * `afterMinutes`, and atomically advances them to `to` status.
 *
 * Race-condition handling:
 * We use findOneAndUpdate with the status as part of the query filter
 * (not just the _id). This makes the read-check-write a single atomic
 * Mongo operation. If two scheduler runs overlap (e.g. a slow run plus a
 * manually triggered run), the second one will simply find zero matching
 * documents for an order already transitioned, instead of double-applying
 * the update. This is the same pattern as optimistic locking via a
 * conditional WHERE clause in SQL.
 *
 * @param {('CRON'|'MANUAL')} triggeredBy
 */
async function runStatusTransitionJob(triggeredBy = 'CRON') {
  const startTime = Date.now();
  let ordersScanned = 0;
  let ordersUpdated = 0;
  const transitions = [];
  let logStatus = 'SUCCESS';
  let errorMessage = null;

  try {
    for (const rule of AUTO_TRANSITIONS) {
      const cutoff = new Date(Date.now() - rule.afterMinutes * 60 * 1000);

      // Find candidates first just to count "scanned" for the log; the actual
      // mutation still goes through the atomic findOneAndUpdate below per order.
      const candidates = await Order.find({
        status: rule.from,
        statusUpdatedAt: { $lte: cutoff },
      }).select('_id orderId status');

      ordersScanned += candidates.length;

      for (const candidate of candidates) {
        // Atomic conditional update: only succeeds if the order is STILL in
        // `rule.from` status at the moment of the write. Prevents two
        // concurrent scheduler runs from both transitioning the same order.
        const updated = await Order.findOneAndUpdate(
          { _id: candidate._id, status: rule.from },
          {
            $set: {
              status: rule.to,
              statusUpdatedAt: new Date(),
            },
            $push: {
              statusHistory: {
                status: rule.to,
                changedAt: new Date(),
                changedBy: 'SYSTEM',
                note: `Auto-transitioned after ${rule.afterMinutes} minutes in ${rule.from}`,
              },
            },
          },
          { new: true }
        );

        if (updated) {
          ordersUpdated += 1;
          transitions.push({
            orderId: updated.orderId,
            fromStatus: rule.from,
            toStatus: rule.to,
          });
        }
      }
    }
  } catch (err) {
    logStatus = 'FAILURE';
    errorMessage = err.message;
    console.error('Scheduler job failed:', err);
  }

  if (logStatus === 'SUCCESS' && ordersScanned > ordersUpdated) {
    // Some orders were scanned but not updated (e.g. lost a race to another
    // run). Not a failure, but worth flagging distinctly in the log.
    logStatus = ordersUpdated > 0 ? 'PARTIAL_FAILURE' : logStatus;
  }

  const durationMs = Date.now() - startTime;

  const log = await SchedulerLog.create({
    runAt: new Date(startTime),
    status: errorMessage ? 'FAILURE' : 'SUCCESS',
    ordersScanned,
    ordersUpdated,
    transitions,
    durationMs,
    errorMessage,
    triggeredBy,
  });

  return log;
}

module.exports = { runStatusTransitionJob };
