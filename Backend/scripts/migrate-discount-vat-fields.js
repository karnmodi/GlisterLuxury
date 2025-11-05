/**
 * Database Migration Script: Discount Metadata & VAT Breakdown
 *
 * This script backfills the following fields for existing carts and orders:
 * 1. discountType and discountValue (discount metadata)
 * 2. Item-level VAT breakdown (materialVAT, sizeVAT, finishesVAT, packagingVAT, totalVAT)
 * 3. Item-level unitPriceVAT and totalPriceVAT
 *
 * Usage: node scripts/migrate-discount-vat-fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const Offer = require('../src/models/Offer');
const VATService = require('../src/services/vat.service');

async function migrateDiscountMetadata() {
	console.log('\n=== Migrating Discount Metadata ===\n');

	// Migrate Carts
	const cartsWithDiscount = await Cart.find({ offerID: { $exists: true, $ne: null } }).populate('offerID');
	console.log(`Found ${cartsWithDiscount.length} carts with discount codes to migrate`);

	let cartsUpdated = 0;
	for (const cart of cartsWithDiscount) {
		if (cart.offerID && cart.offerID.discountType && cart.offerID.discountValue) {
			cart.discountType = cart.offerID.discountType;
			cart.discountValue = cart.offerID.discountValue;
			await cart.save();
			cartsUpdated++;
		}
	}
	console.log(`✓ Updated ${cartsUpdated} carts with discount metadata\n`);

	// Migrate Orders
	const ordersWithDiscount = await Order.find({ offerID: { $exists: true, $ne: null } }).populate('offerID');
	console.log(`Found ${ordersWithDiscount.length} orders with discount codes to migrate`);

	let ordersUpdated = 0;
	for (const order of ordersWithDiscount) {
		if (order.offerID && order.offerID.discountType && order.offerID.discountValue) {
			order.discountType = order.offerID.discountType;
			order.discountValue = order.offerID.discountValue;
			await order.save();
			ordersUpdated++;
		}
	}
	console.log(`✓ Updated ${ordersUpdated} orders with discount metadata\n`);
}

async function migrateVATBreakdown() {
	console.log('=== Migrating VAT Breakdown ===\n');

	// Migrate Cart Items
	const allCarts = await Cart.find({ items: { $exists: true, $ne: [] } });
	console.log(`Found ${allCarts.length} carts with items to migrate`);

	let cartItemsUpdated = 0;
	for (const cart of allCarts) {
		let cartModified = false;

		for (const item of cart.items) {
			// Calculate VAT breakdown using VATService
			const vatData = VATService.calculateItemVAT(item);

			// Update priceBreakdown with VAT fields
			if (!item.priceBreakdown) {
				item.priceBreakdown = {};
			}
			item.priceBreakdown.materialVAT = vatData.priceBreakdown.materialVAT;
			item.priceBreakdown.sizeVAT = vatData.priceBreakdown.sizeVAT;
			item.priceBreakdown.finishesVAT = vatData.priceBreakdown.finishesVAT;
			item.priceBreakdown.packagingVAT = vatData.priceBreakdown.packagingVAT;
			item.priceBreakdown.totalVAT = vatData.priceBreakdown.totalVAT;

			// Update item-level VAT amounts
			item.unitPriceVAT = vatData.unitPriceVAT;
			item.totalPriceVAT = vatData.totalPriceVAT;

			cartModified = true;
			cartItemsUpdated++;
		}

		if (cartModified) {
			await cart.save();
		}
	}
	console.log(`✓ Updated ${cartItemsUpdated} cart items with VAT breakdown\n`);

	// Migrate Order Items
	const allOrders = await Order.find({ items: { $exists: true, $ne: [] } });
	console.log(`Found ${allOrders.length} orders with items to migrate`);

	let orderItemsUpdated = 0;
	for (const order of allOrders) {
		let orderModified = false;

		for (const item of order.items) {
			// Calculate VAT breakdown using VATService
			const vatData = VATService.calculateItemVAT(item);

			// Update priceBreakdown with VAT fields
			if (!item.priceBreakdown) {
				item.priceBreakdown = {};
			}
			item.priceBreakdown.materialVAT = vatData.priceBreakdown.materialVAT;
			item.priceBreakdown.sizeVAT = vatData.priceBreakdown.sizeVAT;
			item.priceBreakdown.finishesVAT = vatData.priceBreakdown.finishesVAT;
			item.priceBreakdown.packagingVAT = vatData.priceBreakdown.packagingVAT;
			item.priceBreakdown.totalVAT = vatData.priceBreakdown.totalVAT;

			// Update item-level VAT amounts
			item.unitPriceVAT = vatData.unitPriceVAT;
			item.totalPriceVAT = vatData.totalPriceVAT;

			orderModified = true;
			orderItemsUpdated++;
		}

		if (orderModified) {
			await order.save();
		}
	}
	console.log(`✓ Updated ${orderItemsUpdated} order items with VAT breakdown\n`);
}

async function main() {
	try {
		console.log('\n========================================');
		console.log('Discount Metadata & VAT Migration');
		console.log('========================================\n');

		// Connect to MongoDB
		console.log('Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGO_URI);
		console.log('✓ Connected to MongoDB\n');

		// Run migrations
		await migrateDiscountMetadata();
		await migrateVATBreakdown();

		console.log('========================================');
		console.log('✓ Migration completed successfully!');
		console.log('========================================\n');

		process.exit(0);
	} catch (error) {
		console.error('\n✗ Migration failed:', error);
		process.exit(1);
	}
}

// Run migration
main();
