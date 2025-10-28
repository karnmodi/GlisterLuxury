const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analytics.controller');

// Protect all routes - admin only
router.use(protect);
router.use(authorize('admin'));

// Dashboard summary
router.get('/dashboard', analyticsController.getDashboardSummary);

// Detailed analytics
router.get('/visits', analyticsController.getWebsiteVisits);
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/products', analyticsController.getProductAnalytics);
router.get('/users', analyticsController.getUserAnalytics);
router.get('/orders', analyticsController.getOrderAnalytics);
router.get('/conversions', analyticsController.getConversionAnalytics);

// Historical data
router.get('/historical', analyticsController.getHistoricalData);

// Manual aggregation trigger
router.post('/aggregate', analyticsController.triggerDailyAggregation);

module.exports = router;

