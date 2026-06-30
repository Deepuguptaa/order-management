const crypto = require('crypto');

/**
 * Generates a human-readable, sortable order ID, e.g. ORD-20260630-7F3K9A
 * Date prefix makes IDs roughly sortable/searchable by day; the random suffix
 * keeps collision probability negligible without needing a DB round-trip
 * to compute a sequence number (which would also create a write hotspot).
 */
function generateOrderId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

module.exports = generateOrderId;
