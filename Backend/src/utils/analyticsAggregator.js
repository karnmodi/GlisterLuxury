const WebsiteVisit = require('../models/WebsiteVisit');
const AnalyticsSummary = require('../models/AnalyticsSummary');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

/**
 * Convert Decimal128 to float
 */
const toFloat = (decimal) => {
	if (!decimal) return 0;
	return parseFloat(decimal.toString());
};

/**
 * Aggregate website metrics for a specific date
 */
const aggregateWebsiteMetrics = async (startDate, endDate) => {
	const [
		totalPageViews,
		uniqueVisitors,
		uniqueSessions,
		topPages,
		deviceBreakdown,
		singlePageSessions
	] = await Promise.all([
		// Total page views
		WebsiteVisit.countDocuments({ timestamp: { $gte: startDate, $lt: endDate } }),
		
		// Unique visitors (by sessionID)
		WebsiteVisit.distinct('sessionID', { timestamp: { $gte: startDate, $lt: endDate } })
			.then(arr => arr.length),
		
		// Unique sessions
		WebsiteVisit.distinct('sessionID', { timestamp: { $gte: startDate, $lt: endDate } })
			.then(arr => arr.length),
		
		// Top pages
		WebsiteVisit.aggregate([
			{ $match: { timestamp: { $gte: startDate, $lt: endDate } } },
			{ $group: { _id: '$page', count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $limit: 10 },
			{ $project: { page: '$_id', views: '$count', _id: 0 } }
		]),
		
		// Device breakdown
		WebsiteVisit.aggregate([
			{ $match: { timestamp: { $gte: startDate, $lt: endDate } } },
			{ $group: { _id: '$deviceType', count: { $sum: 1 } } }
		]),
		
		// Single page sessions (for bounce rate)
		WebsiteVisit.aggregate([
			{ $match: { timestamp: { $gte: startDate, $lt: endDate } } },
			{ $group: { _id: '$sessionID', pageCount: { $sum: 1 } } },
			{ $match: { pageCount: 1 } },
			{ $count: 'bounces' }
		])
	]);
	
	// Format device breakdown
	const devices = {
		mobile: 0,
		tablet: 0,
		desktop: 0,
		unknown: 0
	};
	deviceBreakdown.forEach(d => {
		devices[d._id] = d.count;
	});
	
	// Calculate bounce rate
	const bounceRate = uniqueSessions > 0 
		? ((singlePageSessions[0]?.bounces || 0) / uniqueSessions) * 100
		: 0;
	
	return {
		totalPageViews,
		uniqueVisitors,
		uniqueSessions,
		bounceRate,
		topPages,
		deviceBreakdown: devices
	};
};

/**
 * Aggregate revenue metrics for a specific date
 */
const aggregateRevenueMetrics = async (startDate, endDate) => {
	// Get all paid orders for the date
	const orders = await Order.find({
		createdAt: { $gte: startDate, $lt: endDate },
		'paymentInfo.status': 'paid'
	}).populate('items.productID');
	
	let totalRevenue = 0;
	const totalOrders = orders.length;
	const categoryRevenue = {};
	const materialRevenue = {};
	const finishRevenue = {};
	
	// Process each order
	for (const order of orders) {
		const orderTotal = toFloat(order.pricing.total);
		totalRevenue += orderTotal;
		
		// Process each item in the order
		for (const item of order.items) {
			// Revenue by category
			if (item.productID && item.productID.category) {
				const categoryId = item.productID.category.toString();
				if (!categoryRevenue[categoryId]) {
					categoryRevenue[categoryId] = {
						categoryID: item.productID.category,
						categoryName: item.productID.category.name || 'Unknown',
						revenue: 0,
						orderCount: 0
					};
				}
				categoryRevenue[categoryId].revenue += toFloat(item.totalPrice);
				categoryRevenue[categoryId].orderCount += 1;
			}
			
			// Revenue by material
			if (item.selectedMaterial && item.selectedMaterial.name) {
				const materialName = item.selectedMaterial.name;
				if (!materialRevenue[materialName]) {
					materialRevenue[materialName] = {
						materialID: item.selectedMaterial.materialID,
						materialName: materialName,
						revenue: 0,
						quantity: 0
					};
				}
				materialRevenue[materialName].revenue += toFloat(item.totalPrice);
				materialRevenue[materialName].quantity += item.quantity;
			}
			
			// Revenue by finish
			if (item.selectedFinish && item.selectedFinish.name) {
				const finishName = item.selectedFinish.name;
				if (!finishRevenue[finishName]) {
					finishRevenue[finishName] = {
						finishID: item.selectedFinish.finishID,
						finishName: finishName,
						revenue: 0,
						quantity: 0
					};
				}
				finishRevenue[finishName].revenue += toFloat(item.totalPrice);
				finishRevenue[finishName].quantity += item.quantity;
			}
		}
	}
	
	const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
	
	return {
		totalRevenue,
		totalOrders,
		averageOrderValue,
		revenueByCategory: Object.values(categoryRevenue),
		revenueByMaterial: Object.values(materialRevenue),
		revenueByFinish: Object.values(finishRevenue)
	};
};

/**
 * Aggregate user metrics for a specific date
 */
const aggregateUserMetrics = async (startDate, endDate) => {
	const [
		newRegistrations,
		activeUsers,
		totalUsers,
		usersByRole
	] = await Promise.all([
		// New registrations
		User.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
		
		// Active users (logged in during the period)
		User.countDocuments({ lastLogin: { $gte: startDate, $lt: endDate } }),
		
		// Total users at end of day
		User.countDocuments({ createdAt: { $lt: endDate } }),
		
		// Users by role
		User.aggregate([
			{ $match: { createdAt: { $lt: endDate } } },
			{ $group: { _id: '$role', count: { $sum: 1 } } }
		])
	]);
	
	const roleBreakdown = {
		customer: 0,
		admin: 0
	};
	usersByRole.forEach(r => {
		roleBreakdown[r._id] = r.count;
	});
	
	return {
		newRegistrations,
		activeUsers,
		totalUsers,
		usersByRole: roleBreakdown
	};
};

/**
 * Aggregate product metrics for a specific date
 */
const aggregateProductMetrics = async (startDate, endDate) => {
	// Top selling products
	const topSelling = await Order.aggregate([
		{ $match: { createdAt: { $gte: startDate, $lt: endDate }, 'paymentInfo.status': 'paid' } },
		{ $unwind: '$items' },
		{
			$group: {
				_id: '$items.productID',
				productName: { $first: '$items.productName' },
				quantitySold: { $sum: '$items.quantity' },
				revenue: { $sum: { $toDouble: '$items.totalPrice' } }
			}
		},
		{ $sort: { quantitySold: -1 } },
		{ $limit: 10 },
		{
			$project: {
				productID: '$_id',
				productName: 1,
				quantitySold: 1,
				revenue: 1,
				_id: 0
			}
		}
	]);
	
	// Most viewed products (from website visits)
	const mostViewed = await WebsiteVisit.aggregate([
		{ 
			$match: { 
				timestamp: { $gte: startDate, $lt: endDate },
				page: { $regex: /\/products\// }
			}
		},
		{
			$group: {
				_id: '$page',
				views: { $sum: 1 }
			}
		},
		{ $sort: { views: -1 } },
		{ $limit: 10 }
	]);
	
	// Extract product IDs from page URLs and get product names
	const viewedWithNames = [];
	for (const item of mostViewed) {
		const match = item._id.match(/\/products\/([a-f0-9]{24})/);
		if (match) {
			const productId = match[1];
			const product = await Product.findById(productId);
			if (product) {
				viewedWithNames.push({
					productID: product._id,
					productName: product.name,
					views: item.views
				});
			}
		}
	}
	
	// Most wishlisted products
	const mostWishlisted = await Wishlist.aggregate([
		{ $unwind: '$items' },
		{
			$match: {
				'items.addedAt': { $gte: startDate, $lt: endDate }
			}
		},
		{
			$group: {
				_id: '$items.productID',
				wishlistCount: { $sum: 1 }
			}
		},
		{ $sort: { wishlistCount: -1 } },
		{ $limit: 10 },
		{
			$lookup: {
				from: 'products',
				localField: '_id',
				foreignField: '_id',
				as: 'product'
			}
		},
		{ $unwind: '$product' },
		{
			$project: {
				productID: '$_id',
				productName: '$product.name',
				wishlistCount: 1,
				_id: 0
			}
		}
	]);
	
	return {
		topSellingProducts: topSelling,
		mostViewedProducts: viewedWithNames,
		mostWishlisted
	};
};

/**
 * Aggregate order metrics for a specific date
 */
const aggregateOrderMetrics = async (startDate, endDate) => {
	const [ordersByStatus, paymentsByStatus, refunds] = await Promise.all([
		// Orders by status
		Order.aggregate([
			{ $match: { createdAt: { $gte: startDate, $lt: endDate } } },
			{ $group: { _id: '$status', count: { $sum: 1 } } },
			{ $project: { status: '$_id', count: 1, _id: 0 } }
		]),
		
		// Payments by status
		Order.aggregate([
			{ $match: { createdAt: { $gte: startDate, $lt: endDate } } },
			{ $group: { _id: '$paymentInfo.status', count: { $sum: 1 } } },
			{ $project: { status: '$_id', count: 1, _id: 0 } }
		]),
		
		// Refunds
		Order.aggregate([
			{
				$match: {
					createdAt: { $gte: startDate, $lt: endDate },
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
		])
	]);
	
	return {
		ordersByStatus,
		paymentsByStatus,
		refundCount: refunds[0]?.count || 0,
		refundAmount: refunds[0]?.totalAmount || 0
	};
};

/**
 * Aggregate conversion metrics for a specific date
 */
const aggregateConversionMetrics = async (startDate, endDate) => {
	const [totalCarts, completedOrders, cartStats] = await Promise.all([
		// Total carts created
		Cart.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
		
		// Completed orders
		Order.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
		
		// Cart statistics
		Cart.aggregate([
			{ $match: { createdAt: { $gte: startDate, $lt: endDate } } },
			{
				$group: {
					_id: null,
					averageItems: { $avg: { $size: '$items' } },
					averageValue: { $avg: { $toDouble: '$subtotal' } }
				}
			}
		])
	]);
	
	const abandonedCarts = totalCarts - completedOrders;
	const cartAbandonmentRate = totalCarts > 0 ? ((abandonedCarts / totalCarts) * 100) : 0;
	const conversionRate = totalCarts > 0 ? ((completedOrders / totalCarts) * 100) : 0;
	
	return {
		totalCarts,
		completedOrders,
		abandonedCarts,
		cartAbandonmentRate,
		conversionRate,
		averageItemsPerCart: cartStats[0]?.averageItems || 0,
		averageCartValue: cartStats[0]?.averageValue || 0
	};
};

/**
 * Main aggregation function to aggregate all metrics for a specific date
 */
const aggregateDailyMetrics = async (date) => {
	try {
		// Set date range for the full day
		const startDate = new Date(date);
		startDate.setHours(0, 0, 0, 0);
		
		const endDate = new Date(date);
		endDate.setHours(23, 59, 59, 999);
		
		console.log(`Aggregating metrics for ${startDate.toISOString().split('T')[0]}...`);
		
		// Aggregate all metrics
		const [
			websiteMetrics,
			revenueMetrics,
			userMetrics,
			productMetrics,
			orderMetrics,
			conversionMetrics
		] = await Promise.all([
			aggregateWebsiteMetrics(startDate, endDate),
			aggregateRevenueMetrics(startDate, endDate),
			aggregateUserMetrics(startDate, endDate),
			aggregateProductMetrics(startDate, endDate),
			aggregateOrderMetrics(startDate, endDate),
			aggregateConversionMetrics(startDate, endDate)
		]);
		
		// Upsert the analytics summary
		await AnalyticsSummary.findOneAndUpdate(
			{ date: startDate },
			{
				date: startDate,
				websiteMetrics,
				revenueMetrics,
				userMetrics,
				productMetrics,
				orderMetrics,
				conversionMetrics
			},
			{ upsert: true, new: true }
		);
		
		console.log(`Successfully aggregated metrics for ${startDate.toISOString().split('T')[0]}`);
		
		return true;
	} catch (error) {
		console.error('Error aggregating daily metrics:', error);
		throw error;
	}
};

/**
 * Schedule daily aggregation (to be called at midnight)
 */
const scheduleDailyAggregation = () => {
	// Run aggregation for yesterday at midnight every day
	const cron = require('node-cron');
	
	// Run at 00:05 AM every day (5 minutes past midnight to ensure all data is captured)
	cron.schedule('5 0 * * *', async () => {
		try {
			console.log('Running scheduled daily aggregation...');
			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			await aggregateDailyMetrics(yesterday);
			console.log('Scheduled daily aggregation completed');
		} catch (error) {
			console.error('Error in scheduled daily aggregation:', error);
		}
	});
	
	console.log('Daily aggregation scheduled to run at 00:05 AM every day');
};

module.exports = {
	aggregateDailyMetrics,
	scheduleDailyAggregation
};

