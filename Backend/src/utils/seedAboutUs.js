const AboutUs = require('../models/AboutUs');
const connectToDatabase = require('../config/database');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const aboutUsData = [
	// About Section
	{
		section: 'about',
		title: 'About Glister Luxury',
		content: `Glister Luxury is not a product. It is a feeling — the quiet pride you feel when beauty meets precision, when craftsmanship meets soul.

Born in the heart of Britain, Glister Luxury stands as a symbol of heritage, artistry, and enduring luxury. We craft architectural hardware that transforms houses into homes of distinction — every handle, every curve, every finish designed to whisper sophistication.

Our creations are the crown jewels of your interiors — meticulously forged in solid brass and noble metals, perfected through generations of craftsmanship, and finished with a devotion only found in true artistry.

For those who understand that true refinement lies in the smallest details — Glister Luxury is not an accessory. It is your home's signature.

Glister Luxury — The Emotion of Craft. The Pride of Your Home.`,
		order: 0,
		isActive: true,
	},
	
	// Vision Section
	{
		section: 'vision',
		title: 'Vision',
		content: `To redefine modern luxury by crafting architectural hardware that transcends utility — to create pieces that stir emotion, embody pride, and celebrate the art of living beautifully.`,
		order: 0,
		isActive: true,
	},
	
	// Philosophy Section
	{
		section: 'philosophy',
		title: 'Philosophy',
		content: `We believe every home deserves more than perfection. It deserves character, heritage, and a soul. At Glister Luxury, we design for legacy, not trends.`,
		order: 0,
		isActive: true,
	},
	
	// Promise Section
	{
		section: 'promise',
		title: 'Promise',
		content: `Each Glister Luxury creation is made to last a lifetime — not only in function but in feeling. A fusion of British tradition, modern artistry, and uncompromising quality.`,
		order: 0,
		isActive: true,
	},
	
	// Core Values
	{
		section: 'coreValues',
		title: 'Emotion in Craft',
		content: `Every curve, polish, and touch is guided by emotion.`,
		order: 0,
		isActive: true,
	},
	{
		section: 'coreValues',
		title: 'Pride of Ownership',
		content: `Hardware reflects your taste, your home, your legacy.`,
		order: 1,
		isActive: true,
	},
	{
		section: 'coreValues',
		title: 'Enduring Excellence',
		content: `Time may move, but Glister's quality remains.`,
		order: 2,
		isActive: true,
	},
	{
		section: 'coreValues',
		title: 'Sustainability of Luxury',
		content: `True luxury is responsible; we craft to last.`,
		order: 3,
		isActive: true,
	},
	{
		section: 'coreValues',
		title: 'British Heritage',
		content: `Rooted in tradition, shaped by innovation.`,
		order: 4,
		isActive: true,
	},
];

async function seedAboutUs() {
	try {
		// Connect to database
		await connectToDatabase();
		console.log('Connected to database');

		// Drop the collection to start fresh
		console.log('Dropping existing About Us collection...');
		try {
			await AboutUs.collection.drop();
			console.log('Existing collection dropped');
		} catch (error) {
			if (error.codeName === 'NamespaceNotFound') {
				console.log('Collection does not exist, creating new one...');
			} else {
				throw error;
			}
		}

		// Insert new About Us content
		console.log('Seeding About Us content...');
		const aboutUsItems = await AboutUs.insertMany(aboutUsData);
		
		console.log(`\n✓ Successfully seeded ${aboutUsItems.length} About Us items:`);
		aboutUsItems.forEach((item) => {
			console.log(`  - ${item.section}: ${item.title}`);
		});

		console.log('\n✓ About Us seeding completed successfully!');
		process.exit(0);
	} catch (error) {
		console.error('✗ Error seeding About Us:', error);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	seedAboutUs();
}

module.exports = seedAboutUs;


