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

// Middleware for multiple images upload (max 1 to stay within Vercel's 4.5MB limit)
// Users can upload multiple images by making multiple requests
const uploadMultiple = upload.array('images', 1);

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
			return res.status(400).json({ message: 'Too many files. Please upload one image at a time.' });
		}
		return res.status(400).json({ message: err.message });
	} else if (err) {
		return res.status(400).json({ message: err.message });
	}
	next();
};

module.exports = {
	uploadSingle,
	uploadMultiple,
	handleMulterError,
};

