const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectToDatabase = require('./src/config/database');
const visitTracker = require('./src/middleware/visitTracker');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
};
app.use(cors(corsOptions));
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

// API routes (no /api prefix needed - Vercel handles routing to /api/*)
app.use('/auth', require('./src/routes/auth.routes'));
app.use('/categories', require('./src/routes/categories.routes'));
app.use('/products', require('./src/routes/products.routes'));
app.use('/finishes', require('./src/routes/finishes.routes'));
app.use('/materials', require('./src/routes/materials.routes'));
app.use('/configurations', require('./src/routes/configurations.routes'));
app.use('/cart', require('./src/routes/cart.routes'));
app.use('/orders', require('./src/routes/orders.routes'));
app.use('/wishlist', require('./src/routes/wishlist.routes'));
app.use('/faqs', require('./src/routes/faq.routes'));
app.use('/analytics', require('./src/routes/analytics.routes'));

// Error handler (must be last)
app.use(require('./src/middleware/errorHandler'));

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  const { scheduleDailyAggregation } = require('./src/utils/analyticsAggregator');

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
// Vercel expects either the app directly or a handler function
module.exports = app;

// Also export as default for Vercel compatibility
module.exports.default = app;