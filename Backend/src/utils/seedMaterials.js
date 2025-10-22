const mongoose = require('mongoose');
const MaterialMaster = require('../models/MaterialMaster');
require('dotenv').config();

const materials = [
	{
		name: 'SS 304',
		description: 'Stainless Steel 304 - High-quality corrosion-resistant steel',
		unitOfMeasure: 'piece',
	},
	{
		name: 'SS 316',
		description: 'Stainless Steel 316 - Marine grade stainless steel with superior corrosion resistance',
		unitOfMeasure: 'piece',
	},
	{
		name: 'Brass',
		description: 'Solid Brass - Premium quality brass material',
		unitOfMeasure: 'piece',
	},
	{
		name: 'Zinc Alloy',
		description: 'Zinc Alloy - Durable and cost-effective material',
		unitOfMeasure: 'piece',
	},
];

async function seedMaterials() {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glister');
		console.log('MongoDB connected successfully');

		let inserted = 0;
		let skipped = 0;

		for (const material of materials) {
			try {
				const existing = await MaterialMaster.findOne({ name: material.name });
				if (existing) {
					console.log(`⚠️  Skipped: "${material.name}" already exists`);
					skipped++;
				} else {
					await MaterialMaster.create(material);
					console.log(`✅ Added: "${material.name}"`);
					inserted++;
				}
			} catch (err) {
				console.error(`❌ Error adding "${material.name}":`, err.message);
			}
		}

		console.log(`\n📊 Summary:`);
		console.log(`   - Inserted: ${inserted}`);
		console.log(`   - Skipped: ${skipped}`);
		console.log(`   - Total: ${materials.length}`);

		// Close connection
		await mongoose.connection.close();
		console.log('\n✨ Database connection closed');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error seeding materials:', error);
		process.exit(1);
	}
}

seedMaterials();


