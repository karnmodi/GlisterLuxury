const { setCorsHeaders } = require('../utils/corsHelper');

function errorHandler(err, req, res, next) {
	// Set CORS headers before sending error response
	setCorsHeaders(req, res);
	
	const status = err.status || 500;
	const message = err.message || 'Internal Server Error';
	
	// Handle 413 Payload Too Large errors specifically
	if (status === 413 || err.message?.includes('413') || err.message?.includes('Content Too Large')) {
		return res.status(413).json({ 
			message: 'File size too large. Maximum size is 3MB per file. Please upload one image at a time.',
			error: process.env.NODE_ENV === 'development' ? err.stack : undefined
		});
	}
	
	return res.status(status).json({ message });
}

module.exports = errorHandler;


