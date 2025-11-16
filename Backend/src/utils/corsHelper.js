/**
 * CORS Helper Utility
 * Provides functions to set CORS headers explicitly
 */

const normalizeOrigin = (value) => (typeof value === 'string' ? value.replace(/\/+$/, '') : value);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  // Custom domains
  'https://www.glisterluxury.com',
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

/**
 * Get the allowed origin for a request
 * @param {Object} req - Express request object
 * @returns {string|null} - The allowed origin or null
 */
function getAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return null;
  
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) {
    return normalized;
  }
  
  return null;
}

/**
 * Set CORS headers on a response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function setCorsHeaders(req, res) {
  const origin = getAllowedOrigin(req);
  
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Session-ID');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

/**
 * Handle OPTIONS preflight request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleOptionsRequest(req, res) {
  setCorsHeaders(req, res);
  res.status(200).end();
}

module.exports = {
  setCorsHeaders,
  handleOptionsRequest,
  getAllowedOrigin
};

