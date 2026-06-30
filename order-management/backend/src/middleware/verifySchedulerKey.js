/**
 * Protects the scheduler trigger endpoint with a shared-secret header.
 * This is intentionally simple (a static secret, not full auth) since the
 * scheduler endpoint is meant to be called only by a trusted cron service,
 * not end users. The secret should be long, random, and stored only in env vars.
 *
 * Expected header: x-scheduler-key: <SCHEDULER_SECRET_KEY>
 */
function verifySchedulerKey(req, res, next) {
  const providedKey = req.headers['x-scheduler-key'];
  const expectedKey = process.env.SCHEDULER_SECRET_KEY;

  if (!expectedKey) {
    console.error('SCHEDULER_SECRET_KEY is not configured on the server');
    return res.status(500).json({
      success: false,
      message: 'Scheduler is not configured correctly on the server',
    });
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: invalid or missing scheduler key',
    });
  }

  next();
}

module.exports = verifySchedulerKey;
