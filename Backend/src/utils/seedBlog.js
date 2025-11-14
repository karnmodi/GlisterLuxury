const Blog = require('../models/Blog');
const connectToDatabase = require('../config/database');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const blogData = [
	{
		title: 'The Handle That Holds Emotion',
		shortDescription: 'Every handle tells a story. Discover how the right design can elevate your home.',
		content: `A door handle opens experiences. At Glister Luxury, we see every handle as a silent witness to life — to morning light, warm laughter, quiet goodbyes. We believe emotion can live in metal.`,
		tags: ['Emotion in Design', 'Door Handles', 'Luxury Craft'],
		seoTitle: 'The Handle That Holds Emotion | Glister Luxury',
		seoDescription: 'Discover how Glister Luxury transforms hardware into emotion — the art of design you can feel.',
		order: 0,
		isActive: true,
	},
	{
		title: 'Brass — The Living Luxury',
		shortDescription: 'Brass ages beautifully. Here\'s how to preserve its natural glow.',
		content: `Brass develops patina over time — the gentle marks that tell your home's story. Each curve polished by hand, each edge softened by touch — this is personality.`,
		tags: ['Brass Finishes', 'Craftsmanship', 'Aging Gracefully'],
		seoTitle: 'Brass Finishes with Soul | Glister Luxury',
		seoDescription: 'Experience the living beauty of solid brass hardware that grows richer with time.',
		order: 1,
		isActive: true,
	},
	{
		title: 'The House of Heritage — Inside Glister Luxury',
		shortDescription: 'Step into the world where British craftsmanship and modern design converge.',
		content: `In an age of mass-production, Glister Luxury stands for the art of the made-to-last. Every creation begins as a sketch, then shaped by craftsmen who believe precision is poetry.`,
		tags: ['Craftsmanship', 'Heritage', 'British Design'],
		seoTitle: 'British Heritage Craftsmanship | Glister Luxury',
		seoDescription: 'Discover the world of Glister Luxury — a house built on British artistry and emotion-driven design.',
		order: 2,
		isActive: true,
	},
	{
		title: 'Finishes of Royal Character',
		shortDescription: 'Each Glister finish tells a story of strength, legacy, and beauty.',
		content: `Every finish reflects personality: Antique Brass nods to grandeur, Polished Chrome mirrors modern refinement, Matte Black is bold and confident. Hand-applied with devotion.`,
		tags: ['Design Aesthetics', 'Finishes', 'British Luxury'],
		seoTitle: 'Luxury Hardware Finishes | Glister Luxury',
		seoDescription: 'Explore Glister Luxury\'s curated palette of premium finishes — designed for royalty, built for life.',
		order: 3,
		isActive: true,
	},
	{
		title: 'Pride, Heritage & Home',
		shortDescription: 'A Glister handle doesn\'t just belong to your door — it belongs to your story.',
		content: `Pride of a home lies in how it feels. Every Glister Luxury piece carries a part of our soul, shaped with intent, finished with care, destined to become part of yours.`,
		tags: ['Home Pride', 'Emotional Design', 'British Luxury'],
		seoTitle: 'Pride & Emotion in Design | Glister Luxury',
		seoDescription: 'Experience the emotion behind every Glister Luxury creation — the pride of true craftsmanship.',
		order: 4,
		isActive: true,
	},
];

async function seedBlog() {
	try {
		// Connect to database
		await connectToDatabase();
		console.log('Connected to database');

		// Drop the collection to start fresh
		console.log('Dropping existing Blog collection...');
		try {
			await Blog.collection.drop();
			console.log('Existing collection dropped');
		} catch (error) {
			if (error.codeName === 'NamespaceNotFound') {
				console.log('Collection does not exist, creating new one...');
			} else {
				throw error;
			}
		}

		// Insert new blog articles
		console.log('Seeding blog articles...');
		const blogs = await Blog.insertMany(blogData);
		
		console.log(`\n✓ Successfully seeded ${blogs.length} blog articles:`);
		blogs.forEach((blog) => {
			console.log(`  - ${blog.title}`);
		});

		console.log('\n✓ Blog seeding completed successfully!');
		process.exit(0);
	} catch (error) {
		console.error('✗ Error seeding blog:', error);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	seedBlog();
}

module.exports = seedBlog;

