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
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB file size limit
	},
});

// Middleware for single image upload
const uploadSingle = upload.single('image');

// Middleware for multiple images upload (max 10)
const uploadMultiple = upload.array('images', 10);

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
		}
		if (err.code === 'LIMIT_FILE_COUNT') {
			return res.status(400).json({ message: 'Too many files. Maximum is 10 images.' });
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

