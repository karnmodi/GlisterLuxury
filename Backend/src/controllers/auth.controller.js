const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Send token response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id, user.role);
  
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      addresses: user.addresses || [],
      isActive: user.isActive
    }
  });
};

// Determine frontend URL based on request origin
// Uses FRONTEND_URL_2 for .co.uk domains, FRONTEND_URL for others
const getFrontendUrl = (req) => {
  // Get origin from request headers (origin or referer)
  const origin = req.headers.origin || req.headers.referer || '';
  
  // Check if origin contains .co.uk domain
  if (origin.includes('.co.uk')) {
    return process.env.FRONTEND_URL_2 || process.env.FRONTEND_URL || 'http://localhost:3000';
  }
  
  // Default to FRONTEND_URL
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: role || 'customer' // Default to customer if not specified
    });
    
    sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }
    
    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses || [],
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/update-details
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (email !== undefined) fieldsToUpdate.email = email;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'User details updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add new address
// @route   POST /api/auth/addresses
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    const { label, addressLine1, addressLine2, city, county, postcode, country, isDefault } = req.body;
    
    if (!addressLine1 || !city || !postcode) {
      return res.status(400).json({
        success: false,
        message: 'Address Line 1, City, and Postcode are required'
      });
    }
    
    const user = await User.findById(req.user.userId);
    
    // If this is the first address or marked as default, set as default
    if (user.addresses.length === 0 || isDefault) {
      // Remove default flag from other addresses
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    user.addresses.push({
      label: label || 'Home',
      addressLine1,
      addressLine2,
      city,
      county,
      postcode: postcode.toUpperCase(),
      country: country || 'United Kingdom',
      isDefault: user.addresses.length === 0 || isDefault || false
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update address
// @route   PUT /api/auth/addresses/:addressId
// @access  Private
exports.updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { label, addressLine1, addressLine2, city, county, postcode, country, isDefault } = req.body;
    
    const user = await User.findById(req.user.userId);
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Update fields
    if (label !== undefined) address.label = label;
    if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city !== undefined) address.city = city;
    if (county !== undefined) address.county = county;
    if (postcode !== undefined) address.postcode = postcode.toUpperCase();
    if (country !== undefined) address.country = country;
    
    // Handle default address
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = addr._id.toString() === addressId;
      });
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:addressId
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.user.userId);
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    const wasDefault = address.isDefault;
    address.deleteOne();
    
    // If deleted address was default, set first remaining address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Set default address
// @route   PUT /api/auth/addresses/:addressId/default
// @access  Private
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.user.userId);
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Remove default from all addresses
    user.addresses.forEach(addr => addr.isDefault = false);
    
    // Set this address as default
    address.isDefault = true;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }
    
    const user = await User.findById(req.user.userId).select('+password');
    
    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    sendTokenResponse(user, 200, res, 'Password updated successfully');
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }
    
    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Determine frontend URL based on request origin
    const frontendUrl = getFrontendUrl(req);
    
    // Create reset URL
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    
    // Email message
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 10px; }
          .header { background-color: #2C2C2C; color: #D4AF37; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 15px; }
          .info-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #D4AF37; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2C2C2C; color: #D4AF37; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0; }
          .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GLISTER LONDON</h1>
            <h2 style="margin-top: 10px;">The Soul of Interior</h2>
            <p style="margin-top: 15px; font-size: 16px;">Password Reset Request</p>
          </div>
          <div class="content">
            <p>Dear User,</p>
            
            <p>You have requested to reset your password for your Glister London account.</p>
            
            <div class="info-box">
              <p>Please click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p style="margin-top: 15px; font-size: 14px; color: #666;">This link will expire in 10 minutes.</p>
            </div>
            
            <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Glister London Team</strong><br>
              <em>The Soul of Interior</em>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
            <p>If you have any questions, feel free to reach out:</p>
            <p><a href="mailto:enquiries@glisterlondon.com" style="color: #2C2C2C; text-decoration: none;">enquiries@glisterlondon.com</a> (All purposes) | <a href="mailto:sales@glisterlondon.com" style="color: #2C2C2C; text-decoration: none;">sales@glisterlondon.com</a> (Business purposes)</p>
            <p>&copy; ${new Date().getFullYear()} Glister London. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    try {
      // Configure email transporter for FastHost SMTP - authenticate with noreply@glisterlondon.com
      const noreplyEmail = process.env.EMAIL_FROM_NOREPLY || 'noreply@glisterlondon.com';
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.livemail.co.uk',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
        auth: {
          user: noreplyEmail, // Authenticate with noreply email address
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false // Set to true in production if you have valid SSL
        }
      });
      
      // Send email from noreply@glisterlondon.com (matches authentication)
      await transporter.sendMail({
        from: `Glister London <${noreplyEmail}>`,
        to: email,
        subject: 'Password Reset Request - Glister',
        html: message
      });
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully. Please check your inbox.'
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      
      // Reset token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        success: false,
        message: 'Error sending email. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password'
      });
    }
    
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');
    
    // Find user by token and check if it's still valid
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // In a JWT-based system, logout is mainly handled on the client side
    // by removing the token from storage. However, we can add additional
    // server-side logic if needed (e.g., blacklisting tokens)
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin only routes

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single user
// @route   GET /api/auth/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, phone, address } = req.body;
    
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (email !== undefined) fieldsToUpdate.email = email;
    if (role !== undefined) fieldsToUpdate.role = role;
    if (isActive !== undefined) fieldsToUpdate.isActive = isActive;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (address !== undefined) fieldsToUpdate.address = address;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

