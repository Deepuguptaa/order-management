const Order = require('../models/Order');
const generateOrderId = require('../utils/generateOrderId');
const { ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES, ORDER_STATUS } = require('../config/constants');

/**
 * POST /api/orders
 * Creates a new order. Duplicate prevention:
 *  - If the client supplies an `idempotencyKey` (recommended for retry-safe
 *    submission from the frontend, e.g. a UUID generated on form open), the
 *    unique index on that field rejects duplicate submissions at the DB level.
 *  - orderId is always generated server-side, never trusted from the client,
 *    eliminating client-side ID collisions entirely.
 */
async function createOrder(req, res) {
  const { customerName, phoneNumber, productName, amount, paymentStatus, idempotencyKey } = req.body;

  if (!customerName || !phoneNumber || !productName || amount === undefined) {
    return res.status(400).json({
      success: false,
      message: 'customerName, phoneNumber, productName, and amount are required',
    });
  }

  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Order already exists for this idempotency key',
        data: existing,
      });
    }
  }

  const orderId = generateOrderId();
  const now = new Date();

  const order = await Order.create({
    orderId,
    customerName,
    phoneNumber,
    productName,
    amount,
    paymentStatus: paymentStatus || undefined,
    status: ORDER_STATUS.PLACED,
    statusUpdatedAt: now,
    idempotencyKey: idempotencyKey || undefined,
    statusHistory: [
      {
        status: ORDER_STATUS.PLACED,
        changedAt: now,
        changedBy: 'USER',
        note: 'Order created',
      },
    ],
  });

  return res.status(201).json({ success: true, data: order });
}

/**
 * GET /api/orders?status=PLACED&page=1&limit=20&search=foo
 * Lists orders with optional status filter, search, and pagination.
 */
async function getOrders(req, res) {
  const { status, search, page = 1, limit = 20 } = req.query;

  const query = {};

  if (status) {
    if (!ORDER_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status filter. Must be one of: ${ORDER_STATUS_VALUES.join(', ')}`,
      });
    }
    query.status = status;
  }

  if (search) {
    // Search by orderId or customerName (case-insensitive partial match)
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdTime: -1 }).skip(skip).limit(limitNum),
    Order.countDocuments(query),
  ]);

  return res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
}

/**
 * GET /api/orders/:orderId
 */
async function getOrderById(req, res) {
  const order = await Order.findOne({ orderId: req.params.orderId });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  return res.status(200).json({ success: true, data: order });
}

/**
 * PATCH /api/orders/:orderId
 * Manual status / payment status update. Appends to status history when
 * status changes, and resets statusUpdatedAt so the scheduler's timer restarts.
 */
async function updateOrder(req, res) {
  const { status, paymentStatus } = req.body;

  if (status && !ORDER_STATUS_VALUES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${ORDER_STATUS_VALUES.join(', ')}`,
    });
  }

  if (paymentStatus && !PAYMENT_STATUS_VALUES.includes(paymentStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid paymentStatus. Must be one of: ${PAYMENT_STATUS_VALUES.join(', ')}`,
    });
  }

  const order = await Order.findOne({ orderId: req.params.orderId });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (status && status !== order.status) {
    order.status = status;
    order.statusUpdatedAt = new Date();
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: 'USER',
      note: 'Manually updated via API',
    });
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  await order.save();

  return res.status(200).json({ success: true, data: order });
}

module.exports = { createOrder, getOrders, getOrderById, updateOrder };
