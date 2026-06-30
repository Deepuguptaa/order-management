const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const verifySchedulerKey = require('../middleware/verifySchedulerKey');
const { triggerStatusUpdate, getSchedulerLogs } = require('../controllers/schedulerController');

const router = express.Router();

// Protected: only callable with a valid x-scheduler-key header
router.post('/run-status-update', verifySchedulerKey, asyncHandler(triggerStatusUpdate));

// Logs are read-only and safe to expose to the dashboard without the scheduler key
router.get('/logs', asyncHandler(getSchedulerLogs));

module.exports = router;
