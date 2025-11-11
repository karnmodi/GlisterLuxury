const multer = require('multer');

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// Allowed image MIME types
const allowedImageTypes = [
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/bmp',
	'image/svg+xml',
	'image/tiff',
	'image/x-icon'
];

// File filter to accept only images
const fileFilter = (req, file, cb) => {
	// Accept image files only - check both explicit list and image/ prefix for maximum compatibility
	if (file.mimetype.startsWith('image/') || allowedImageTypes.includes(file.mimetype.toLowerCase())) {
		cb(null, true);
	} else {
		cb(new Error(`Only image files are allowed! Received: ${file.mimetype}. Supported types: JPG, JPEG, PNG, GIF, WEBP, BMP, SVG, TIFF, ICO`), false);
	}
};

// Multer configuration
// Note: Vercel has a 4.5MB request body limit for serverless functions
// We set 3MB per file to allow some overhead for multipart encoding
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 3 * 1024 * 1024, // 3MB file size limit (reduced from 10MB for Vercel compatibility)
	},
});

// Middleware for single image upload
const uploadSingle = upload.single('image');

// Middleware for multiple images upload (max 10 files)
// With compression on frontend, multiple files can be uploaded within Vercel's 4.5MB limit
const uploadMultiple = upload.array('images', 10);

// Error handling middleware for multer
// This middleware also sets CORS headers to ensure errors are properly handled
const { setCorsHeaders } = require('../utils/corsHelper');

const handleMulterError = (err, req, res, next) => {
	// Set CORS headers before sending error response
	setCorsHeaders(req, res);
	
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ message: 'File size too large. Maximum size is 3MB per file.' });
		}
		if (err.code === 'LIMIT_FILE_COUNT') {
			return res.status(400).json({ message: 'Too many files. Maximum 10 images per upload.' });
		}
		return res.status(400).json({ message: err.message });
	} else if (err) {
		return res.status(400).json({ message: err.message });
	}
	next();
};

/**
 * Middleware to validate total payload size before processing
 * Vercel has a 4.5MB request body limit for serverless functions
 * This middleware checks the total size of uploaded files
 */
const validatePayloadSize = (req, res, next) => {
	// Set CORS headers
	setCorsHeaders(req, res);
	
	if (!req.files || req.files.length === 0) {
		return next();
	}
	
	// Calculate total size of all files
	const totalSize = req.files.reduce((total, file) => total + (file.size || 0), 0);
	const totalSizeMB = totalSize / (1024 * 1024);
	const maxPayloadMB = 4.5; // Vercel's limit
	
	console.log(`[validatePayloadSize] Total payload size: ${totalSizeMB.toFixed(2)}MB (limit: ${maxPayloadMB}MB)`);
	
	if (totalSizeMB > maxPayloadMB) {
		return res.status(413).json({ 
			message: `Total payload size (${totalSizeMB.toFixed(2)}MB) exceeds Vercel's limit of ${maxPayloadMB}MB. Please compress images or upload fewer files.`,
			totalSizeMB: totalSizeMB.toFixed(2),
			maxPayloadMB: maxPayloadMB
		});
	}
	
	next();
};

module.exports = {
	uploadSingle,
	uploadMultiple,
	handleMulterError,
	validatePayloadSize,
};

