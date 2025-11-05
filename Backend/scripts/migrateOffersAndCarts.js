/**
 * Migration Script: Add auto-apply fields to existing Offers and Carts
 *
 * This script updates all existing offers and carts with the new auto-apply fields
 * Run this once after deploying the new schema changes
 *
 * Usage: node scripts/migrateOffersAndCarts.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Offer = require('../src/models/Offer');
const Cart = require('../src/models/Cart');

async function migrateOffers() {
	try {
		console.log('🔄 Starting Offers migration...');

		// Update all existing offers with new fields
		const result = await Offer.updateMany(
			{
				autoApply: { $exists: false }
			},
			{
				$set: {
					autoApply: false,
					priority: 0,
					applicationScope: 'cart',
					showInCart: true,
					autoApplyCount: 0,
					manualApplyCount: 0,
					applicableProducts: [],
					excludedProducts: [],
					applicableCategories: [],
					excludedCategories: [],
					isStackable: false
				}
			}
		);

		console.log(`✅ Updated ${result.modifiedCount} offers with new auto-apply fields`);

		// Update displayName for offers that don't have it
		const displayNameResult = await Offer.updateMany(
			{ displayName: { $exists: false } },
			[{ $set: { displayName: '$description' } }]
		);

		console.log(`✅ Set displayName for ${displayNameResult.modifiedCount} offers`);

		return result.modifiedCount + displayNameResult.modifiedCount;

	} catch (error) {
		console.error('❌ Error migrating offers:', error);
		throw error;
	}
}

async function migrateCarts() {
	try {
		console.log('🔄 Starting Carts migration...');

		// Update all existing carts with new fields
		const result = await Cart.updateMany(
			{
				isAutoApplied: { $exists: false }
			},
			{
				$set: {
					isAutoApplied: false,
					discountApplicationMethod: 'none',
					eligibleAutoOffers: [],
					manualCodeLocked: false
				}
			}
		);

		console.log(`✅ Updated ${result.modifiedCount} carts with new auto-apply tracking fields`);

		// For carts that have a discount applied, set the application method to 'manual'
		const discountedCartsResult = await Cart.updateMany(
			{
				discountCode: { $exists: true, $ne: null },
				discountApplicationMethod: 'none'
			},
			{
				$set: {
					discountApplicationMethod: 'manual',
					manualCodeLocked: true
				}
			}
		);

		console.log(`✅ Set ${discountedCartsResult.modifiedCount} existing discounted carts to manual application method`);

		return result.modifiedCount + discountedCartsResult.modifiedCount;

	} catch (error) {
		console.error('❌ Error migrating carts:', error);
		throw error;
	}
}

async function createIndexes() {
	try {
		console.log('🔄 Creating database indexes...');

		// Create indexes on Offer model
		await Offer.collection.createIndex({ autoApply: 1, isActive: 1, priority: -1 });
		await Offer.collection.createIndex({ minOrderAmount: 1, autoApply: 1 });

		console.log('✅ Created indexes on Offer collection');

	} catch (error) {
		console.error('❌ Error creating indexes:', error);
		throw error;
	}
}

async function runMigration() {
	try {
		// Connect to MongoDB
		console.log('📡 Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('✅ Connected to MongoDB\n');

		// Run migrations
		const offersUpdated = await migrateOffers();
		console.log('');

		const cartsUpdated = await migrateCarts();
		console.log('');

		await createIndexes();
		console.log('');

		// Summary
		console.log('='

.repeat(50));
		console.log('📊 MIGRATION SUMMARY');
		console.log('='.repeat(50));
		console.log(`Offers updated: ${offersUpdated}`);
		console.log(`Carts updated: ${cartsUpdated}`);
		console.log('='.repeat(50));
		console.log('✅ Migration completed successfully!\n');

		process.exit(0);

	} catch (error) {
		console.error('\n❌ Migration failed:', error);
		process.exit(1);
	}
}

// Run the migration
runMigration();
