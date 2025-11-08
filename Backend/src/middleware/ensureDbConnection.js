const mongoose = require('mongoose');
const connectToDatabase = require('../config/database');

/**
 * Middleware to ensure database connection is ready before proceeding
 * This is necessary when bufferCommands: false is set in mongoose
 */
async function ensureDbConnection(req, res, next) {
  try {
    // Check if database is already connected
    if (mongoose.connection.readyState === 1) {
      // Already connected, proceed
      return next();
    }

    // If connecting, wait for connection
    if (mongoose.connection.readyState === 2) {
      // Wait for connection to complete
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Database connection timeout'));
        }, 30000); // 30 second timeout

        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });

        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      return next();
    }

    // If disconnected, try to connect
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
      await connectToDatabase();
      return next();
    }

    // If we get here, something unexpected happened
    return next();
  } catch (error) {
    console.error('Database connection error in middleware:', error);
    return res.status(503).json({
      message: 'Database connection unavailable. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = ensureDbConnection;

