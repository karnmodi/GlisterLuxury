const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
      
      // Check if user still exists
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.'
        });
      }
      
      // Add user info to request
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Token is invalid or expired.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error authenticating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    
    next();
  };
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId).select('-password');

        if (user && user.isActive) {
          req.user = {
            userId: decoded.userId,
            role: decoded.role
          };
        }
      } catch (error) {
        // Token invalid or expired, but we continue without user
        req.user = null;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

