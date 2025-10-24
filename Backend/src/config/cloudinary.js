const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
	cloudinary_url: process.env.CLOUDINARY_URL,
});

/**
 * Upload a single file to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary response with URL
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder: options.folder || 'glister',
				resource_type: 'auto',
				transformation: options.transformation || [
					{ quality: 'auto', fetch_format: 'auto' }
				],
				...options,
			},
			(error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			}
		);
		uploadStream.end(fileBuffer);
	});
};

/**
 * Delete an image from Cloudinary
 * @param {String} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - Cloudinary response
 */
const deleteFromCloudinary = (publicId) => {
	return cloudinary.uploader.destroy(publicId);
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<String>} publicIds - Array of public IDs to delete
 * @returns {Promise<Object>} - Cloudinary response
 */
const deleteMultipleFromCloudinary = (publicIds) => {
	return cloudinary.api.delete_resources(publicIds);
};

module.exports = {
	cloudinary,
	uploadToCloudinary,
	deleteFromCloudinary,
	deleteMultipleFromCloudinary,
};

