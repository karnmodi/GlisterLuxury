// Try to load sharp, but make it optional for environments where it's not available (e.g., Vercel)
let sharp = null;
let sharpAvailable = false;

try {
	sharp = require('sharp');
	sharpAvailable = true;
	console.log('[imageCompression] Sharp module loaded successfully');
} catch (error) {
	console.warn('[imageCompression] Sharp module not available, compression will be skipped:', error.message);
	console.warn('[imageCompression] Images will be uploaded without server-side compression');
	sharpAvailable = false;
}

/**
 * Compress an image buffer using Sharp
 * @param {Buffer} imageBuffer - The image buffer to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeMB - Maximum size in MB (default: 2MB)
 * @param {number} options.maxWidthOrHeight - Maximum dimension (default: 2000)
 * @param {number} options.quality - JPEG/WebP quality 0-100 (default: 85)
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
async function compressImageBuffer(imageBuffer, options = {}) {
	// If sharp is not available, return original buffer
	if (!sharpAvailable || !sharp) {
		const originalSize = imageBuffer.length;
		console.log(`[compressImageBuffer] Sharp not available, skipping compression. Original size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
		return imageBuffer;
	}

	const {
		maxSizeMB = 2,
		maxWidthOrHeight = 2000,
		quality = 85
	} = options;

	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	const originalSize = imageBuffer.length;

	console.log(`[compressImageBuffer] Compressing image from ${(originalSize / 1024 / 1024).toFixed(2)}MB to target ${maxSizeMB}MB`);

	try {
		// Get image metadata
		const metadata = await sharp(imageBuffer).metadata();
		const { width, height, format } = metadata;

		console.log(`[compressImageBuffer] Image metadata: ${width}x${height}, format: ${format}`);

		// Calculate resize dimensions if needed
		let resizeWidth = width;
		let resizeHeight = height;
		
		if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
			if (width > height) {
				resizeWidth = maxWidthOrHeight;
				resizeHeight = Math.round((height / width) * maxWidthOrHeight);
			} else {
				resizeHeight = maxWidthOrHeight;
				resizeWidth = Math.round((width / height) * maxWidthOrHeight);
			}
			console.log(`[compressImageBuffer] Resizing from ${width}x${height} to ${resizeWidth}x${resizeHeight}`);
		}

		// Determine output format (prefer WebP for better compression, fallback to JPEG)
		const outputFormat = format === 'png' ? 'webp' : (format === 'jpeg' || format === 'jpg' ? 'jpeg' : 'webp');

		// Compress the image
		let compressedBuffer = await sharp(imageBuffer)
			.resize(resizeWidth, resizeHeight, {
				fit: 'inside',
				withoutEnlargement: true
			})
			[outputFormat]({ quality })
			.toBuffer();

		const compressedSize = compressedBuffer.length;
		const compressionRatio = compressedSize / originalSize;
		const savedBytes = originalSize - compressedSize;

		console.log(`[compressImageBuffer] Compression complete: ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${(compressionRatio * 100).toFixed(1)}% of original, saved ${(savedBytes / 1024 / 1024).toFixed(2)}MB)`);

		// If still too large, try more aggressive compression
		if (compressedSize > maxSizeBytes && quality > 50) {
			console.log(`[compressImageBuffer] Still too large, trying more aggressive compression (quality: ${quality - 20})`);
			compressedBuffer = await sharp(imageBuffer)
				.resize(resizeWidth, resizeHeight, {
					fit: 'inside',
					withoutEnlargement: true
				})
				[outputFormat]({ quality: quality - 20 })
				.toBuffer();
		}

		return compressedBuffer;
	} catch (error) {
		console.error(`[compressImageBuffer] Compression failed:`, error);
		// If compression fails, return original buffer
		return imageBuffer;
	}
}

/**
 * Compress multiple image buffers
 * @param {Array<Buffer>} imageBuffers - Array of image buffers to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Array<Buffer>>} - Array of compressed image buffers
 */
async function compressImageBuffers(imageBuffers, options = {}) {
	const results = [];

	for (let i = 0; i < imageBuffers.length; i++) {
		console.log(`[compressImageBuffers] Processing buffer ${i + 1}/${imageBuffers.length}`);
		try {
			const compressed = await compressImageBuffer(imageBuffers[i], options);
			results.push(compressed);
		} catch (error) {
			console.error(`[compressImageBuffers] Failed to compress buffer ${i + 1}:`, error);
			// If compression fails, use original buffer
			results.push(imageBuffers[i]);
		}
	}

	return results;
}

/**
 * Compress images from multer file objects
 * @param {Array} files - Array of multer file objects with buffer property
 * @param {Object} options - Compression options
 * @returns {Promise<Array>} - Array of file objects with compressed buffers
 */
async function compressMulterFiles(files, options = {}) {
	if (!files || files.length === 0) {
		return files;
	}

	// If sharp is not available, return original files
	if (!sharpAvailable || !sharp) {
		const totalSizeMB = calculateTotalSizeMB(files);
		console.log(`[compressMulterFiles] Sharp not available, skipping compression. Total size: ${totalSizeMB.toFixed(2)}MB`);
		return files;
	}

	console.log(`[compressMulterFiles] Compressing ${files.length} file(s)`);

	const compressedFiles = [];

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const originalSize = file.buffer ? file.buffer.length : 0;

		console.log(`[compressMulterFiles] Processing file ${i + 1}/${files.length}: ${file.originalname} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);

		if (!file.buffer) {
			console.warn(`[compressMulterFiles] File ${i + 1} has no buffer, skipping`);
			compressedFiles.push(file);
			continue;
		}

		try {
			const compressedBuffer = await compressImageBuffer(file.buffer, options);
			const compressedSize = compressedBuffer.length;
			const savedBytes = originalSize - compressedSize;

			console.log(`[compressMulterFiles] File ${i + 1} compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (saved ${(savedBytes / 1024 / 1024).toFixed(2)}MB)`);

			// Update file buffer with compressed version
			compressedFiles.push({
				...file,
				buffer: compressedBuffer,
				size: compressedSize
			});
		} catch (error) {
			console.error(`[compressMulterFiles] Failed to compress file ${i + 1}:`, error);
			// If compression fails, use original file
			compressedFiles.push(file);
		}
	}

	return compressedFiles;
}

/**
 * Calculate total size of files
 * @param {Array} files - Array of file objects with size or buffer property
 * @returns {number} - Total size in bytes
 */
function calculateTotalSize(files) {
	if (!files || files.length === 0) {
		return 0;
	}

	return files.reduce((total, file) => {
		if (file.size) {
			return total + file.size;
		}
		if (file.buffer) {
			return total + file.buffer.length;
		}
		return total;
	}, 0);
}

/**
 * Calculate total size in MB
 * @param {Array} files - Array of file objects
 * @returns {number} - Total size in MB
 */
function calculateTotalSizeMB(files) {
	return calculateTotalSize(files) / (1024 * 1024);
}

module.exports = {
	compressImageBuffer,
	compressImageBuffers,
	compressMulterFiles,
	calculateTotalSize,
	calculateTotalSizeMB,
};

