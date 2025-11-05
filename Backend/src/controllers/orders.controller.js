const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const nodemailer = require('nodemailer');

/**
 * Helper function to send order confirmation emails
 */
async function sendOrderEmails(order, user) {
	// Configure email transporter
	const transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE || 'gmail',
		auth: {
			user: process.env.EMAIL_USERNAME,
			pass: process.env.EMAIL_PASSWORD
		}
	});

	const formatPrice = (price) => {
		const amount = typeof price === 'object' && price.$numberDecimal 
			? parseFloat(price.$numberDecimal) 
			: parseFloat(price);
		return `£${amount.toFixed(2)}`;
	};

	// Generate order items HTML
	const orderItemsHTML = order.items.map(item => `
		<tr>
			<td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
				<strong>${item.productName}</strong><br>
				<small style="color: #666;">${item.productCode}</small><br>
				<small style="color: #666;">Material: ${item.selectedMaterial.name}</small>
				${item.selectedSize ? `<br><small style="color: #666;">Size: ${item.selectedSize}mm</small>` : ''}
				${item.selectedFinish ? `<br><small style="color: #666;">Finish: ${item.selectedFinish.name}</small>` : ''}
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatPrice(item.unitPrice)}</td>
			<td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;"><strong>${formatPrice(item.totalPrice)}</strong></td>
		</tr>
	`).join('');

	// Admin notification email
	const adminEmailHTML = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #2C2C2C; color: #D4AF37; padding: 20px; text-align: center; }
				.content { background-color: #f9f9f9; padding: 20px; }
				.order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
				table { width: 100%; border-collapse: collapse; }
				th { background-color: #2C2C2C; color: #D4AF37; padding: 12px; text-align: left; }
				.total-row { font-size: 18px; font-weight: bold; }
				.alert-box { background-color: #fff3cd; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>🎉 NEW ORDER RECEIVED</h1>
					<p>Order #${order.orderNumber}</p>
				</div>
				<div class="content">
					<div class="alert-box">
						<strong>⚡ Action Required:</strong> A new order has been placed and requires your attention.
					</div>
					
					<div class="order-details">
						<h2>Order Information</h2>
						<p><strong>Order Number:</strong> ${order.orderNumber}</p>
						<p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-GB', { 
							day: 'numeric', 
							month: 'long', 
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}</p>
						<p><strong>Status:</strong> <span style="background-color: #fff3cd; padding: 4px 8px; border-radius: 4px;">PENDING</span></p>
					</div>

					<div class="order-details">
						<h2>Customer Details</h2>
						<p><strong>Name:</strong> ${order.customerInfo.name}</p>
						<p><strong>Email:</strong> <a href="mailto:${order.customerInfo.email}">${order.customerInfo.email}</a></p>
						<p><strong>Phone:</strong> ${order.customerInfo.phone || 'Not provided'}</p>
					</div>

					<div class="order-details">
						<h2>Delivery Address</h2>
						<p>
							${order.deliveryAddress.addressLine1}<br>
							${order.deliveryAddress.addressLine2 ? order.deliveryAddress.addressLine2 + '<br>' : ''}
							${order.deliveryAddress.city}<br>
							${order.deliveryAddress.county ? order.deliveryAddress.county + '<br>' : ''}
							${order.deliveryAddress.postcode}<br>
							${order.deliveryAddress.country}
						</p>
					</div>

					${order.orderNotes ? `
					<div class="order-details">
						<h2>Order Notes</h2>
						<p style="font-style: italic;">${order.orderNotes}</p>
					</div>
					` : ''}

					<div class="order-details">
						<h2>Order Items</h2>
						<table>
							<thead>
								<tr>
									<th>Product</th>
									<th style="text-align: center;">Quantity</th>
									<th style="text-align: right;">Unit Price</th>
									<th style="text-align: right;">Total</th>
								</tr>
							</thead>
							<tbody>
								${orderItemsHTML}
								<tr class="total-row">
									<td colspan="3" style="padding: 20px 12px; text-align: right;">Subtotal:</td>
									<td style="padding: 20px 12px; text-align: right;">${formatPrice(order.pricing.subtotal)}</td>
								</tr>
								${order.discountCode && order.pricing.discount ? `
								<tr style="background-color: #d4edda;">
									<td colspan="3" style="padding: 12px; text-align: right;">
										<span style="color: #155724;">💰 Discount Applied (${order.discountCode}):</span>
									</td>
									<td style="padding: 12px; text-align: right; color: #155724; font-weight: bold;">-${formatPrice(order.pricing.discount)}</td>
								</tr>
								` : ''}
								<tr class="total-row" style="background-color: #D4AF37; color: #2C2C2C;">
									<td colspan="3" style="padding: 20px 12px; text-align: right;">TOTAL:</td>
									<td style="padding: 20px 12px; text-align: right;">${formatPrice(order.pricing.total)}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div class="alert-box">
						<strong>💳 Payment Status:</strong> Awaiting Payment - Send payment instructions to customer.
					</div>
				</div>
			</div>
		</body>
		</html>
	`;

	// Customer confirmation email
	const customerEmailHTML = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #2C2C2C; color: #D4AF37; padding: 30px; text-align: center; }
				.content { background-color: #f9f9f9; padding: 20px; }
				.order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
				table { width: 100%; border-collapse: collapse; }
				th { background-color: #2C2C2C; color: #D4AF37; padding: 12px; text-align: left; }
				.total-row { font-size: 18px; font-weight: bold; }
				.info-box { background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
				.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>✨ GLISTER LONDON</h1>
					<h2 style="margin-top: 10px;">The Soul of Interior</h2>
					<p style="margin-top: 20px; font-size: 16px;">Thank You for Your Order!</p>
				</div>
				<div class="content">
					<p>Dear ${order.customerInfo.name},</p>
					
					<p>Thank you for your order with Glister London. We are delighted to serve you and will process your order shortly.</p>

					<div class="order-details">
						<h2>Order Summary</h2>
						<p><strong>Order Number:</strong> ${order.orderNumber}</p>
						<p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-GB', { 
							day: 'numeric', 
							month: 'long', 
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}</p>
					</div>

					<div class="order-details">
						<h2>Order Items</h2>
						<table>
							<thead>
								<tr>
									<th>Product</th>
									<th style="text-align: center;">Qty</th>
									<th style="text-align: right;">Price</th>
								</tr>
							</thead>
							<tbody>
								${order.items.map(item => `
									<tr>
										<td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
											<strong>${item.productName}</strong><br>
											<small style="color: #666;">${item.productCode}</small>
										</td>
										<td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
										<td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatPrice(item.totalPrice)}</td>
									</tr>
								`).join('')}

								<!-- Pricing Summary -->
								<tr>
									<td colspan="2" style="padding: 12px; text-align: right; border-top: 2px solid #e5e5e5;">
										<span style="color: #666;">Subtotal:</span>
									</td>
									<td style="padding: 12px; text-align: right; border-top: 2px solid #e5e5e5;">
										${formatPrice(order.pricing.subtotal)}
									</td>
								</tr>

								${order.discountCode && order.pricing.discount ? `
								<tr style="background-color: #d4edda;">
									<td colspan="2" style="padding: 12px; text-align: right;">
										<div>
											<span style="color: #155724; font-weight: bold;">💰 Discount Applied</span><br>
											<span style="color: #666; font-size: 12px; font-family: monospace;">${order.discountCode}</span>
										</div>
									</td>
									<td style="padding: 12px; text-align: right; color: #155724; font-weight: bold;">
										-${formatPrice(order.pricing.discount)}
									</td>
								</tr>
								` : ''}

								<tr>
									<td colspan="2" style="padding: 12px; text-align: right;">
										<span style="color: #666;">Shipping:</span>
									</td>
									<td style="padding: 12px; text-align: right;">
										${formatPrice(order.pricing.shipping)}
									</td>
								</tr>

								<tr>
									<td colspan="2" style="padding: 12px; text-align: right;">
										<span style="color: #666;">Tax:</span>
									</td>
									<td style="padding: 12px; text-align: right;">
										${formatPrice(order.pricing.tax)}
									</td>
								</tr>

								<tr class="total-row">
									<td colspan="2" style="padding: 20px 12px; text-align: right; border-top: 2px solid #2c3e50; font-size: 18px;">
										<strong>Total:</strong>
									</td>
									<td style="padding: 20px 12px; text-align: right; border-top: 2px solid #2c3e50; font-size: 18px;">
										<strong>${formatPrice(order.pricing.total)}</strong>
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div class="order-details">
						<h2>Delivery Address</h2>
						<p>
							${order.deliveryAddress.addressLine1}<br>
							${order.deliveryAddress.addressLine2 ? order.deliveryAddress.addressLine2 + '<br>' : ''}
							${order.deliveryAddress.city}, ${order.deliveryAddress.postcode}<br>
							${order.deliveryAddress.country}
						</p>
					</div>

					<div class="info-box">
						<h3 style="margin-top: 0;">💳 Payment Information</h3>
						<p>We will send you payment instructions shortly via email. Payment will be collected after we confirm your order details.</p>
						<p><strong>Payment Status:</strong> Awaiting Confirmation</p>
					</div>

					<div class="info-box">
						<h3 style="margin-top: 0;">📦 What's Next?</h3>
						<ol style="margin: 10px 0; padding-left: 20px;">
							<li>We'll review your order details</li>
							<li>You'll receive payment instructions via email</li>
							<li>Once payment is confirmed, we'll prepare your order</li>
							<li>You'll receive tracking information when your order ships</li>
						</ol>
					</div>

					<p>If you have any questions about your order, please don't hesitate to contact us.</p>

					<p style="margin-top: 30px;">
						Best regards,<br>
						<strong>The Glister London Team</strong><br>
						<em>The Soul of Interior</em>
					</p>
				</div>
				<div class="footer">
					<p>This is an automated confirmation email. Please do not reply to this email.</p>
					<p>&copy; ${new Date().getFullYear()} Glister London. All rights reserved.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	// Send admin notification
	const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USERNAME;
	await transporter.sendMail({
		from: `Glister London <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
		to: adminEmail,
		subject: `🎉 New Order #${order.orderNumber} - ${order.customerInfo.name}`,
		html: adminEmailHTML
	});

	// Send customer confirmation
	await transporter.sendMail({
		from: `Glister London <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
		to: order.customerInfo.email,
		subject: `Order Confirmation #${order.orderNumber} - Glister London`,
		html: customerEmailHTML
	});
}

