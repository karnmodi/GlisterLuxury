const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
	createOrder,
	getOrders,
	getOrderById,
	requestRefund,
	getOrderStats,
	updateOrderStatus,
	getAllOrders,
	getOrderByIdAdmin,
	addAdminMessage,
	updatePaymentStatus
} = require('../controllers/orders.controller');

// Protected routes (require authentication)
router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/stats', protect, getOrderStats);
router.get('/:orderId', protect, getOrderById);
router.put('/:orderId/refund', protect, requestRefund);

// Admin only routes
router.get('/admin/all', protect, authorize('admin'), getAllOrders);
router.get('/admin/:orderId', protect, authorize('admin'), getOrderByIdAdmin);
router.put('/:orderId/status', protect, authorize('admin'), updateOrderStatus);
router.post('/:orderId/admin-message', protect, authorize('admin'), addAdminMessage);
router.put('/:orderId/payment-status', protect, authorize('admin'), updatePaymentStatus);

module.exports = router;

