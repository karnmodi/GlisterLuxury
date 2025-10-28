/**
 * Check analytics data in database
 */

require('dotenv').config();
const mongoose = require('mongoose');

const connectToDatabase = require('../src/config/database');
const WebsiteVisit = require('../src/models/WebsiteVisit');
const AnalyticsSummary = require('../src/models/AnalyticsSummary');
const Order = require('../src/models/Order');
const User = require('../src/models/User');

async function checkData() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    
    console.log('\n=== Analytics Data Check ===\n');
    
    // Check WebsiteVisits
    const visitCount = await WebsiteVisit.countDocuments();
    console.log(`✓ WebsiteVisits: ${visitCount} records`);
    
    if (visitCount > 0) {
      const latestVisit = await WebsiteVisit.findOne().sort({ timestamp: -1 });
      console.log(`  Latest visit: ${latestVisit.timestamp.toISOString()}`);
      console.log(`  Page: ${latestVisit.page}`);
    }
    
    // Check AnalyticsSummary
    const summaryCount = await AnalyticsSummary.countDocuments();
    console.log(`\n✓ AnalyticsSummary: ${summaryCount} records`);
    
    if (summaryCount > 0) {
      const latestSummary = await AnalyticsSummary.findOne().sort({ date: -1 });
      console.log(`  Latest summary: ${latestSummary.date.toISOString().split('T')[0]}`);
      console.log(`  Page views: ${latestSummary.websiteMetrics.totalPageViews}`);
      console.log(`  Revenue: £${latestSummary.revenueMetrics.totalRevenue}`);
    } else {
      console.log('  ⚠️  No aggregated summaries found!');
      console.log('  Run: npm run analytics:aggregate');
    }
    
    // Check Orders
    const orderCount = await Order.countDocuments();
    const paidOrders = await Order.countDocuments({ 'paymentInfo.status': 'paid' });
    console.log(`\n✓ Orders: ${orderCount} total (${paidOrders} paid)`);
    
    // Check Users
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`\n✓ Users: ${userCount} total (${adminCount} admins)`);
    
    // Check today's data
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayVisits = await WebsiteVisit.countDocuments({ timestamp: { $gte: todayStart } });
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: todayStart } });
    
    console.log(`\n=== Today's Activity ===`);
    console.log(`Page views: ${todayVisits}`);
    console.log(`Orders: ${todayOrders}`);
    
    console.log('\n✅ Data check complete!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkData();

