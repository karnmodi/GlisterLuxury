const Category = require('../models/Category');
const mongoose = require('mongoose');
const connectToDatabase = require('../config/database');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const categoryData = [
  {
    name: 'Handles',
    description: 'Premium door handles, locks, and handles for various applications',
    subcategories: [
      { name: 'Mortise door handles', description: 'Traditional mortise door handles for doors with mortise locks' },
      { name: 'Half cylinders', description: 'Half cylinder locks for doors' },
      { name: 'Coin cylinders', description: 'Coin-operated cylinder locks' },
      { name: 'Key cylinders', description: 'Key-operated cylinder locks' },
      { name: 'Baby latch', description: 'Baby latches for safety and security' },
      { name: 'Dead lock', description: 'Deadbolt locks for enhanced security' },
      { name: 'Lock body & roller lock body', description: 'Lock bodies including roller lock mechanisms' },
      { name: 'Cabinet handle', description: 'Cabinet door and drawer handles' },
      { name: 'Conceal handle', description: 'Hidden/concealed cabinet handles' },
      { name: 'Knob', description: 'Door knobs for residential and commercial use' },
      { name: 'Profile handle', description: 'Modern profile handles with sleek design' },
      { name: 'Cabinet handle & Long handle', description: 'Extended cabinet handles for long doors' },
      { name: 'Glass door handle', description: 'Specialized handles for glass doors' },
    ],
  },
  {
    name: 'Bathroom accessories',
    description: 'Complete range of bathroom accessories for modern and elegant bathrooms',
    subcategories: [
      { name: 'Soap dish', description: 'Decorative and functional soap dishes' },
      { name: 'Tumbler holder', description: 'Holders for toothbrush tumblers' },
      { name: 'Towel ring', description: 'Classic towel rings for bath towels' },
      { name: 'Robe hook', description: 'Wall-mounted robe hooks' },
      { name: 'Towel rod', description: 'Horizontal towel rods' },
      { name: 'Towel rack', description: 'Multi-bar towel racks' },
      { name: 'Soap with tumbler holder', description: 'Combined soap and tumbler holder' },
      { name: 'Double soap dish', description: 'Twin soap dish design' },
      { name: 'Toilet paper holder', description: 'Wall-mounted toilet paper dispensers' },
      { name: 'Liquid dispenser', description: 'Dispensers for liquid soap' },
      { name: 'Curve towel rod', description: 'Curved design towel rods' },
      { name: 'Square towel ring', description: 'Contemporary square towel rings' },
      { name: 'Oval towel ring', description: 'Elegant oval-shaped towel rings' },
      { name: 'Triangle towel ring', description: 'Modern triangular towel rings' },
      { name: 'Half oval towel ring', description: 'Half oval towel ring design' },
      { name: 'Fancy towel ring', description: 'Ornamental decorative towel rings' },
      { name: 'D towel ring', description: 'D-shaped towel ring design' },
      { name: 'Half triangle towel ring', description: 'Half triangular towel ring' },
      { name: 'Round towel ring', description: 'Circular towel ring design' },
      { name: 'Self', description: 'Shelf and storage accessories' },
      { name: 'Self+tumbler', description: 'Combined shelf and tumbler holder' },
      { name: 'Self 4 in 1', description: 'Four-in-one shelf combination' },
      { name: 'Corner', description: 'Corner-mounted bathroom accessories' },
    ],
  },
];

async function seedCategories() {
  try {
    // Connect to database
    await connectToDatabase();
    console.log('Connected to database');

    // Drop the collection to start fresh
    console.log('Dropping existing categories collection...');
    try {
      await Category.collection.drop();
      console.log('Existing collection dropped');
    } catch (error) {
      if (error.codeName === 'NamespaceNotFound') {
        console.log('Collection does not exist, creating new one...');
      } else {
        throw error;
      }
    }

    // Insert new categories
    console.log('Seeding categories...');
    const categories = await Category.insertMany(categoryData);
    
    console.log(`\n✓ Successfully seeded ${categories.length} categories:`);
    categories.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.subcategories?.length || 0} subcategories)`);
    });

    console.log('\n✓ Category seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding categories:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedCategories();
}

module.exports = seedCategories;
