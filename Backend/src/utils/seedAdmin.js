const mongoose = require('mongoose');
const User = require('../models/User');
const connectToDatabase = require('../config/database');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    // Connect to database
    await connectToDatabase();
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@glister.com' });
    
    if (adminExists) {
      console.log('❌ Admin user already exists with email: admin@glister.com');
      console.log('Email:', adminExists.email);
      console.log('Role:', adminExists.role);
      process.exit(0);
    }
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@glister.com',
      password: 'admin123',
      role: 'admin',
      phone: '9999999999',
      isActive: true
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('========================');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    console.log('Role:', admin.role);
    console.log('========================');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();

