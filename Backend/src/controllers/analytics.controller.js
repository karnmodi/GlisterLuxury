const WebsiteVisit = require('../models/WebsiteVisit');
const AnalyticsSummary = require('../models/AnalyticsSummary');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Category = require('../models/Category');
const { aggregateDailyMetrics } = require('../utils/analyticsAggregator');

/**
 * Simple in-memory cache with TTL
 */
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
	const cached = cache.get(key);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.data;
	}
	return null;
};

const setCachedData = (key, data) => {
	cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Get date ranges for today, this week, this month
 */
const getDateRanges = () => {
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	
	return { todayStart, weekStart, monthStart };
};

/**
 * Convert Decimal128 to float
 */
const toFloat = (decimal) => {
	if (!decimal) return 0;
	return parseFloat(decimal.toString());
};

/**
 * Get dashboard summary with today, weekly, and monthly stats (REAL-TIME)
 */
exports.getDashboardSummary = async (req, res) => {
	try {
		// Check cache first
		const cacheKey = 'dashboard:summary';
		const cached = getCachedData(cacheKey);
		if (cached) {
			return res.json({ success: true, data: cached, cached: true });
		}

		const { todayStart, weekStart, monthStart } = getDateRanges();
		
		// Get ALL metrics in real-time from raw collections
		const [
			// Today's metrics
			todayPageViews,
			todayUniqueSessions,
			todayOrders,
			todayRevenue,
			todayRegistrations,
			// Weekly metrics
			weeklyPageViews,
			weeklyUniqueSessions,
			weeklyOrders,
			weeklyRevenue,
			weeklyRegistrations,
			// Monthly metrics
			monthlyPageViews,
			monthlyOrders,
			monthlyRevenue,
			monthlyRegistrations,
			// Totals
			totalUsers,
			totalOrders,
			totalProducts,
			// Conversion data
			weeklyCarts
		] = await Promise.all([
			// TODAY
			WebsiteVisit.countDocuments({ timestamp: { $gte: todayStart } }),
			WebsiteVisit.distinct('sessionID', { timestamp: { $gte: todayStart } }).then(arr => arr.length),
			Order.countDocuments({ createdAt: { $gte: todayStart } }),
			Order.aggregate([
				{ $match: { createdAt: { $gte: todayStart }, 'paymentInfo.status': 'paid' } },
				{ $group: { _id: null, total: { $sum: { $toDouble: '$pricing.total' } } } }
			]),
			User.countDocuments({ createdAt: { $gte: todayStart } }),
			
			// WEEKLY
			WebsiteVisit.countDocuments({ timestamp: { $gte: weekStart } }),
			WebsiteVisit.distinct('sessionID', { timestamp: { $gte: weekStart } }).then(arr => arr.length),
			Order.countDocuments({ createdAt: { $gte: weekStart } }),
			Order.aggregate([
				{ $match: { createdAt: { $gte: weekStart }, 'paymentInfo.status': 'paid' } },
				{ $group: { _id: null, total: { $sum: { $toDouble: '$pricing.total' } } } }
			]),
			User.countDocuments({ createdAt: { $gte: weekStart } }),
			
			// MONTHLY
			WebsiteVisit.countDocuments({ timestamp: { $gte: monthStart } }),
			Order.countDocuments({ createdAt: { $gte: monthStart } }),
			Order.aggregate([
				{ $match: { createdAt: { $gte: monthStart }, 'paymentInfo.status': 'paid' } },
				{ $group: { _id: null, total: { $sum: { $toDouble: '$pricing.total' } } } }
			]),
			User.countDocuments({ createdAt: { $gte: monthStart } }),
			
			// TOTALS
			User.countDocuments(),
			Order.countDocuments(),
			Product.countDocuments(),
			
			// CONVERSION
			Cart.countDocuments({ createdAt: { $gte: weekStart } })
		]);
		
		const weeklyConversionRate = weeklyCarts > 0 
			? ((weeklyOrders / weeklyCarts) * 100).toFixed(2)
			: 0;
		
		const result = {
			today: {
				pageViews: todayPageViews,
				uniqueVisitors: todayUniqueSessions,
				orders: todayOrders,
				revenue: todayRevenue[0]?.total || 0,
				registrations: todayRegistrations
			},
			weekly: {
				pageViews: weeklyPageViews,
				uniqueVisitors: weeklyUniqueSessions,
				orders: weeklyOrders,
				revenue: weeklyRevenue[0]?.total || 0,
				registrations: weeklyRegistrations,
				conversionRate: weeklyConversionRate
			},
			monthly: {
				pageViews: monthlyPageViews,
				orders: monthlyOrders,
				revenue: monthlyRevenue[0]?.total || 0,
				registrations: monthlyRegistrations
			},
			totals: {
				users: totalUsers,
				orders: totalOrders,
				products: totalProducts
			}
		};
		
		// Cache the result
		setCachedData(cacheKey, result);
		
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error getting dashboard summary:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching dashboard summary',
			error: error.message
		});
	}
};

