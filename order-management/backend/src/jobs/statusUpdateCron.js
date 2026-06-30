const cron = require('node-cron');
const { runStatusTransitionJob } = require('../services/schedulerService');

/**
 * Registers an in-process cron job that runs every 5 minutes.
 *
 * This is the "local cron job for testing" option from the assignment.
 * For production, the recommended approach is to disable this in-process
 * job and instead point an external scheduler (Render Cron Job / GitHub
 * Actions cron / Google Cloud Scheduler) at POST /api/scheduler/run-status-update
 * with the x-scheduler-key header. This avoids relying on a long-running
 * Node process to be the sole source of truth for timing, and works with
 * serverless/ephemeral deployments.
 *
 * Toggle via ENABLE_INTERNAL_CRON=true|false in .env (defaults to true).
 */
function startInternalScheduler() {
  const enabled = process.env.ENABLE_INTERNAL_CRON !== 'false';

  if (!enabled) {
    console.log('Internal cron scheduler is disabled (ENABLE_INTERNAL_CRON=false)');
    return;
  }

  // Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled status update job...`);
    try {
      const log = await runStatusTransitionJob('CRON');
      console.log(
        `[${new Date().toISOString()}] Scheduler run complete: scanned=${log.ordersScanned} updated=${log.ordersUpdated} status=${log.status}`
      );
    } catch (err) {
      console.error('Scheduled job threw an unhandled error:', err);
    }
  });

  console.log('Internal cron scheduler registered: running every 5 minutes');
}

module.exports = startInternalScheduler;
