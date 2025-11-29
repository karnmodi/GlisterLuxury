/**
 * Email Helper Utilities
 * Provides common functions for email templates
 */

/**
 * Get the logo URL for email templates
 * @param {Object} req - Optional Express request object (for dynamic frontend URL detection)
 * @returns {string} - The logo URL (always absolute and publicly accessible)
 */
function getLogoUrl(req = null) {
  // Priority order: FRONTEND_URL_2 (production) > FRONTEND_URL > localhost fallback
  // FRONTEND_URL_2 is typically used for production domains (.co.uk)
  let frontendUrl = process.env.FRONTEND_URL_2 || process.env.FRONTEND_URL;
  
  // Try to get frontend URL from request if provided and no env var is set
  if (!frontendUrl && req) {
    const origin = req.headers.origin || req.headers.referer || '';
    if (origin) {
      try {
        const url = new URL(origin);
        frontendUrl = `${url.protocol}//${url.host}`;
      } catch (e) {
        // Invalid URL, continue with fallback
      }
    }
  }
  
  // Final fallback - use localhost only in development
  if (!frontendUrl) {
    frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://glisterluxury.co.uk' // Production fallback
      : 'http://localhost:3000'; // Development fallback
  }
  
  // Ensure URL is absolute and doesn't end with slash
  frontendUrl = frontendUrl.replace(/\/$/, '');
  
  return `${frontendUrl}/images/business/G.png`;
}

module.exports = {
  getLogoUrl
};