/**
 * Get website visit analytics (REAL-TIME)
 */
exports.getWebsiteVisits = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		end.setHours(23, 59, 59, 999);

		// Cache key based on date range
		const cacheKey = `visits:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;
		const cached = getCachedData(cacheKey);
		if (cached) {
			return res.json({ success: true, data: cached, cached: true });
		}
		
		// Get time series data grouped by day (exclude admin pages)
		const timeSeries = await WebsiteVisit.aggregate([
			{ 
				$match: { 
					timestamp: { $gte: start, $lte: end },
					page: { $not: { $regex: /^\/admin/ } } // Exclude admin pages
				} 
			},
			{
				$group: {
					_id: {
						$dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
					},
					pageViews: { $sum: 1 },
					uniqueSessions: { $addToSet: '$sessionID' }
				}
			},
			{
				$project: {
					date: '$_id',
					pageViews: 1,
					uniqueVisitors: { $size: '$uniqueSessions' },
					uniqueSessions: { $size: '$uniqueSessions' },
					_id: 0
				}
			},
			{ $sort: { date: 1 } }
		]);
		
		// Get top pages with product names for product detail pages
		const topPages = await WebsiteVisit.aggregate([
			{ 
				$match: { 
					timestamp: { $gte: start, $lte: end },
					page: { $not: { $regex: /^\/admin/ } } // Exclude admin pages
				} 
			},
			// Extract product ID from URL pattern /products/[id]
			{
				$addFields: {
					productId: {
						$cond: {
							if: { $regexMatch: { input: '$page', regex: /^\/products\/[a-fA-F0-9]{24}/ } },
							then: {
								$let: {
									vars: {
										parts: { $split: ['$page', '/'] },
										queryParts: { $split: ['$page', '?'] }
									},
									in: {
										$cond: {
											if: { $gte: [{ $size: '$$parts' }, 3] },
											then: {
												$arrayElemAt: [
													{ $split: [{ $arrayElemAt: ['$$queryParts', 0] }, '/'] },
													2
												]
											},
											else: null
										}
									}
								}
							},
							else: null
						}
					},
					originalPage: '$page'
				}
			},
			// Lookup product name if it's a product page
			{
				$lookup: {
					from: 'products',
					let: { 
						prodId: {
							$cond: {
								if: { $ne: ['$productId', null] },
								then: { 
									$convert: {
										input: '$productId',
										to: 'objectId',
										onError: null,
										onNull: null
									}
								},
								else: null
							}
						}
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$cond: {
										if: { $ne: ['$$prodId', null] },
										then: { $eq: ['$_id', '$$prodId'] },
										else: false
									}
								}
							}
						},
						{
							$project: {
								name: 1,
								_id: 0
							}
						}
					],
					as: 'productInfo'
				}
			},
			// Replace product ID with product name in page field
			{
				$addFields: {
					displayPage: {
						$cond: {
							if: { $and: [{ $ne: ['$productId', null] }, { $gt: [{ $size: '$productInfo' }, 0] }] },
							then: {
								$concat: ['/products/', { $arrayElemAt: ['$productInfo.name', 0] }]
							},
							else: '$originalPage'
						}
					}
				}
			},
			// Group by display page
			{
				$group: {
					_id: '$displayPage',
					count: { $sum: 1 },
					originalPage: { $first: '$originalPage' } // Keep original for reference
				}
			},
			{ $sort: { count: -1 } },
			{ $limit: 10 },
			{
				$project: {
					page: '$_id',
					views: '$count',
					originalPage: 1, // Keep for debugging if needed
					_id: 0
				}
			}
		]);
		
		// Get device breakdown (exclude admin pages)
		const devices = await WebsiteVisit.aggregate([
			{ 
				$match: { 
					timestamp: { $gte: start, $lte: end },
					page: { $not: { $regex: /^\/admin/ } } // Exclude admin pages
				} 
			},
			{ $group: { _id: '$deviceType', count: { $sum: 1 } } }
		]);
		
		const deviceBreakdown = {
			mobile: 0,
			tablet: 0,
			desktop: 0,
			unknown: 0
		};
		devices.forEach(d => {
			deviceBreakdown[d._id] = d.count;
		});
		
		const totalPageViews = timeSeries.reduce((sum, d) => sum + (d.pageViews || 0), 0);
		
		const result = {
			timeSeries: timeSeries || [],
			topPages: topPages || [],
			deviceBreakdown,
			summary: {
				totalPageViews,
				averageDaily: timeSeries.length > 0 
					? (totalPageViews / timeSeries.length).toFixed(0)
					: '0'
			}
		};

		setCachedData(cacheKey, result);
		
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error getting website visits:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching website visits',
			error: error.message
		});
	}
};

/**
 * Get revenue analytics (REAL-TIME)
 */
exports.getRevenueAnalytics = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		end.setHours(23, 59, 59, 999);

		const cacheKey = `revenue:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;
		const cached = getCachedData(cacheKey);
		if (cached) {
			return res.json({ success: true, data: cached, cached: true });
		}
		
		// Get time series data grouped by day
		const timeSeries = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end }, 'paymentInfo.status': 'paid' } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
					revenue: { $sum: { $toDouble: '$pricing.total' } },
					orders: { $sum: 1 }
				}
			},
			{
				$project: {
					date: '$_id',
					revenue: 1,
					orders: 1,
					averageOrderValue: { $divide: ['$revenue', '$orders'] },
					_id: 0
				}
			},
			{ $sort: { date: 1 } }
		]);
		
		// Get revenue by category
		const byCategory = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end }, 'paymentInfo.status': 'paid' } },
			{ $unwind: '$items' },
			{
				$lookup: {
					from: 'products',
					localField: 'items.product',
					foreignField: '_id',
					as: 'productInfo'
				}
			},
			{ $unwind: '$productInfo' },
			{
				$lookup: {
					from: 'categories',
					localField: 'productInfo.categoryID',
					foreignField: '_id',
					as: 'categoryInfo'
				}
			},
			{ $unwind: '$categoryInfo' },
			{
				$group: {
					_id: '$categoryInfo.name',
					revenue: { $sum: { $toDouble: '$items.totalPrice' } },
					orders: { $sum: 1 }
				}
			},
			{
				$project: {
					name: '$_id',
					revenue: 1,
					orders: 1,
					_id: 0
				}
			},
			{ $sort: { revenue: -1 } }
		]);
		
		// Get revenue by material (from product configurations)
		const byMaterial = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end }, 'paymentInfo.status': 'paid' } },
			{ $unwind: '$items' },
			{
				$group: {
					_id: '$items.selectedMaterial',
					revenue: { $sum: { $toDouble: '$items.totalPrice' } },
					quantity: { $sum: '$items.quantity' }
				}
			},
			{
				$project: {
					name: '$_id',
					revenue: 1,
					quantity: 1,
					_id: 0
				}
			},
			{ $sort: { revenue: -1 } }
		]);
		
		// Get revenue by finish
		const byFinish = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end }, 'paymentInfo.status': 'paid' } },
			{ $unwind: '$items' },
			{
				$group: {
					_id: '$items.selectedFinish',
					revenue: { $sum: { $toDouble: '$items.totalPrice' } },
					quantity: { $sum: '$items.quantity' }
				}
			},
			{
				$project: {
					name: '$_id',
					revenue: 1,
					quantity: 1,
					_id: 0
				}
			},
			{ $sort: { revenue: -1 } }
		]);
		
		const totalRevenue = timeSeries.reduce((sum, d) => sum + d.revenue, 0);
		const totalOrders = timeSeries.reduce((sum, d) => sum + d.orders, 0);
		
		const result = {
			timeSeries,
			byCategory,
			byMaterial: byMaterial.filter(m => m.name),
			byFinish: byFinish.filter(f => f.name),
			summary: {
				totalRevenue,
				totalOrders,
				averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
			}
		};

		setCachedData(cacheKey, result);
		
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error getting revenue analytics:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching revenue analytics',
			error: error.message
		});
	}
};