/**
 * Create a new order from cart
 * POST /api/orders
 */
exports.createOrder = async (req, res, next) => {
	try {
		const { sessionID, deliveryAddressId, orderNotes } = req.body;
		const userId = req.user.userId;

		console.log('[Create Order] Starting order creation:', { userId, sessionID, deliveryAddressId });

		if (!sessionID) {
			return res.status(400).json({
				success: false,
				message: 'Session ID is required'
			});
		}

		// Get user details
		const user = await User.findById(userId);
		if (!user) {
			console.error('[Create Order] User not found:', userId);
			return res.status(404).json({
				success: false,
				message: 'User not found'
			});
		}

		// Ensure cart is linked to user if it isn't already
		let cart = await Cart.findOne({ sessionID }).populate('items.productID');
		if (!cart) {
			console.error('[Create Order] Cart not found for sessionID:', sessionID);
			return res.status(400).json({
				success: false,
				message: 'Cart not found. Please add items to your cart.'
			});
		}

		// Link cart to user if not already linked
		if (!cart.userID || cart.userID.toString() !== userId.toString()) {
			console.log('[Create Order] Linking cart to user');
			cart.userID = userId;
			await cart.save();
		}

		if (!cart.items || cart.items.length === 0) {
			console.error('[Create Order] Cart is empty');
			return res.status(400).json({
				success: false,
				message: 'Cart is empty'
			});
		}

		// Validate user has addresses
		if (!user.addresses || !Array.isArray(user.addresses) || user.addresses.length === 0) {
			console.error('[Create Order] User has no addresses:', userId);
			return res.status(400).json({
				success: false,
				message: 'No delivery addresses found. Please add a delivery address in your profile.'
			});
		}

		// Get delivery address
		let deliveryAddress;
		if (deliveryAddressId) {
			deliveryAddress = user.addresses.id(deliveryAddressId);
			if (!deliveryAddress) {
				console.error('[Create Order] Invalid delivery address ID:', deliveryAddressId);
				return res.status(400).json({
					success: false,
					message: 'Invalid delivery address'
				});
			}
		} else {
			// Use default address
			deliveryAddress = user.addresses.find(addr => addr.isDefault);
			if (!deliveryAddress) {
				// If no default, use first address
				deliveryAddress = user.addresses[0];
			}
			if (!deliveryAddress) {
				console.error('[Create Order] No delivery address available');
				return res.status(400).json({
					success: false,
					message: 'No delivery address found. Please add a delivery address in your profile.'
				});
			}
		}

		// Generate unique order number
		const orderCount = await Order.countDocuments();
		const orderNumber = `GL${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(orderCount + 1).padStart(5, '0')}`;

		// Calculate pricing
		const subtotal = cart.subtotal.$numberDecimal ? parseFloat(cart.subtotal.$numberDecimal) : parseFloat(cart.subtotal);
		const discount = cart.discountAmount?.$numberDecimal ? parseFloat(cart.discountAmount.$numberDecimal) : parseFloat(cart.discountAmount || 0);
		const shipping = 0; // TBD
		const tax = 0; // TBD
		const total = Math.max(0, subtotal - discount + shipping + tax);

		// Create order
		const order = new Order({
			orderNumber,
			userID: userId,
			sessionID,
			items: cart.items.map(item => ({
				productID: item.productID,
				productName: item.productName,
				productCode: item.productCode,
				selectedMaterial: item.selectedMaterial,
				selectedSize: item.selectedSize,
				selectedSizeName: item.selectedSizeName,
				sizeCost: item.sizeCost,
				selectedFinish: item.selectedFinish,
				finishCost: item.finishCost,
				packagingPrice: item.packagingPrice,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: item.totalPrice,
				priceBreakdown: item.priceBreakdown
			})),
			customerInfo: {
				name: user.name,
				email: user.email,
				phone: user.phone || ''
			},
			deliveryAddress: {
				label: deliveryAddress.label,
				addressLine1: deliveryAddress.addressLine1,
				addressLine2: deliveryAddress.addressLine2,
				city: deliveryAddress.city,
				county: deliveryAddress.county,
				postcode: deliveryAddress.postcode,
				country: deliveryAddress.country
			},
			orderNotes,
			discountCode: cart.discountCode || undefined,
			discountAmount: cart.discountAmount || 0,
			offerID: cart.offerID || undefined,
			pricing: {
				subtotal: cart.subtotal,
				discount: cart.discountAmount || 0,
				shipping: shipping,
				tax: tax,
				total: total
			},
		status: 'pending',
		orderStatusHistory: [{
			status: 'pending',
			note: 'Order placed',
			updatedAt: new Date()
		}],
		paymentInfo: {
			status: 'awaiting_payment'
		},
		paymentStatusHistory: [{
			status: 'awaiting_payment',
			note: 'Payment awaiting',
			updatedAt: new Date()
		}]
		});

		await order.save();
		console.log('[Create Order] Order created successfully:', order.orderNumber);

		// Increment offer usage count if discount was applied
		if (cart.offerID) {
			const Offer = require('../models/Offer');
			const offer = await Offer.findById(cart.offerID);
			if (offer) {
				offer.usedCount = (offer.usedCount || 0) + 1;
				await offer.save();
			}
		}

		// Clear the cart
		cart.items = [];
		cart.status = 'completed';
		cart.discountCode = undefined;
		cart.discountAmount = 0;
		cart.offerID = undefined;
		await cart.save();

		// Send email notifications
		try {
			await sendOrderEmails(order, user);
			console.log('[Create Order] Order confirmation emails sent');
		} catch (emailError) {
			console.error('[Create Order] Email sending failed:', emailError);
			// Don't fail the order if email fails
		}

		const populatedOrder = await Order.findById(order._id).populate('items.productID');
		
		res.status(201).json({
			success: true,
			message: 'Order placed successfully',
			order: populatedOrder
		});
	} catch (error) {
		console.error('[Create Order] Error creating order:', {
			error: error.message,
			stack: error.stack,
			userId: req.user?.userId,
			sessionID: req.body?.sessionID
		});
		res.status(500).json({
			success: false,
			message: 'Error creating order',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Get user's orders
 * GET /api/orders
 */
exports.getOrders = async (req, res, next) => {
	try {
		const userId = req.user.userId;
		const { status, page = 1, limit = 10 } = req.query;

		const query = { userID: userId };
		if (status && status !== 'all') {
			query.status = status;
		}

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const orders = await Order.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit))
			.populate('items.productID');

		const total = await Order.countDocuments(query);

		res.json({
			success: true,
			orders,
			pagination: {
				total,
				page: parseInt(page),
				limit: parseInt(limit),
				pages: Math.ceil(total / parseInt(limit))
			}
		});
	} catch (error) {
		console.error('Get orders error:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching orders',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Get single order details
 * GET /api/orders/:orderId
 */
exports.getOrderById = async (req, res, next) => {
	try {
		const { orderId } = req.params;
		const userId = req.user.userId;

		const order = await Order.findOne({ 
			_id: orderId, 
			userID: userId 
		}).populate('items.productID');

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

		res.json({
			success: true,
			order
		});
	} catch (error) {
		console.error('Get order error:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching order',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Request refund for an order
 * PUT /api/orders/:orderId/refund
 */
exports.requestRefund = async (req, res, next) => {
	try {
		const { orderId } = req.params;
		const { reason } = req.body;
		const userId = req.user.userId;

		const order = await Order.findOne({ 
			_id: orderId, 
			userID: userId 
		});

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

		// Only delivered orders can request refund
		if (order.status !== 'delivered') {
			return res.status(400).json({
				success: false,
				message: 'Only delivered orders can request a refund'
			});
		}

		// Check if refund already requested
		if (['refund_requested', 'refund_processing', 'refund_completed'].includes(order.status)) {
			return res.status(400).json({
				success: false,
				message: 'Refund already requested for this order'
			});
		}

		order.status = 'refund_requested';
		order.refundInfo = {
			reason: reason || 'Customer requested refund',
			requestedAt: new Date(),
			refundAmount: order.pricing.total
		};

		await order.save();

		res.json({
			success: true,
			message: 'Refund requested successfully',
			order
		});
	} catch (error) {
		console.error('Request refund error:', error);
		res.status(500).json({
			success: false,
			message: 'Error requesting refund',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Get order statistics for user
 * GET /api/orders/stats
 */
exports.getOrderStats = async (req, res, next) => {
	try {
		const userId = req.user.userId;

		const orders = await Order.find({ userID: userId });

		const stats = {
			totalOrders: orders.length,
			totalSpent: orders.reduce((sum, order) => {
				return sum + parseFloat(order.pricing.total?.toString() || 0);
			}, 0),
			ordersByStatus: {
				pending: orders.filter(o => o.status === 'pending').length,
				confirmed: orders.filter(o => o.status === 'confirmed').length,
				processing: orders.filter(o => o.status === 'processing').length,
				shipped: orders.filter(o => o.status === 'shipped').length,
				delivered: orders.filter(o => o.status === 'delivered').length,
				refund_requested: orders.filter(o => o.status === 'refund_requested').length,
				refund_processing: orders.filter(o => o.status === 'refund_processing').length,
				refund_completed: orders.filter(o => o.status === 'refund_completed').length,
				cancelled: orders.filter(o => o.status === 'cancelled').length
			},
			recentOrders: orders
				.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
				.slice(0, 5)
		};

		res.json({
			success: true,
			stats
		});
	} catch (error) {
		console.error('Get order stats error:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching order statistics',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Update order status (Admin only)
 * PUT /api/orders/:orderId/status
 */
exports.updateOrderStatus = async (req, res, next) => {
	try {
		const { orderId } = req.params;
		const { status, note } = req.body;
		const userId = req.user.userId;

		if (!status) {
			return res.status(400).json({
				success: false,
				message: 'Status is required'
			});
		}

		const validStatuses = [
			'pending', 'confirmed', 'processing', 'shipped', 'delivered',
			'refund_requested', 'refund_processing', 'refund_completed', 'cancelled'
		];

		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid status'
			});
		}

		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

	// Store the note temporarily for the pre-save hook to access
	order._statusNote = note;
	order._statusUpdatedBy = userId;
	order.status = status;

		// Update refund info if status is refund-related
		if (status === 'refund_processing' && !order.refundInfo.processedAt) {
			order.refundInfo.processedAt = new Date();
		} else if (status === 'refund_completed' && !order.refundInfo.completedAt) {
			order.refundInfo.completedAt = new Date();
			order.paymentInfo.status = 'refunded';
		}

		await order.save();

		res.json({
			success: true,
			message: 'Order status updated successfully',
			order: await Order.findById(orderId).populate('items.productID')
		});
	} catch (error) {
		console.error('Update order status error:', error);
		res.status(500).json({
			success: false,
			message: 'Error updating order status',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Get single order details (Admin only)
 * GET /api/orders/admin/:orderId
 */
exports.getOrderByIdAdmin = async (req, res, next) => {
	try {
		const { orderId } = req.params;

		const order = await Order.findById(orderId)
			.populate('items.productID')
			.populate('userID', 'name email')
			.populate('adminMessages.createdBy', 'name');

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

		res.json({
			success: true,
			order
		});
	} catch (error) {
		console.error('Get order error:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching order',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Get all orders (Admin only)
 * GET /api/orders/admin/all
 */
exports.getAllOrders = async (req, res, next) => {
	try {
		const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;

		const query = {};
		
		// Filter by order status
		if (status && status !== 'all') {
			query.status = status;
		}

		// Filter by payment status
		if (paymentStatus && paymentStatus !== 'all') {
			query['paymentInfo.status'] = paymentStatus;
		}

		// Search by customer name, email, or order number
		if (search && search.trim() !== '') {
			const searchRegex = new RegExp(search.trim(), 'i');
			query.$or = [
				{ 'customerInfo.name': searchRegex },
				{ 'customerInfo.email': searchRegex },
				{ orderNumber: searchRegex }
			];
		}

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const orders = await Order.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit))
			.populate('items.productID')
			.populate('userID', 'name email');

		const total = await Order.countDocuments(query);

		// Calculate stats
		const allOrders = await Order.find({});
		const stats = {
			totalOrders: allOrders.length,
			pendingOrders: allOrders.filter(o => o.status === 'pending').length,
			totalRevenue: allOrders.reduce((sum, order) => {
				return sum + parseFloat(order.pricing.total?.toString() || 0);
			}, 0)
		};

		res.json({
			success: true,
			orders,
			stats,
			pagination: {
				total,
				page: parseInt(page),
				limit: parseInt(limit),
				pages: Math.ceil(total / parseInt(limit))
			}
		});
	} catch (error) {
		console.error('Get all orders error:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching orders',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Add admin message to order
 * POST /api/orders/:orderId/admin-message
 */
exports.addAdminMessage = async (req, res, next) => {
	try {
		const { orderId } = req.params;
		const { message } = req.body;
		const userId = req.user.userId;

		if (!message || message.trim() === '') {
			return res.status(400).json({
				success: false,
				message: 'Message is required'
			});
		}

		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

		// Add message to order
		order.adminMessages.push({
			message: message.trim(),
			createdAt: new Date(),
			createdBy: userId
		});

		await order.save();

		// Send email notification to customer
		try {
			const transporter = nodemailer.createTransport({
				service: process.env.EMAIL_SERVICE || 'gmail',
				auth: {
					user: process.env.EMAIL_USERNAME,
					pass: process.env.EMAIL_PASSWORD
				}
			});

			const formatPrice = (price) => {
				const amount = typeof price === 'object' && price.$numberDecimal 
					? parseFloat(price.$numberDecimal) 
					: parseFloat(price);
				return `£${amount.toFixed(2)}`;
			};

			const statusLabels = {
				pending: 'Pending',
				confirmed: 'Confirmed',
				processing: 'Processing',
				shipped: 'Shipped',
				delivered: 'Delivered',
				refund_requested: 'Refund Requested',
				refund_processing: 'Refund Processing',
				refund_completed: 'Refund Completed',
				cancelled: 'Cancelled'
			};

			const customerEmailHTML = `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
						.container { max-width: 600px; margin: 0 auto; padding: 20px; }
						.header { background-color: #2C2C2C; color: #D4AF37; padding: 30px; text-align: center; }
						.content { background-color: #f9f9f9; padding: 20px; }
						.message-box { background-color: white; border-left: 4px solid #D4AF37; padding: 20px; margin: 20px 0; border-radius: 4px; }
						.order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
						.status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; background-color: #D4AF37; color: #2C2C2C; font-weight: bold; }
						.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h1>✨ GLISTER LONDON</h1>
							<h2 style="margin-top: 10px;">The Soul of Interior</h2>
							<p style="margin-top: 20px; font-size: 16px;">Order Update</p>
						</div>
						<div class="content">
							<p>Dear ${order.customerInfo.name},</p>
							
							<p>We have an important update regarding your order.</p>

							<div class="order-details">
								<h2>Order Information</h2>
								<p><strong>Order Number:</strong> ${order.orderNumber}</p>
								<p><strong>Current Status:</strong> <span class="status-badge">${statusLabels[order.status] || order.status.toUpperCase()}</span></p>
								<p><strong>Order Total:</strong> ${formatPrice(order.pricing.total)}</p>
							</div>

							<div class="message-box">
								<h3 style="margin-top: 0; color: #D4AF37;">📩 Message from Glister London</h3>
								<p style="font-size: 16px; line-height: 1.8;">${message.replace(/\n/g, '<br>')}</p>
								<p style="font-size: 12px; color: #666; margin-top: 15px;">
									Sent on ${new Date().toLocaleString('en-GB', { 
										day: 'numeric', 
										month: 'long', 
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</p>
							</div>

							<p>If you have any questions or concerns, please don't hesitate to contact us.</p>

							<p style="margin-top: 30px;">
								Best regards,<br>
								<strong>The Glister London Team</strong><br>
								<em>The Soul of Interior</em>
							</p>
						</div>
						<div class="footer">
							<p>This is an automated notification email.</p>
							<p>&copy; ${new Date().getFullYear()} Glister London. All rights reserved.</p>
						</div>
					</div>
				</body>
				</html>
			`;

			await transporter.sendMail({
				from: `Glister London <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
				to: order.customerInfo.email,
				subject: `Order Update #${order.orderNumber} - Glister London`,
				html: customerEmailHTML
			});
		} catch (emailError) {
			console.error('Email sending failed:', emailError);
			// Don't fail the request if email fails
		}

		res.json({
			success: true,
			message: 'Admin message added and customer notified',
			order: await Order.findById(orderId).populate('items.productID').populate('userID', 'name email')
		});
	} catch (error) {
		console.error('Add admin message error:', error);
		res.status(500).json({
			success: false,
			message: 'Error adding admin message',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

/**
 * Update payment status (Admin only)
 * PUT /api/orders/:orderId/payment-status
 */
exports.updatePaymentStatus = async (req, res, next) => {
	try {
		const { orderId } = req.params;
		const { paymentStatus } = req.body;
		const userId = req.user.userId;

		if (!paymentStatus) {
			return res.status(400).json({
				success: false,
				message: 'Payment status is required'
			});
		}

		const validPaymentStatuses = [
			'pending', 'awaiting_payment', 'paid', 'partially_paid', 
			'payment_failed', 'payment_pending_confirmation', 'refunded'
		];

		if (!validPaymentStatuses.includes(paymentStatus)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid payment status'
			});
		}

		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

	// Store the note temporarily for the pre-save hook to access
	order._paymentStatusNote = `Payment status updated to: ${paymentStatus}`;
	order._paymentStatusUpdatedBy = userId;
	
	order.paymentInfo.status = paymentStatus;
	
	// Update paidAt date if status is paid
	if (paymentStatus === 'paid' && !order.paymentInfo.paidAt) {
		order.paymentInfo.paidAt = new Date();
	}

		await order.save();

		res.json({
			success: true,
			message: 'Payment status updated successfully',
			order: await Order.findById(orderId).populate('items.productID').populate('userID', 'name email')
		});
	} catch (error) {
		console.error('Update payment status error:', error);
		res.status(500).json({
			success: false,
			message: 'Error updating payment status',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};

