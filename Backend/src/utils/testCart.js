const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Finish = require('../models/Finish');
const MaterialMaster = require('../models/MaterialMaster');
require('dotenv').config();

async function testCart() {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glister');
		console.log('✅ MongoDB connected successfully\n');

		// Generate a test session ID
		const sessionID = `test-session-${Date.now()}`;
		console.log(`📦 Creating cart for session: ${sessionID}\n`);

		// Fetch a sample product (MP-111)
		const product = await Product.findOne({ productID: 'MP-111' }).lean();
		if (!product) {
			console.error('❌ Product MP-111 not found. Please run seedProducts.js first');
			process.exit(1);
		}

		console.log(`🛍️  Product Selected: ${product.name} (${product.productID})`);
		console.log(`   Base Material: ${product.materials[0]?.name}`);
		console.log(`   Base Price: ₹${product.materials[0]?.basePrice}\n`);

		// Fetch available finish (only one)
		const availableFinish = await Finish.findOne({
			_id: { $in: product.finishes.map(f => f.finishID) }
		}).lean(); // Select only 1 finish

		console.log(`🎨 Selected Finish: ${availableFinish.name}\n`);

		// Prepare cart item data
		const cartItemData = {
			sessionID: sessionID,
			productID: product._id,
			selectedMaterial: {
				materialID: product.materials[0].materialID,
				name: product.materials[0].name,
				basePrice: product.materials[0].basePrice,
			},
			selectedFinish: availableFinish._id, // Only one finish
			quantity: 2, // Order 2 sets
		};

		console.log('🔄 Adding item to cart...\n');

		// Calculate pricing manually
		const { computePriceAndValidate } = require('./pricing');
		
		const selectedFinishes = cartItemData.selectedFinish ? [cartItemData.selectedFinish] : [];
		const priceData = await computePriceAndValidate({
			productID: product._id,
			selectedMaterial: cartItemData.selectedMaterial,
			selectedSize: cartItemData.selectedSize,
			selectedFinishes: selectedFinishes,
			quantity: cartItemData.quantity,
		});

		// Fetch finish details (only one)
		let finishDetail = null;
		if (cartItemData.selectedFinish) {
			const finishOption = product.finishes.find(f => String(f.finishID) === String(cartItemData.selectedFinish));
			if (availableFinish && finishOption) {
				finishDetail = {
					finishID: availableFinish._id,
					name: availableFinish.name,
					priceAdjustment: finishOption.priceAdjustment,
				};
			}
		}

		// Create cart
		const cart = new Cart({
			sessionID: sessionID,
			items: [{
				productID: product._id,
				productName: product.name,
				productCode: product.productID,
				selectedMaterial: {
					materialID: cartItemData.selectedMaterial.materialID,
					name: cartItemData.selectedMaterial.name,
					basePrice: priceData.breakdown.material,
				},
				selectedSize: cartItemData.selectedSize,
				sizeCost: priceData.breakdown.size,
				selectedFinish: finishDetail,
				finishCost: priceData.breakdown.finishes,
				packagingPrice: priceData.breakdown.packaging,
				quantity: cartItemData.quantity,
				unitPrice: priceData.unitPrice,
				totalPrice: priceData.totalAmount,
				priceBreakdown: priceData.breakdown,
			}],
		});

		await cart.save();
		console.log('✅ Item added to cart successfully!\n');

		// Display cart summary
		console.log('═══════════════════════════════════════════════════════');
		console.log('                    CART SUMMARY                       ');
		console.log('═══════════════════════════════════════════════════════\n');

		const item = cart.items[0];
		console.log(`Product: ${item.productName} (${item.productCode})`);
		console.log(`Material: ${item.selectedMaterial.name}`);
		console.log(`Finish: ${item.selectedFinish ? item.selectedFinish.name : 'None'}`);
		console.log(`Quantity: ${item.quantity} sets\n`);

		console.log('Price Breakdown (per unit):');
		console.log(`  Material Cost:    £${parseFloat(item.priceBreakdown.material.toString()).toFixed(2)}`);
		console.log(`  Size Cost:        £${parseFloat(item.priceBreakdown.size.toString()).toFixed(2)}`);
		console.log(`  Finish Cost:      £${parseFloat(item.priceBreakdown.finishes.toString()).toFixed(2)}`);
		console.log(`  Packaging Cost:   £${parseFloat(item.priceBreakdown.packaging.toString()).toFixed(2)}`);
		console.log(`  ─────────────────────────────────────────────────`);
		console.log(`  Unit Price:       £${parseFloat(item.unitPrice.toString()).toFixed(2)}\n`);

		console.log(`Total Quantity:     ${item.quantity} sets`);
		console.log(`Item Total:         £${parseFloat(item.totalPrice.toString()).toFixed(2)}\n`);

		console.log('═══════════════════════════════════════════════════════');
		console.log(`CART SUBTOTAL:      £${parseFloat(cart.subtotal.toString()).toFixed(2)}`);
		console.log('═══════════════════════════════════════════════════════\n');

		console.log(`✨ Cart ID: ${cart._id}`);
		console.log(`📋 Session ID: ${cart.sessionID}\n`);

		// Now get checkout summary
		console.log('🛒 Fetching Checkout Summary...\n');
		
		const populatedCart = await Cart.findById(cart._id)
			.populate('items.productID')
			.populate('items.selectedFinish.finishID');

		const checkoutSummary = {
			sessionID: populatedCart.sessionID,
			items: populatedCart.items.map(item => ({
				itemID: item._id,
				product: {
					code: item.productCode,
					name: item.productName,
				},
				selections: {
					material: item.selectedMaterial.name,
					size: item.selectedSize ? `${item.selectedSize}mm` : 'Standard',
					finish: item.selectedFinish ? item.selectedFinish.name : 'None',
				},
				pricing: {
					materialCost: parseFloat(item.priceBreakdown.material.toString()),
					sizeCost: parseFloat(item.priceBreakdown.size.toString()),
					finishCost: parseFloat(item.priceBreakdown.finishes.toString()),
					packagingCost: parseFloat(item.priceBreakdown.packaging.toString()),
					unitPrice: parseFloat(item.unitPrice.toString()),
				},
				quantity: item.quantity,
				totalPrice: parseFloat(item.totalPrice.toString()),
			})),
			totalItems: populatedCart.items.length,
			totalQuantity: populatedCart.items.reduce((sum, item) => sum + item.quantity, 0),
			subtotal: parseFloat(populatedCart.subtotal.toString()),
			currency: 'GBP',
			timestamp: new Date().toISOString(),
		};

		console.log('═══════════════════════════════════════════════════════');
		console.log('              CHECKOUT SUMMARY (JSON)                  ');
		console.log('═══════════════════════════════════════════════════════\n');
		console.log(JSON.stringify(checkoutSummary, null, 2));
		console.log('\n');

		console.log('✅ Test completed successfully!');

	} catch (error) {
		console.error('❌ Error:', error.message);
		console.error(error);
	} finally {
		await mongoose.connection.close();
		console.log('\n🔌 Database connection closed');
		process.exit(0);
	}
}

testCart();

