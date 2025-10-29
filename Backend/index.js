const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectToDatabase = require('./src/config/database');
const visitTracker = require('./src/middleware/visitTracker');
const { scheduleDailyAggregation } = require('./src/utils/analyticsAggregator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({ 
      message: 'Service temporarily unavailable. Database connection failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Glister Backend API is running!' });
});

// Visit tracking middleware (before routes, after auth)
app.use(visitTracker);

// API routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/categories', require('./src/routes/categories.routes'));
app.use('/api/products', require('./src/routes/products.routes'));
app.use('/api/finishes', require('./src/routes/finishes.routes'));
app.use('/api/materials', require('./src/routes/materials.routes'));
app.use('/api/configurations', require('./src/routes/configurations.routes'));
app.use('/api/cart', require('./src/routes/cart.routes'));
app.use('/api/orders', require('./src/routes/orders.routes'));
app.use('/api/wishlist', require('./src/routes/wishlist.routes'));
app.use('/api/faqs', require('./src/routes/faq.routes'));
app.use('/api/analytics', require('./src/routes/analytics.routes'));

// Error handler (must be last)
app.use(require('./src/middleware/errorHandler'));

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
    // DEPRECATED: Daily aggregation is no longer needed
    // Analytics now use real-time queries with 5-minute caching
    // Uncomment below if you want to keep historical aggregated data
    // scheduleDailyAggregation();
    console.log('Analytics system running in REAL-TIME mode with caching');
  });
}

// Export for Vercel serverless
module.exports = app;
