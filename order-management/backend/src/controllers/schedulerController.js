const { runStatusTransitionJob } = require('../services/schedulerService');
const SchedulerLog = require('../models/SchedulerLog');

/**
 * POST /api/scheduler/run-status-update
 * Protected by verifySchedulerKey middleware. Intended to be called by an
 * external cron service (or node-cron internally) every 5 minutes.
 */
async function triggerStatusUpdate(req, res) {
  const log = await runStatusTransitionJob('MANUAL');
  return res.status(200).json({ success: true, data: log });
}

/**
 * GET /api/scheduler/logs?page=1&limit=20
 * Returns recent scheduler execution logs, newest first.
 */
async function getSchedulerLogs(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    SchedulerLog.find().sort({ runAt: -1 }).skip(skip).limit(limitNum),
    SchedulerLog.countDocuments(),
  ]);

  return res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
}

module.exports = { triggerStatusUpdate, getSchedulerLogs };
