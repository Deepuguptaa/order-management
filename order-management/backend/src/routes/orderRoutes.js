const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { createOrder, getOrders, getOrderById, updateOrder } = require('../controllers/orderController');

const router = express.Router();

router.post('/', asyncHandler(createOrder));
router.get('/', asyncHandler(getOrders));
router.get('/:orderId', asyncHandler(getOrderById));
router.patch('/:orderId', asyncHandler(updateOrder));

module.exports = router;
