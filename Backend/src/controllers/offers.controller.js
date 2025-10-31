const Offer = require('../models/Offer');

/**
 * Create a new offer
 * POST /api/offers
 */
async function createOffer(req, res) {
	try {
		const offerData = {
			...req.body,
			code: req.body.code?.toUpperCase().trim(),
			discountValue: parseFloat(req.body.discountValue) || 0,
			minOrderAmount: parseFloat(req.body.minOrderAmount) || 0,
			maxUses: req.body.maxUses ? parseInt(req.body.maxUses) : null,
			usedCount: 0,
			createdBy: req.user?.userId
		};

		// Validate discount value
		if (offerData.discountType === 'percentage' && (offerData.discountValue < 0 || offerData.discountValue > 100)) {
			return res.status(400).json({ message: 'Percentage discount must be between 0 and 100' });
		}

		if (offerData.discountType === 'fixed' && offerData.discountValue < 0) {
			return res.status(400).json({ message: 'Fixed discount must be greater than 0' });
		}

		const offer = await Offer.create(offerData);
		return res.status(201).json(offer);
	} catch (err) {
		if (err.code === 11000) {
			return res.status(400).json({ message: 'Offer code already exists' });
		}
		return res.status(400).json({ message: err.message });
	}
}

/**
 * Get all offers
 * GET /api/offers
 */
async function listOffers(req, res) {
	try {
		const { active } = req.query;
		const query = {};
		
		if (active === 'true') {
			query.isActive = true;
			const now = new Date();
			query.$or = [
				{ validFrom: { $lte: now } },
				{ validFrom: null }
			];
			query.$and = [
				{
					$or: [
						{ validTo: { $gte: now } },
						{ validTo: null }
					]
				}
			];
		}
		
		const offers = await Offer.find(query)
			.sort({ createdAt: -1 })
			.populate('createdBy', 'name email')
			.lean();
			
		return res.json(offers);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

/**
 * Get single offer
 * GET /api/offers/:id
 */
async function getOfferById(req, res) {
	try {
		const offer = await Offer.findById(req.params.id)
			.populate('createdBy', 'name email')
			.lean();
			
		if (!offer) {
			return res.status(404).json({ message: 'Offer not found' });
		}
		
		return res.json(offer);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

/**
 * Update offer
 * PATCH /api/offers/:id
 */
async function updateOffer(req, res) {
	try {
		const updateData = { ...req.body };
		
		if (updateData.code) {
			updateData.code = updateData.code.toUpperCase().trim();
		}
		
		if (updateData.discountValue !== undefined) {
			updateData.discountValue = parseFloat(updateData.discountValue) || 0;
		}
		
		if (updateData.minOrderAmount !== undefined) {
			updateData.minOrderAmount = parseFloat(updateData.minOrderAmount) || 0;
		}
		
		if (updateData.maxUses !== undefined) {
			updateData.maxUses = updateData.maxUses ? parseInt(updateData.maxUses) : null;
		}

		// Validate discount value if provided
		if (updateData.discountType === 'percentage' && updateData.discountValue !== undefined) {
			if (updateData.discountValue < 0 || updateData.discountValue > 100) {
				return res.status(400).json({ message: 'Percentage discount must be between 0 and 100' });
			}
		}

		if (updateData.discountType === 'fixed' && updateData.discountValue !== undefined) {
			if (updateData.discountValue < 0) {
				return res.status(400).json({ message: 'Fixed discount must be greater than 0' });
			}
		}
		
		const offer = await Offer.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true, runValidators: true }
		).populate('createdBy', 'name email');
		
		if (!offer) {
			return res.status(404).json({ message: 'Offer not found' });
		}
		
		return res.json(offer);
	} catch (err) {
		if (err.code === 11000) {
			return res.status(400).json({ message: 'Offer code already exists' });
		}
		return res.status(400).json({ message: err.message });
	}
}

/**
 * Delete offer
 * DELETE /api/offers/:id
 */
async function deleteOffer(req, res) {
	try {
		const offer = await Offer.findByIdAndDelete(req.params.id);
		
		if (!offer) {
			return res.status(404).json({ message: 'Offer not found' });
		}
		
		return res.json({ message: 'Offer deleted successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

/**
 * Validate and apply offer code
 * POST /api/offers/validate
 */
async function validateOffer(req, res) {
	try {
		const { code, amount, userId } = req.body;
		
		if (!code) {
			return res.status(400).json({ message: 'Offer code is required' });
		}
		
		const offer = await Offer.findOne({ code: code.toUpperCase().trim() });
		
		if (!offer) {
			return res.status(404).json({ message: 'Invalid offer code' });
		}

		// Check if user is new (for applicableTo: 'new_users')
		let userIsNew = false;
		if (userId) {
			const User = require('../models/User');
			const user = await User.findById(userId);
			if (user) {
				// Check if user has any completed orders
				const Order = require('../models/Order');
				const completedOrders = await Order.countDocuments({ 
					userID: userId,
					status: { $in: ['delivered', 'completed'] }
				});
				userIsNew = completedOrders === 0;
			}
		}

		// Validate offer
		const validation = offer.isValid(userIsNew);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.reason });
		}

		// Check minimum order amount
		const orderAmount = parseFloat(amount) || 0;
		const minAmount = parseFloat(offer.minOrderAmount?.toString() || 0);
		if (orderAmount < minAmount) {
			return res.status(400).json({ 
				message: `Minimum order amount of ${minAmount.toFixed(2)} is required for this offer` 
			});
		}

		// Calculate discount
		const discount = offer.calculateDiscount(orderAmount);
		
		return res.json({
			valid: true,
			offer: {
				_id: offer._id,
				code: offer.code,
				description: offer.description,
				discountType: offer.discountType,
				discountValue: parseFloat(offer.discountValue.toString()),
				discountAmount: discount
			}
		});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

/**
 * Increment usage count (called when order is placed)
 * POST /api/offers/:id/increment-usage
 */
async function incrementUsage(req, res) {
	try {
		const offer = await Offer.findById(req.params.id);
		
		if (!offer) {
			return res.status(404).json({ message: 'Offer not found' });
		}
		
		offer.usedCount = (offer.usedCount || 0) + 1;
		await offer.save();
		
		return res.json({ message: 'Usage count updated', offer });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

module.exports = {
	createOffer,
	listOffers,
	getOfferById,
	updateOffer,
	deleteOffer,
	validateOffer,
	incrementUsage
};

