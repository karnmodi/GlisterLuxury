const WebsiteVisit = require('../models/WebsiteVisit');
const AnalyticsSummary = require('../models/AnalyticsSummary');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const { aggregateDailyMetrics } = require('../utils/analyticsAggregator');

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
 * Get dashboard summary with today, weekly, and monthly stats
 */
exports.getDashboardSummary = async (req, res) => {
	try {
		const { todayStart, weekStart, monthStart } = getDateRanges();
		
		// Get today's metrics (real-time)
		const [
			todayPageViews,
			todayUniqueSessions,
			todayOrders,
			todayRevenue,
			todayRegistrations
		] = await Promise.all([
			WebsiteVisit.countDocuments({ timestamp: { $gte: todayStart } }),
			WebsiteVisit.distinct('sessionID', { timestamp: { $gte: todayStart } }).then(arr => arr.length),
			Order.countDocuments({ createdAt: { $gte: todayStart } }),
			Order.aggregate([
				{ $match: { createdAt: { $gte: todayStart }, 'paymentInfo.status': 'paid' } },
				{ $group: { _id: null, total: { $sum: { $toDouble: '$pricing.total' } } } }
			]),
			User.countDocuments({ createdAt: { $gte: todayStart } })
		]);
		
		// Get weekly metrics from aggregated data
		const weeklyData = await AnalyticsSummary.find({
			date: { $gte: weekStart }
		}).sort({ date: -1 });
		
		const weeklyMetrics = weeklyData.reduce((acc, day) => {
			acc.pageViews += day.websiteMetrics.totalPageViews || 0;
			acc.orders += day.revenueMetrics.totalOrders || 0;
			acc.revenue += toFloat(day.revenueMetrics.totalRevenue);
			acc.registrations += day.userMetrics.newRegistrations || 0;
			return acc;
		}, { pageViews: 0, orders: 0, revenue: 0, registrations: 0 });
		
		// Get monthly metrics from aggregated data
		const monthlyData = await AnalyticsSummary.find({
			date: { $gte: monthStart }
		}).sort({ date: -1 });
		
		const monthlyMetrics = monthlyData.reduce((acc, day) => {
			acc.pageViews += day.websiteMetrics.totalPageViews || 0;
			acc.orders += day.revenueMetrics.totalOrders || 0;
			acc.revenue += toFloat(day.revenueMetrics.totalRevenue);
			acc.registrations += day.userMetrics.newRegistrations || 0;
			return acc;
		}, { pageViews: 0, orders: 0, revenue: 0, registrations: 0 });
		
		// Get total counts
		const [totalUsers, totalOrders, totalProducts] = await Promise.all([
			User.countDocuments(),
			Order.countDocuments(),
			Product.countDocuments()
		]);
		
		// Calculate conversion rate
		const activeCarts = await Cart.countDocuments({ 
			status: 'active',
			updatedAt: { $gte: weekStart }
		});
		const weeklyConversionRate = activeCarts > 0 
			? ((weeklyMetrics.orders / activeCarts) * 100).toFixed(2)
			: 0;
		
		res.json({
			success: true,
			data: {
				today: {
					pageViews: todayPageViews,
					uniqueVisitors: todayUniqueSessions,
					orders: todayOrders,
					revenue: todayRevenue[0]?.total || 0,
					registrations: todayRegistrations
				},
				weekly: {
					pageViews: weeklyMetrics.pageViews,
					orders: weeklyMetrics.orders,
					revenue: weeklyMetrics.revenue,
					registrations: weeklyMetrics.registrations,
					conversionRate: weeklyConversionRate
				},
				monthly: {
					pageViews: monthlyMetrics.pageViews,
					orders: monthlyMetrics.orders,
					revenue: monthlyMetrics.revenue,
					registrations: monthlyMetrics.registrations
				},
				totals: {
					users: totalUsers,
					orders: totalOrders,
					products: totalProducts
				}
			}
		});
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
 * Get website visit analytics
 */
exports.getWebsiteVisits = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		
		// Get aggregated data
		const summaries = await AnalyticsSummary.find({
			date: { $gte: start, $lte: end }
		}).sort({ date: 1 });
		
		// Get real-time data for today
		const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
		const [todayPageViews, todayUniqueSessions, todayTopPages, todayDevices] = await Promise.all([
			WebsiteVisit.countDocuments({ timestamp: { $gte: todayStart } }),
			WebsiteVisit.distinct('sessionID', { timestamp: { $gte: todayStart } }).then(arr => arr.length),
			WebsiteVisit.aggregate([
				{ $match: { timestamp: { $gte: todayStart } } },
				{ $group: { _id: '$page', count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
				{ $limit: 10 },
				{ $project: { page: '$_id', views: '$count', _id: 0 } }
			]),
			WebsiteVisit.aggregate([
				{ $match: { timestamp: { $gte: todayStart } } },
				{ $group: { _id: '$deviceType', count: { $sum: 1 } } }
			])
		]);
		
		// Format device breakdown
		const deviceBreakdown = {
			mobile: 0,
			tablet: 0,
			desktop: 0,
			unknown: 0
		};
		todayDevices.forEach(d => {
			deviceBreakdown[d._id] = d.count;
		});
		
		// Prepare time series data
		const timeSeries = summaries.map(summary => ({
			date: summary.date,
			pageViews: summary.websiteMetrics.totalPageViews,
			uniqueVisitors: summary.websiteMetrics.uniqueVisitors,
			uniqueSessions: summary.websiteMetrics.uniqueSessions
		}));
		
		// Add today's data
		timeSeries.push({
			date: todayStart,
			pageViews: todayPageViews,
			uniqueVisitors: todayUniqueSessions,
			uniqueSessions: todayUniqueSessions
		});
		
		res.json({
			success: true,
			data: {
				timeSeries,
				topPages: todayTopPages,
				deviceBreakdown,
				summary: {
					totalPageViews: timeSeries.reduce((sum, d) => sum + d.pageViews, 0),
					averageDaily: timeSeries.length > 0 
						? (timeSeries.reduce((sum, d) => sum + d.pageViews, 0) / timeSeries.length).toFixed(0)
						: 0
				}
			}
		});
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
 * Get revenue analytics
 */
exports.getRevenueAnalytics = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		
		// Get aggregated data
		const summaries = await AnalyticsSummary.find({
			date: { $gte: start, $lte: end }
		}).sort({ date: 1 });
		
		// Prepare time series
		const timeSeries = summaries.map(summary => ({
			date: summary.date,
			revenue: toFloat(summary.revenueMetrics.totalRevenue),
			orders: summary.revenueMetrics.totalOrders,
			averageOrderValue: toFloat(summary.revenueMetrics.averageOrderValue)
		}));
		
		// Get today's data
		const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
		const todayOrders = await Order.aggregate([
			{ $match: { createdAt: { $gte: todayStart }, 'paymentInfo.status': 'paid' } },
			{
				$group: {
					_id: null,
					total: { $sum: { $toDouble: '$pricing.total' } },
					count: { $sum: 1 }
				}
			}
		]);
		
		if (todayOrders.length > 0) {
			timeSeries.push({
				date: todayStart,
				revenue: todayOrders[0].total,
				orders: todayOrders[0].count,
				averageOrderValue: todayOrders[0].total / todayOrders[0].count
			});
		}
		
		// Aggregate revenue by category
		const revenueByCategory = {};
		summaries.forEach(summary => {
			summary.revenueMetrics.revenueByCategory.forEach(cat => {
				if (!revenueByCategory[cat.categoryName]) {
					revenueByCategory[cat.categoryName] = {
						revenue: 0,
						orders: 0
					};
				}
				revenueByCategory[cat.categoryName].revenue += toFloat(cat.revenue);
				revenueByCategory[cat.categoryName].orders += cat.orderCount;
			});
		});
		
		// Aggregate revenue by material
		const revenueByMaterial = {};
		summaries.forEach(summary => {
			summary.revenueMetrics.revenueByMaterial.forEach(mat => {
				if (!revenueByMaterial[mat.materialName]) {
					revenueByMaterial[mat.materialName] = {
						revenue: 0,
						quantity: 0
					};
				}
				revenueByMaterial[mat.materialName].revenue += toFloat(mat.revenue);
				revenueByMaterial[mat.materialName].quantity += mat.quantity;
			});
		});
		
		// Aggregate revenue by finish
		const revenueByFinish = {};
		summaries.forEach(summary => {
			summary.revenueMetrics.revenueByFinish.forEach(fin => {
				if (!revenueByFinish[fin.finishName]) {
					revenueByFinish[fin.finishName] = {
						revenue: 0,
						quantity: 0
					};
				}
				revenueByFinish[fin.finishName].revenue += toFloat(fin.revenue);
				revenueByFinish[fin.finishName].quantity += fin.quantity;
			});
		});
		
		const totalRevenue = timeSeries.reduce((sum, d) => sum + d.revenue, 0);
		const totalOrders = timeSeries.reduce((sum, d) => sum + d.orders, 0);
		
		res.json({
			success: true,
			data: {
				timeSeries,
				byCategory: Object.entries(revenueByCategory).map(([name, data]) => ({
					name,
					...data
				})),
				byMaterial: Object.entries(revenueByMaterial).map(([name, data]) => ({
					name,
					...data
				})),
				byFinish: Object.entries(revenueByFinish).map(([name, data]) => ({
					name,
					...data
				})),
				summary: {
					totalRevenue,
					totalOrders,
					averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
				}
			}
		});
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
 * Get product analytics
 */
exports.getProductAnalytics = async (req, res) => {
	try {
		const { limit = 10 } = req.query;
		
		// Get data from last 30 days
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const summaries = await AnalyticsSummary.find({
			date: { $gte: thirtyDaysAgo }
		}).sort({ date: -1 });
		
		// Aggregate top selling products
		const topSelling = {};
		summaries.forEach(summary => {
			summary.productMetrics.topSellingProducts.forEach(prod => {
				const key = prod.productID.toString();
				if (!topSelling[key]) {
					topSelling[key] = {
						productID: prod.productID,
						productName: prod.productName,
						quantitySold: 0,
						revenue: 0
					};
				}
				topSelling[key].quantitySold += prod.quantitySold;
				topSelling[key].revenue += toFloat(prod.revenue);
			});
		});
		
		// Aggregate most viewed products
		const mostViewed = {};
		summaries.forEach(summary => {
			summary.productMetrics.mostViewedProducts.forEach(prod => {
				const key = prod.productID.toString();
				if (!mostViewed[key]) {
					mostViewed[key] = {
						productID: prod.productID,
						productName: prod.productName,
						views: 0
					};
				}
				mostViewed[key].views += prod.views;
			});
		});
		
		// Aggregate most wishlisted
		const mostWishlisted = {};
		summaries.forEach(summary => {
			summary.productMetrics.mostWishlisted.forEach(prod => {
				const key = prod.productID.toString();
				if (!mostWishlisted[key]) {
					mostWishlisted[key] = {
						productID: prod.productID,
						productName: prod.productName,
						wishlistCount: 0
					};
				}
				mostWishlisted[key].wishlistCount += prod.wishlistCount;
			});
		});
		
		// Sort and limit
		const topSellingArray = Object.values(topSelling)
			.sort((a, b) => b.quantitySold - a.quantitySold)
			.slice(0, parseInt(limit));
		
		const mostViewedArray = Object.values(mostViewed)
			.sort((a, b) => b.views - a.views)
			.slice(0, parseInt(limit));
		
		const mostWishlistedArray = Object.values(mostWishlisted)
			.sort((a, b) => b.wishlistCount - a.wishlistCount)
			.slice(0, parseInt(limit));
		
		res.json({
			success: true,
			data: {
				topSelling: topSellingArray,
				mostViewed: mostViewedArray,
				mostWishlisted: mostWishlistedArray
			}
		});
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
 * Get user analytics
 */
exports.getUserAnalytics = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		
		// Get aggregated data
		const summaries = await AnalyticsSummary.find({
			date: { $gte: start, $lte: end }
		}).sort({ date: 1 });
		
		// Prepare time series
		const timeSeries = summaries.map(summary => ({
			date: summary.date,
			newRegistrations: summary.userMetrics.newRegistrations,
			totalUsers: summary.userMetrics.totalUsers,
			activeUsers: summary.userMetrics.activeUsers
		}));
		
		// Get today's data
		const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
		const [todayRegistrations, totalUsers, activeToday] = await Promise.all([
			User.countDocuments({ createdAt: { $gte: todayStart } }),
			User.countDocuments(),
			User.countDocuments({ lastLogin: { $gte: todayStart } })
		]);
		
		timeSeries.push({
			date: todayStart,
			newRegistrations: todayRegistrations,
			totalUsers: totalUsers,
			activeUsers: activeToday
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
		
		res.json({
			success: true,
			data: {
				timeSeries,
				roleBreakdown,
				summary: {
					totalUsers,
					totalRegistrations: timeSeries.reduce((sum, d) => sum + d.newRegistrations, 0),
					averageDaily: timeSeries.length > 0
						? (timeSeries.reduce((sum, d) => sum + d.newRegistrations, 0) / timeSeries.length).toFixed(0)
						: 0
				}
			}
		});
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
 * Get order analytics
 */
exports.getOrderAnalytics = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		
		// Get orders by status
		const ordersByStatus = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end } } },
			{ $group: { _id: '$status', count: { $sum: 1 } } }
		]);
		
		// Get orders by payment status
		const paymentsByStatus = await Order.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end } } },
			{ $group: { _id: '$paymentInfo.status', count: { $sum: 1 } } }
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
		
		// Get time series from aggregated data
		const summaries = await AnalyticsSummary.find({
			date: { $gte: start, $lte: end }
		}).sort({ date: 1 });
		
		const timeSeries = summaries.map(summary => ({
			date: summary.date,
			orders: summary.revenueMetrics.totalOrders,
			revenue: toFloat(summary.revenueMetrics.totalRevenue)
		}));
		
		res.json({
			success: true,
			data: {
				ordersByStatus: ordersByStatus.map(s => ({
					status: s._id,
					count: s.count
				})),
				paymentsByStatus: paymentsByStatus.map(s => ({
					status: s._id,
					count: s.count
				})),
				refunds: {
					count: refundMetrics[0]?.count || 0,
					totalAmount: refundMetrics[0]?.totalAmount || 0
				},
				timeSeries
			}
		});
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
 * Get conversion analytics
 */