/**
 * Get product analytics (REAL-TIME)
 */
exports.getProductAnalytics = async (req, res) => {
	try {
		const { limit = 10 } = req.query;
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		const cacheKey = `products:${limit}`;
		const cached = getCachedData(cacheKey);
		if (cached) {
			return res.json({ success: true, data: cached, cached: true });
		}
		
		// Top selling products
		const topSelling = await Order.aggregate([
			{ $match: { 'paymentInfo.status': 'paid', createdAt: { $gte: thirtyDaysAgo } } },
			{ $unwind: '$items' },
			{
				$lookup: {
					from: 'products',
					localField: 'items.product',
					foreignField: '_id',
					as: 'productInfo'
				}
			},
			{ $unwind: '$productInfo' },
			{
				$group: {
					_id: '$productInfo._id',
					productName: { $first: '$productInfo.name' },
					quantitySold: { $sum: '$items.quantity' },
					revenue: { $sum: { $toDouble: '$items.totalPrice' } }
				}
			},
			{
				$project: {
					productID: '$_id',
					productName: 1,
					quantitySold: 1,
					revenue: 1,
					_id: 0
				}
			},
			{ $sort: { quantitySold: -1 } },
			{ $limit: parseInt(limit) }
		]);
		
		// Most viewed products
		const mostViewed = await WebsiteVisit.aggregate([
			{
				$match: {
					page: { $regex: '^/products/' },
					timestamp: { $gte: thirtyDaysAgo }
				}
			},
			{
				$addFields: {
					productIDStr: {
						$arrayElemAt: [
							{ $split: ['$page', '/'] },
							-1
						]
					}
				}
			},
			{
				$match: {
					productIDStr: { $regex: '^[0-9a-fA-F]{24}$' }
				}
			},
			{
				$addFields: {
					productIDObj: { $toObjectId: '$productIDStr' }
				}
			},
			{
				$group: {
					_id: '$productIDObj',
					views: { $sum: 1 }
				}
			},
			{
				$lookup: {
					from: 'products',
					localField: '_id',
					foreignField: '_id',
					as: 'productInfo'
				}
			},
			{ $unwind: '$productInfo' },
			{
				$project: {
					productID: '$_id',
					productName: '$productInfo.name',
					views: 1,
					_id: 0
				}
			},
			{ $sort: { views: -1 } },
			{ $limit: parseInt(limit) }
		]);
		
		// Most wishlisted products
		const mostWishlisted = await Wishlist.aggregate([
			{ $unwind: '$products' },
			{
				$group: {
					_id: '$products.product',
					wishlistCount: { $sum: 1 }
				}
			},
			{
				$lookup: {
					from: 'products',
					localField: '_id',
					foreignField: '_id',
					as: 'productInfo'
				}
			},
			{ $unwind: '$productInfo' },
			{
				$project: {
					productID: '$_id',
					productName: '$productInfo.name',
					wishlistCount: 1,
					_id: 0
				}
			},
			{ $sort: { wishlistCount: -1 } },
			{ $limit: parseInt(limit) }
		]);
		
		const result = {
			topSelling,
			mostViewed,
			mostWishlisted
		};

		setCachedData(cacheKey, result);
		
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error getting product analytics:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching product analytics',
			error: error.message
		});
	}
};

