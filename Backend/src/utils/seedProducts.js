const mongoose = require('mongoose');
const Product = require('../models/Product');
const MaterialMaster = require('../models/MaterialMaster');
const Finish = require('../models/Finish');
const Category = require('../models/Category');
require('dotenv').config();

async function seedProducts() {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glister');
		console.log('MongoDB connected successfully');

		// Fetch required data
		const ss304Material = await MaterialMaster.findOne({ name: 'SS 304' });
		if (!ss304Material) {
			console.error('❌ SS 304 material not found. Please run seedMaterials.js first');
			process.exit(1);
		}

		const mortiseCategory = await Category.findOne({ name: 'Mortise Handles' });
		if (!mortiseCategory) {
			console.error('❌ Mortise Handles category not found. Please run seedCategories.js first');
			process.exit(1);
		}

		// Fetch all finishes needed
		const finishNames = ['SS', 'Brass Antique', 'Black Matt', 'PVD Gold', 'PVD Rose Gold'];
		const finishes = await Finish.find({ name: { $in: finishNames } });
		
		if (finishes.length !== finishNames.length) {
			console.error('❌ Some finishes not found. Please run seedFinishes.js first');
			console.log('   Found finishes:', finishes.map(f => f.name));
			process.exit(1);
		}

		// Create finish options array
		const finishOptions = finishes.map(finish => ({
			finishID: finish._id,
			priceAdjustment: 0, // Base price, can be adjusted later
		}));

		// Sample products from the images
		const products = [
			{
				productID: 'MP-111',
				name: 'MP-111 Mortise Handle',
				description: 'Premium mortise handle in SS 304 with multiple finish options',
				category: mortiseCategory._id,
				packagingUnit: 'Set',
				packagingPrice: 0,
				materials: [
					{
						materialID: ss304Material._id,
						name: ss304Material.name,
						basePrice: 1500, // Base price in your currency
						sizeOptions: [], // Can add size options if needed
					},
				],
				finishes: finishOptions,
				imageURLs: [],
			},
			{
				productID: 'M-110',
				name: 'M-110 Mortise Handle',
				description: 'Modern mortise handle in SS 304 with premium finishes',
				category: mortiseCategory._id,
				packagingUnit: 'Set',
				packagingPrice: 0,
				materials: [
					{
						materialID: ss304Material._id,
						name: ss304Material.name,
						basePrice: 1450, // Base price in your currency
						sizeOptions: [], // Can add size options if needed
					},
				],
				finishes: finishOptions,
				imageURLs: [],
			},
		];

		let inserted = 0;
		let skipped = 0;

		for (const product of products) {
			try {
				const existing = await Product.findOne({ productID: product.productID });
				if (existing) {
					console.log(`⚠️  Skipped: "${product.productID}" already exists`);
					skipped++;
				} else {
					await Product.create(product);
					console.log(`✅ Added: "${product.productID}" - ${product.name}`);
					inserted++;
				}
			} catch (err) {
				console.error(`❌ Error adding "${product.productID}":`, err.message);
			}
		}

		console.log(`\n📊 Summary:`);
		console.log(`   - Inserted: ${inserted}`);
		console.log(`   - Skipped: ${skipped}`);
		console.log(`   - Total: ${products.length}`);

		// Close connection
		await mongoose.connection.close();
		console.log('\n✨ Database connection closed');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error seeding products:', error);
		process.exit(1);
	}
}

seedProducts();


