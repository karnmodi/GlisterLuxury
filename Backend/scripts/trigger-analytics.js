/**
 * Utility script to trigger analytics aggregation
 * Usage: node scripts/trigger-analytics.js [date]
 * Example: node scripts/trigger-analytics.js 2025-10-27
 */

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@glister.com';
const ADMIN_PASSWORD = 'admin123';

async function login() {
  console.log('Logging in as admin...');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.token) {
    throw new Error('No token received from login');
  }

  console.log('✓ Login successful');
  return data.token;
}

async function triggerAggregation(token, date) {
  console.log(`\nTriggering aggregation${date ? ` for ${date}` : ' for yesterday'}...`);
  
  const body = date ? { date } : {};
  
  const response = await fetch(`${API_URL}/analytics/aggregate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Aggregation failed: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('✓', data.message);
  return data;
}

async function main() {
  try {
    // Check required credentials
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('\n❌ Error: Missing admin credentials');
      console.log('\nPlease update credentials in scripts/trigger-analytics.js');
      console.log('Or set environment variables:');
      console.log('  ADMIN_EMAIL=your-admin@email.com');
      console.log('  ADMIN_PASSWORD=your-admin-password');
      process.exit(1);
    }

    // Get optional date from command line argument
    const targetDate = process.argv[2];

    // Login to get token
    const token = await login();

    // Trigger aggregation
    await triggerAggregation(token, targetDate);

    console.log('\n✅ Analytics aggregation completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the script
main();

