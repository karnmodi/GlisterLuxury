/**
 * Clear API route visits (they shouldn't have been tracked)
 */

require('dotenv').config();
const connectToDatabase = require('../src/config/database');
const WebsiteVisit = require('../src/models/WebsiteVisit');

async function clearAPIVisits() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    
    console.log('\nClearing API route visits...');
    
    // Delete all visits that start with /api
    const result = await WebsiteVisit.deleteMany({
      page: { $regex: '^/api' }
    });
    
    console.log(`✓ Deleted ${result.deletedCount} API route visit records`);
    
    // Show remaining visits
    const remainingCount = await WebsiteVisit.countDocuments();
    console.log(`\n✓ Remaining visits: ${remainingCount}`);
    
    if (remainingCount > 0) {
      const samples = await WebsiteVisit.find().limit(5).sort({ timestamp: -1 });
      console.log('\nSample visits:');
      samples.forEach(visit => {
        console.log(`  - ${visit.page} (${visit.deviceType})`);
      });
    }
    
    console.log('\n✅ Cleanup complete!\n');
    console.log('Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Visit some pages on the frontend (http://localhost:3000)');
    console.log('3. Check analytics dashboard');
    console.log('4. Run: npm run analytics:aggregate');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

clearAPIVisits();

