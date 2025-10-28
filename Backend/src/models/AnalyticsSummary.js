const mongoose = require('mongoose');

const { Schema } = mongoose;

const AnalyticsSummarySchema = new Schema(
	{
		date: { 
			type: Date, 
			required: true, 
			unique: true,
			index: true 
		},
		
		// Website Metrics
		websiteMetrics: {
			totalPageViews: { type: Number, default: 0 },
			uniqueVisitors: { type: Number, default: 0 },
			uniqueSessions: { type: Number, default: 0 },
			bounceRate: { type: Number, default: 0 },
			topPages: [{
				page: { type: String },
				views: { type: Number }
			}],
			deviceBreakdown: {
				mobile: { type: Number, default: 0 },
				tablet: { type: Number, default: 0 },
				desktop: { type: Number, default: 0 },
				unknown: { type: Number, default: 0 }
			}
		},
		
		// Revenue Metrics
		revenueMetrics: {
			totalRevenue: { type: Schema.Types.Decimal128, default: 0 },
			totalOrders: { type: Number, default: 0 },
			averageOrderValue: { type: Schema.Types.Decimal128, default: 0 },
			revenueByCategory: [{
				categoryID: { type: Schema.Types.ObjectId, ref: 'Category' },
				categoryName: { type: String },
				revenue: { type: Schema.Types.Decimal128 },
				orderCount: { type: Number }
			}],
			revenueByMaterial: [{
				materialID: { type: Schema.Types.ObjectId, ref: 'MaterialMaster' },
				materialName: { type: String },
				revenue: { type: Schema.Types.Decimal128 },
				quantity: { type: Number }
			}],
			revenueByFinish: [{
				finishID: { type: Schema.Types.ObjectId, ref: 'Finish' },
				finishName: { type: String },
				revenue: { type: Schema.Types.Decimal128 },
				quantity: { type: Number }
			}]
		},
		
		// User Metrics
		userMetrics: {
			newRegistrations: { type: Number, default: 0 },
			activeUsers: { type: Number, default: 0 },
			totalUsers: { type: Number, default: 0 },
			usersByRole: {
				customer: { type: Number, default: 0 },
				admin: { type: Number, default: 0 }
			}
		},
		
		// Product Metrics
		productMetrics: {
			topSellingProducts: [{
				productID: { type: Schema.Types.ObjectId, ref: 'Product' },
				productName: { type: String },
				quantitySold: { type: Number },
				revenue: { type: Schema.Types.Decimal128 }
			}],
			mostViewedProducts: [{
				productID: { type: Schema.Types.ObjectId, ref: 'Product' },
				productName: { type: String },
				views: { type: Number }
			}],
			mostWishlisted: [{
				productID: { type: Schema.Types.ObjectId, ref: 'Product' },
				productName: { type: String },
				wishlistCount: { type: Number }
			}]
		},
		
		// Order Metrics
		orderMetrics: {
			ordersByStatus: [{
				status: { type: String },
				count: { type: Number }
			}],
			paymentsByStatus: [{
				status: { type: String },
				count: { type: Number }
			}],
			refundCount: { type: Number, default: 0 },
			refundAmount: { type: Schema.Types.Decimal128, default: 0 }
		},
		
		// Conversion Metrics
		conversionMetrics: {
			totalCarts: { type: Number, default: 0 },
			completedOrders: { type: Number, default: 0 },
			abandonedCarts: { type: Number, default: 0 },
			cartAbandonmentRate: { type: Number, default: 0 },
			conversionRate: { type: Number, default: 0 },
			averageItemsPerCart: { type: Number, default: 0 },
			averageCartValue: { type: Schema.Types.Decimal128, default: 0 }
		}
	},
	{ timestamps: true }
);

// Index for efficient date range queries
AnalyticsSummarySchema.index({ date: -1 });

module.exports = mongoose.model('AnalyticsSummary', AnalyticsSummarySchema);

