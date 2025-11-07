/**
 * Authentication API Test Script
 * 
 * This script demonstrates how to test the authentication endpoints.
 * Run this after starting the server and creating an admin user.
 * 
 * Usage: node src/utils/testAuth.js
 */

const API_BASE_URL = 'http://localhost:5001/api/auth';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('API call failed:', error.message);
    return null;
  }
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication System\n');
  console.log('='.repeat(50));
  
  let token = null;
  
  // Test 1: Register a new user
  console.log('\n📝 Test 1: Register New Customer');
  console.log('-'.repeat(50));
  const registerData = {
    name: 'Test Customer',
    email: `test${Date.now()}@example.com`,
    password: 'test123',
    phone: '1234567890'
  };
  
  const registerResult = await apiCall('/register', 'POST', registerData);
  if (registerResult && registerResult.data.success) {
    console.log('✅ Registration successful!');
    console.log('User:', registerResult.data.user.name);
    console.log('Email:', registerResult.data.user.email);
    console.log('Role:', registerResult.data.user.role);
    token = registerResult.data.token;
    console.log('Token:', token.substring(0, 20) + '...');
  } else {
    console.log('❌ Registration failed:', registerResult?.data.message);
    return;
  }
  
  // Test 2: Login with admin credentials
  console.log('\n🔑 Test 2: Login as Admin');
  console.log('-'.repeat(50));
  const loginData = {
    email: 'admin@glister.com',
    password: 'admin123'
  };
  
  const loginResult = await apiCall('/login', 'POST', loginData);
  if (loginResult && loginResult.data.success) {
    console.log('✅ Login successful!');
    console.log('User:', loginResult.data.user.name);
    console.log('Role:', loginResult.data.user.role);
    token = loginResult.data.token;
  } else {
    console.log('❌ Login failed:', loginResult?.data.message);
    console.log('ℹ️  Make sure you have created the admin user using: npm run seed:admin');
  }
  
  // Test 3: Get current user
  console.log('\n👤 Test 3: Get Current User (Protected Route)');
  console.log('-'.repeat(50));
  const meResult = await apiCall('/me', 'GET', null, token);
  if (meResult && meResult.data.success) {
    console.log('✅ Successfully retrieved user data');
    console.log('Name:', meResult.data.user.name);
    console.log('Email:', meResult.data.user.email);
    console.log('Role:', meResult.data.user.role);
  } else {
    console.log('❌ Failed to get user:', meResult?.data.message);
  }
  
  // Test 4: Get all users (Admin only)
  console.log('\n👥 Test 4: Get All Users (Admin Only)');
  console.log('-'.repeat(50));
  const usersResult = await apiCall('/users', 'GET', null, token);
  if (usersResult && usersResult.data.success) {
    console.log('✅ Successfully retrieved users');
    console.log('Total users:', usersResult.data.total);
    console.log('Users on this page:', usersResult.data.count);
  } else {
    console.log('❌ Failed to get users:', usersResult?.data.message);
    console.log('ℹ️  This endpoint requires admin role');
  }
  
  // Test 5: Forgot Password
  console.log('\n🔄 Test 5: Forgot Password');
  console.log('-'.repeat(50));
  const forgotResult = await apiCall('/forgot-password', 'POST', {
    email: 'admin@glister.com'
  });
  if (forgotResult && forgotResult.data.success) {
    console.log('✅ Password reset email would be sent');
    console.log('Message:', forgotResult.data.message);
    console.log('ℹ️  Note: Email sending requires EMAIL_* env variables to be configured');
  } else {
    console.log('❌ Forgot password failed:', forgotResult?.data.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Authentication tests completed!');
  console.log('\n📖 For complete API documentation, see AUTH_DOCUMENTATION.md');
}

// Run the tests
if (require.main === module) {
  console.log('⚠️  Make sure the server is running before running this script!');
  console.log('Start the server with: npm run dev\n');
  
  setTimeout(() => {
    testAuthentication().catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
  }, 1000);
}

module.exports = { testAuthentication, apiCall };