/**
 * Get user analytics (REAL-TIME)
 */
exports.getUserAnalytics = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		end.setHours(23, 59, 59, 999);

		const cacheKey = `users:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;
		const cached = getCachedData(cacheKey);
		if (cached) {
			return res.json({ success: true, data: cached, cached: true });
		}
		
		// Get time series data grouped by day
		const timeSeries = await User.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
					newRegistrations: { $sum: 1 }
				}
			},
			{
				$project: {
					date: '$_id',
					newRegistrations: 1,
					_id: 0
				}
			},
			{ $sort: { date: 1 } }
		]);
		
		// Get total users count
		const totalUsers = await User.countDocuments();
		
		// Add cumulative total users to each time series entry
		let runningTotal = await User.countDocuments({ createdAt: { $lt: start } });
		timeSeries.forEach(entry => {
			runningTotal += entry.newRegistrations;
			entry.totalUsers = runningTotal;
			entry.activeUsers = 0; // Active users tracking requires lastLogin tracking
		});
		
		// Get user role breakdown
		const usersByRole = await User.aggregate([
			{ $group: { _id: '$role', count: { $sum: 1 } } }
		]);
		
		const roleBreakdown = {
			customer: 0,
			admin: 0
		};
		usersByRole.forEach(r => {
			roleBreakdown[r._id] = r.count;
		});
		
		const totalRegistrations = timeSeries.reduce((sum, d) => sum + d.newRegistrations, 0);
		
		const result = {
			timeSeries,
			roleBreakdown,
			summary: {
				totalUsers,
				totalRegistrations,
				averageDaily: timeSeries.length > 0
					? (totalRegistrations / timeSeries.length).toFixed(0)
					: 0
			}
		};

		setCachedData(cacheKey, result);
		
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error getting user analytics:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching user analytics',
			error: error.message
		});
	}
};

/**
 * Get order analytics (REAL-TIME)
 */
exports.getOrderAnalytics = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		end.setHours(23, 59, 59, 999);

		const cacheKey = `orders:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;
		const cached = getCachedData(cacheKey);
		if (cached) {
			return res.json({ success: true, data: cached, cached: true });
		}
		
		// Get orders by status
		const ordersByStatus = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end } } },
			{ $group: { _id: '$status', count: { $sum: 1 } } },
			{ $project: { status: '$_id', count: 1, _id: 0 } }
		]);
		
		// Get orders by payment status
		const paymentsByStatus = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end } } },
			{ $group: { _id: '$paymentInfo.status', count: { $sum: 1 } } },
			{ $project: { status: '$_id', count: 1, _id: 0 } }
		]);
		
		// Get refund metrics
		const refundMetrics = await Order.aggregate([
			{
				$match: {
					createdAt: { $gte: start, $lte: end },
					status: { $in: ['refund_requested', 'refund_processing', 'refund_completed'] }
				}
			},
			{
				$group: {
					_id: null,
					count: { $sum: 1 },
					totalAmount: { $sum: { $toDouble: '$refundInfo.refundAmount' } }
				}
			}
		]);
		
		// Get time series
		const timeSeries = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end }, 'paymentInfo.status': 'paid' } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
					orders: { $sum: 1 },
					revenue: { $sum: { $toDouble: '$pricing.total' } }
				}
			},
			{
				$project: {
					date: '$_id',
					orders: 1,
					revenue: 1,
					_id: 0
				}
			},
			{ $sort: { date: 1 } }
		]);
		
		const result = {
			ordersByStatus,
			paymentsByStatus,
			refunds: {
				count: refundMetrics[0]?.count || 0,
				totalAmount: refundMetrics[0]?.totalAmount || 0
			},
			timeSeries
		};

		setCachedData(cacheKey, result);
		
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error getting order analytics:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching order analytics',
			error: error.message
		});
	}
};

