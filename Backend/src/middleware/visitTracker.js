const WebsiteVisit = require('../models/WebsiteVisit');
const { v4: uuidv4 } = require('uuid');

/**
 * Parse device type from user agent string
 */
const parseDeviceType = (userAgent) => {
	if (!userAgent) return 'unknown';
	
	const ua = userAgent.toLowerCase();
	
	if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
		return 'tablet';
	}
	if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
		return 'mobile';
	}
	return 'desktop';
};

/**
 * Extract or generate session ID
 */
const getSessionID = (req) => {
	// Try to get from cookie
	if (req.cookies && req.cookies.sessionID) {
		return req.cookies.sessionID;
	}
	
	// Try to get from header
	if (req.headers['x-session-id']) {
		return req.headers['x-session-id'];
	}
	
	// Generate new session ID
	return uuidv4();
};

/**
 * Middleware to track website visits
 */
const visitTracker = async (req, res, next) => {
	try {
		// Skip tracking for:
		// 1. ALL API routes (we only track frontend page visits)
		// 2. Static files
		// 3. Health checks
		const path = req.path;
		
		if (
			path.startsWith('/api') ||  // Skip all API routes
			path.startsWith('/health') ||
			path.includes('.') // Skip static files
		) {
			return next();
		}
		
		// Extract visit data
		const sessionID = getSessionID(req);
		const userID = req.user ? req.user._id : null;
		const page = req.originalUrl || req.url;
		const referrer = req.headers.referer || req.headers.referrer || '';
		const userAgent = req.headers['user-agent'] || '';
		const ipAddress = req.ip || req.connection.remoteAddress || '';
		const deviceType = parseDeviceType(userAgent);
		
		// Store visit asynchronously (don't wait for it)
		setImmediate(async () => {
			try {
				await WebsiteVisit.create({
					sessionID,
					userID,
					page,
					referrer,
					userAgent,
					ipAddress,
					deviceType,
					timestamp: new Date()
				});
			} catch (error) {
				// Log error but don't throw - tracking shouldn't break the app
				console.error('Error tracking visit:', error);
			}
		});
		
		// Set session cookie if not exists
		if (!req.cookies || !req.cookies.sessionID) {
			res.cookie('sessionID', sessionID, {
				maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax'
			});
		}
		
	} catch (error) {
		// Log error but don't break the request
		console.error('Visit tracker error:', error);
	}
	
	next();
};

module.exports = visitTracker;

