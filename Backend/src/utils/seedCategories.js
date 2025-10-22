const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const categories = [
	{
		name: 'Mortise Handles',
		description: 'Premium mortise door handles for modern and luxury interiors',
		subcategories: [
			{ name: 'Modern', description: 'Contemporary mortise handle designs' },
			{ name: 'Classic', description: 'Traditional and timeless mortise handles' },
			{ name: 'Luxury', description: 'High-end luxury mortise handles' },
		],
	},
	{
		name: 'Door Handles',
		description: 'Wide range of door handles for all applications',
		subcategories: [
			{ name: 'Lever Handles', description: 'Standard lever door handles' },
			{ name: 'Pull Handles', description: 'Pull-style door handles' },
			{ name: 'Knobs', description: 'Door knobs and round handles' },
		],
	},
	{
		name: 'Bathroom Accessories',
		description: 'Complete range of bathroom fittings and accessories',
		subcategories: [
			{ name: 'Towel Rails', description: 'Towel rails and holders' },
			{ name: 'Soap Dispensers', description: 'Wall-mounted and counter soap dispensers' },
			{ name: 'Robe Hooks', description: 'Decorative robe and towel hooks' },
			{ name: 'Paper Holders', description: 'Toilet paper holders' },
		],
	},
	{
		name: 'Cabinet Hardware',
		description: 'Handles and knobs for cabinets and furniture',
		subcategories: [
			{ name: 'Cabinet Handles', description: 'Pull handles for cabinets' },
			{ name: 'Cabinet Knobs', description: 'Decorative cabinet knobs' },
		],
	},
];

async function seedCategories() {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glister');
		console.log('MongoDB connected successfully');

		let inserted = 0;
		let skipped = 0;

		for (const category of categories) {
			try {
				const existing = await Category.findOne({ name: category.name });
				if (existing) {
					console.log(`⚠️  Skipped: "${category.name}" already exists`);
					skipped++;
				} else {
					await Category.create(category);
					console.log(`✅ Added: "${category.name}" with ${category.subcategories?.length || 0} subcategories`);
					inserted++;
				}
			} catch (err) {
				console.error(`❌ Error adding "${category.name}":`, err.message);
			}
		}

		console.log(`\n📊 Summary:`);
		console.log(`   - Inserted: ${inserted}`);
		console.log(`   - Skipped: ${skipped}`);
		console.log(`   - Total: ${categories.length}`);

		// Close connection
		await mongoose.connection.close();
		console.log('\n✨ Database connection closed');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error seeding categories:', error);
		process.exit(1);
	}
}

seedCategories();