/**
 * Get conversion analytics (REAL-TIME)
 */
exports.getConversionAnalytics = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		end.setHours(23, 59, 59, 999);

		const cacheKey = `conversions:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}`;
		const cached = getCachedData(cacheKey);
		if (cached) {
			return res.json({ success: true, data: cached, cached: true });
		}
		
		// Get cart creation time series
		const cartTimeSeries = await Cart.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
					totalCarts: { $sum: 1 },
					totalCartValue: { $sum: { $toDouble: '$totalPrice' } }
				}
			},
			{
				$project: {
					date: '$_id',
					totalCarts: 1,
					averageCartValue: { $divide: ['$totalCartValue', '$totalCarts'] },
					_id: 0
				}
			},
			{ $sort: { date: 1 } }
		]);
		
		// Get order completion time series
		const orderTimeSeries = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
					completedOrders: { $sum: 1 }
				}
			},
			{
				$project: {
					date: '$_id',
					completedOrders: 1,
					_id: 0
				}
			},
			{ $sort: { date: 1 } }
		]);
		
		// Merge time series data
		const timeSeriesMap = new Map();
		
		cartTimeSeries.forEach(entry => {
			timeSeriesMap.set(entry.date, {
				date: entry.date,
				totalCarts: entry.totalCarts,
				averageCartValue: entry.averageCartValue,
				completedOrders: 0
			});
		});
		
		orderTimeSeries.forEach(entry => {
			if (timeSeriesMap.has(entry.date)) {
				timeSeriesMap.get(entry.date).completedOrders = entry.completedOrders;
			} else {
				timeSeriesMap.set(entry.date, {
					date: entry.date,
					totalCarts: 0,
					averageCartValue: 0,
					completedOrders: entry.completedOrders
				});
			}
		});
		
		// Calculate conversion rates per day
		const timeSeries = Array.from(timeSeriesMap.values()).map(entry => ({
			...entry,
			conversionRate: entry.totalCarts > 0 ? ((entry.completedOrders / entry.totalCarts) * 100).toFixed(2) : 0,
			abandonmentRate: entry.totalCarts > 0 ? (((entry.totalCarts - entry.completedOrders) / entry.totalCarts) * 100).toFixed(2) : 0
		})).sort((a, b) => a.date.localeCompare(b.date));
		
		// Calculate overall metrics
		const totalCarts = await Cart.countDocuments({ createdAt: { $gte: start, $lte: end } });
		const completedOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end } });
		const abandonedCarts = totalCarts - completedOrders;
		
		const overallConversionRate = totalCarts > 0 ? ((completedOrders / totalCarts) * 100).toFixed(2) : 0;
		const overallAbandonmentRate = totalCarts > 0 ? ((abandonedCarts / totalCarts) * 100).toFixed(2) : 0;
		
		const result = {
			timeSeries,
			summary: {
				totalCarts,
				completedOrders,
				abandonedCarts,
				conversionRate: overallConversionRate,
				abandonmentRate: overallAbandonmentRate
			}
		};

		setCachedData(cacheKey, result);
		
		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error getting conversion analytics:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching conversion analytics',
			error: error.message
		});
	}
};

