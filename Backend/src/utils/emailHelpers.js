/**
 * Email Helper Utilities
 * Provides common functions for email templates
 */

/**
 * Get the logo URL for email templates
 * @param {Object} req - Optional Express request object (for dynamic frontend URL detection)
 * @returns {string} - The logo URL
 */
function getLogoUrl(req = null) {
  // Try to get frontend URL from request if provided
  if (req) {
    const origin = req.headers.origin || req.headers.referer || '';
    if (origin.includes('.co.uk')) {
      const frontendUrl = process.env.FRONTEND_URL_2 || process.env.FRONTEND_URL || 'http://localhost:3000';
      return `${frontendUrl}/images/business/G.png`;
    }
  }
  
  // Default to FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/images/business/G.png`;
}

module.exports = {
  getLogoUrl
};