exports.getConversionAnalytics = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const end = endDate ? new Date(endDate) : new Date();
		
		// Get aggregated data
		const summaries = await AnalyticsSummary.find({
			date: { $gte: start, $lte: end }
		}).sort({ date: 1 });
		
		// Prepare time series
		const timeSeries = summaries.map(summary => ({
			date: summary.date,
			conversionRate: summary.conversionMetrics.conversionRate,
			abandonmentRate: summary.conversionMetrics.cartAbandonmentRate,
			averageCartValue: toFloat(summary.conversionMetrics.averageCartValue)
		}));
		
		// Calculate overall metrics
		const totalCarts = summaries.reduce((sum, s) => sum + s.conversionMetrics.totalCarts, 0);
		const completedOrders = summaries.reduce((sum, s) => sum + s.conversionMetrics.completedOrders, 0);
		const abandonedCarts = summaries.reduce((sum, s) => sum + s.conversionMetrics.abandonedCarts, 0);
		
		const overallConversionRate = totalCarts > 0 ? ((completedOrders / totalCarts) * 100).toFixed(2) : 0;
		const overallAbandonmentRate = totalCarts > 0 ? ((abandonedCarts / totalCarts) * 100).toFixed(2) : 0;
		
		res.json({
			success: true,
			data: {
				timeSeries,
				summary: {
					totalCarts,
					completedOrders,
					abandonedCarts,
					conversionRate: overallConversionRate,
					abandonmentRate: overallAbandonmentRate
				}
			}
		});
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