/**
 * Get historical data from analytics summary
 */
exports.getHistoricalData = async (req, res) => {
	try {
		const { startDate, endDate, metrics } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		
		const summaries = await AnalyticsSummary.find({
			date: { $gte: start, $lte: end }
		}).sort({ date: 1 });
		
		res.json({
			success: true,
			data: summaries
		});
	} catch (error) {
		console.error('Error getting historical data:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching historical data',
			error: error.message
		});
	}
};

/**
 * Track visit from frontend (PUBLIC endpoint)
 */
exports.trackVisit = async (req, res) => {
	try {
		const { sessionID, page, referrer, deviceType, userAgent, timestamp } = req.body;
		
		// Validate required fields
		if (!sessionID || !page) {
			return res.status(400).json({
				success: false,
				message: 'sessionID and page are required'
			});
		}
		
		// Get user ID if authenticated (optional)
		const userID = req.user ? req.user._id : null;
		
		// Get IP address
		const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '';
		
		// Store visit asynchronously
		setImmediate(async () => {
			try {
				await WebsiteVisit.create({
					sessionID,
					userID,
					page,
					referrer: referrer || '',
					userAgent: userAgent || req.headers['user-agent'] || '',
					ipAddress: ipAddress.split(',')[0].trim(), // Get first IP if forwarded
					deviceType: deviceType || 'unknown',
					timestamp: timestamp ? new Date(timestamp) : new Date()
				});
			} catch (error) {
				console.error('Error storing visit:', error);
			}
		});
		
		// Return success immediately (non-blocking)
		res.json({
			success: true,
			message: 'Visit tracked'
		});
	} catch (error) {
		console.error('Error tracking visit:', error);
		res.status(500).json({
			success: false,
			message: 'Error tracking visit',
			error: error.message
		});
	}
};

/**
 * Trigger daily aggregation (admin only)
 */
exports.triggerDailyAggregation = async (req, res) => {
	try {
		const { date } = req.body;
		const targetDate = date ? new Date(date) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
		
		await aggregateDailyMetrics(targetDate);
		
		res.json({
			success: true,
			message: `Daily aggregation completed for ${targetDate.toISOString().split('T')[0]}`
		});
	} catch (error) {
		console.error('Error triggering daily aggregation:', error);
		res.status(500).json({
			success: false,
			message: 'Error triggering daily aggregation',
			error: error.message
		});
	}
};

