const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectToDatabase = require('./src/config/database');
const visitTracker = require('./src/middleware/visitTracker');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const normalizeOrigin = (value) => (typeof value === 'string' ? value.replace(/\/+$/, '') : value);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  'https://glister-londonn.vercel.app',
  'https://glister-london.vercel.app',
  'http://localhost:3000'
]
  .filter(Boolean)
  .map(normalizeOrigin);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server/health checks with no Origin
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
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
  res.json({ message: 'Glister Backend API is configured and running!' });
});

// Visit tracking middleware (before routes, after auth)
app.use(visitTracker);

// API routes - support both with and without /api prefix (Vercel sends /api/*)
const apiRouter = express.Router();
apiRouter.use('/auth', require('./src/routes/auth.routes'));
apiRouter.use('/categories', require('./src/routes/categories.routes'));
apiRouter.use('/products', require('./src/routes/products.routes'));
apiRouter.use('/finishes', require('./src/routes/finishes.routes'));
apiRouter.use('/materials', require('./src/routes/materials.routes'));
apiRouter.use('/configurations', require('./src/routes/configurations.routes'));
apiRouter.use('/cart', require('./src/routes/cart.routes'));
apiRouter.use('/orders', require('./src/routes/orders.routes'));
apiRouter.use('/wishlist', require('./src/routes/wishlist.routes'));
apiRouter.use('/faqs', require('./src/routes/faq.routes'));
apiRouter.use('/announcements', require('./src/routes/announcements.routes'));
apiRouter.use('/about-us', require('./src/routes/aboutUs.routes'));
apiRouter.use('/contact', require('./src/routes/contact.routes'));
apiRouter.use('/analytics', require('./src/routes/analytics.routes'));
apiRouter.use('/offers', require('./src/routes/offers.routes'));

app.use(apiRouter); // no prefix
app.use('/api', apiRouter); // with /api prefix

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