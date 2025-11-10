const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const mongoose = require('mongoose');
const connectToDatabase = require('./src/config/database');
const visitTracker = require('./src/middleware/visitTracker');
const ensureDbConnection = require('./src/middleware/ensureDbConnection');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const normalizeOrigin = (value) => (typeof value === 'string' ? value.replace(/\/+$/, '') : value);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  // Custom domains
  'https://www.glisterlondon.com',
  'https://glisterlondon.com',
  'https://www.glisterlondon.co.uk',
  'https://glisterlondon.co.uk',
  // Vercel domain (fallback)
  'https://glister-londonn.vercel.app',
  // Local development
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
    // Log for debugging
    console.log(`CORS: Origin ${origin} (normalized: ${normalized}) not in allowed list:`, allowedOrigins);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Session-ID'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Middleware to check content-length for large uploads
// Vercel has a 4.5MB request body limit, so we reject early if content is too large
app.use((req, res, next) => {
	const contentLength = req.headers['content-length'];
	if (contentLength) {
		const sizeInMB = parseInt(contentLength) / (1024 * 1024);
		// Reject if larger than 4MB to account for multipart encoding overhead
		if (sizeInMB > 4) {
			const origin = req.headers.origin;
			if (origin && allowedOrigins.includes(normalizeOrigin(origin))) {
				res.setHeader('Access-Control-Allow-Origin', origin);
				res.setHeader('Access-Control-Allow-Credentials', 'true');
			}
			return res.status(413).json({ 
				message: 'Request payload too large. Maximum size is 3MB per file. Please upload one image at a time.' 
			});
		}
	}
	next();
});

// Conditional body parsers - skip multipart/form-data (needed for multer)
// Multer needs access to the raw request stream for file uploads
// On Vercel serverless, body parsers may interfere with multer, so we skip them for multipart
const jsonParser = express.json({ limit: '50mb' });
const urlencodedParser = express.urlencoded({ extended: true, limit: '50mb' });

app.use((req, res, next) => {
	const contentType = req.headers['content-type'] || '';
	// Skip body parsing for multipart/form-data - let multer handle it
	if (contentType.includes('multipart/form-data')) {
		console.log('[BodyParser] Skipping body parsing for multipart/form-data request');
		return next();
	}
	// For non-multipart requests, use the appropriate parsers
	jsonParser(req, res, (err) => {
		if (err) return next(err);
		urlencodedParser(req, res, next);
	});
});

app.use(cookieParser());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Glister Backend API is configured and running!' });
});

// Visit tracking middleware (before routes, after auth)
app.use(visitTracker);

// API routes - support both with and without /api prefix (Vercel sends /api/*)
const apiRouter = express.Router();

// Ensure database connection before processing API requests
// This prevents "Cannot call X before initial connection" errors with bufferCommands: false
apiRouter.use(ensureDbConnection);

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
apiRouter.use('/blog', require('./src/routes/blog.routes'));
apiRouter.use('/contact', require('./src/routes/contact.routes'));
apiRouter.use('/analytics', require('./src/routes/analytics.routes'));
apiRouter.use('/offers', require('./src/routes/offers.routes'));
apiRouter.use('/settings', require('./src/routes/settings.routes'));
apiRouter.use('/collections', require('./src/routes/collections.routes'));
apiRouter.use('/incoming-email', require('./src/routes/incomingEmail.routes'));

app.use(apiRouter); // no prefix
app.use('/api', apiRouter); // with /api prefix

// Error handler (must be last)
app.use(require('./src/middleware/errorHandler'));

// Initialize database connection at startup
(async () => {
  try {
    console.log('🔄 Initializing database connection...');
    await connectToDatabase();
    console.log('✅ Database connection initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database connection:', error.message);
    console.log('⚠️ Server will continue, but database operations may fail');
    console.log('🔄 Will attempt to reconnect on first request...');
  }
})();

// Set up scheduled email polling
const incomingEmailController = require('./src/controllers/incomingEmail.controller');

// Poll emails interval in seconds (configurable via IMAP_POLL_INTERVAL env var)
// Default: 5 seconds (300 seconds = 5 minutes for production)
const pollIntervalSeconds = parseInt(process.env.IMAP_POLL_INTERVAL) || 5;

// Schedule email polling using setInterval (supports seconds)
let pollingInterval = null;

const startEmailPolling = () => {
  // Clear any existing interval
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  // Start polling
  pollingInterval = setInterval(async () => {
    // Email polling runs silently - logs are written to file
    try {
      await incomingEmailController.processIncomingEmails();
    } catch (error) {
      // Only log critical errors to console
      console.error('[Email Polling] Critical error:', error.message);
    }
  }, pollIntervalSeconds * 1000); // Convert seconds to milliseconds

  console.log(`📧 Email polling scheduled to run every ${pollIntervalSeconds} seconds`);
};

// Start polling after server initialization
startEmailPolling();

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  const { scheduleDailyAggregation } = require('./src/utils/analyticsAggregator');

  app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);

    // DEPRECATED: Daily aggregation is no longer needed
    // Analytics now use real-time queries with 5-minute caching
    // Uncomment below if you want to keep historical aggregated data
    // scheduleDailyAggregation();
    console.log('📊 Analytics system running in REAL-TIME mode with caching');
  });
}

// Export for Vercel serverless
// Vercel expects either the app directly or a handler function
module.exports = app;

// Also export as default for Vercel compatibility
module.exports.default = app;