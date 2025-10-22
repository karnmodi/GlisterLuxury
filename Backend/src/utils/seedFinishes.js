const mongoose = require('mongoose');
const Finish = require('../models/Finish');
require('dotenv').config();

const finishes = [
	{ name: 'SS', description: 'Stainless Steel finish' },
	{ name: 'Brass Antique', description: 'Antique brass finish' },
	{ name: 'Black Matt', description: 'Matte black finish' },
	{ name: 'PVD Gold', description: 'PVD Gold finish' },
	{ name: 'PVD Rose Gold', description: 'PVD Rose Gold finish' },
	{ name: 'Satin', description: 'Satin finish' },
	{ name: 'Matt lacker', description: 'Matte lacquer finish' },
	{ name: 'Satin Black Matt', description: 'Satin black matte finish' },
	{ name: 'Satin / CP', description: 'Satin with Chrome Plated finish' },
	{ name: 'Black Matt / Glossy', description: 'Black matte and glossy combination finish' },
	{ name: 'Satin Black Matt / Glossy', description: 'Satin black matte and glossy combination finish' },
	{ name: 'Matt Lacker / Black Matt', description: 'Matte lacquer and black matte combination finish' },
	{ name: 'Brass Antique / Black Matt', description: 'Brass antique and black matte combination finish' },
	{ name: 'PVD Gold Glossy / Black Matt', description: 'PVD Gold glossy and black matte combination finish' },
	{ name: 'Black Matt / PVD Gold Glossy', description: 'Black matte and PVD Gold glossy combination finish' },
	{ name: 'PVD Rose Gold Matt / Glossy', description: 'PVD Rose Gold matte and glossy combination finish' },
	{ name: 'PVD Rose Gold Glossy / Black Matt', description: 'PVD Rose Gold glossy and black matte combination finish' },
	{ name: 'PVD Rose Gold Glossy / Satin Black Matt', description: 'PVD Rose Gold glossy and satin black matte combination finish' }
];

async function seedFinishes() {
	try {
		// Connect to MongoDB
		await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glister');
		console.log('MongoDB connected successfully');

		// Clear existing finishes (optional - comment out if you want to keep existing ones)
		// await Finish.deleteMany({});
		// console.log('Cleared existing finishes');

		// Insert finishes one by one to handle duplicates
		let inserted = 0;
		let skipped = 0;

		for (const finish of finishes) {
			try {
				const existing = await Finish.findOne({ name: finish.name });
				if (existing) {
					console.log(`⚠️  Skipped: "${finish.name}" already exists`);
					skipped++;
				} else {
					await Finish.create(finish);
					console.log(`✅ Added: "${finish.name}"`);
					inserted++;
				}
			} catch (err) {
				console.error(`❌ Error adding "${finish.name}":`, err.message);
			}
		}

		console.log(`\n📊 Summary:`);
		console.log(`   - Inserted: ${inserted}`);
		console.log(`   - Skipped: ${skipped}`);
		console.log(`   - Total: ${finishes.length}`);

		// Close connection
		await mongoose.connection.close();
		console.log('\n✨ Database connection closed');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error seeding finishes:', error);
		process.exit(1);
	}
}

seedFinishes();

