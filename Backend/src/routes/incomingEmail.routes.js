const router = require('express').Router();
const ctrl = require('../controllers/incomingEmail.controller');
const { protect, authorize } = require('../middleware/auth');

// Public cron endpoint for Vercel cron jobs and GitHub Actions
// GET /api/incoming-email/cron
// Supports authentication via query parameter (?token=SECRET) or Authorization header
router.get('/cron', async (req, res) => {
  try {
    // Optional: Check for authorization if CRON_SECRET is set
    // This provides an extra layer of security
    const cronSecret = process.env.CRON_SECRET || process.env.EMAIL_POLLING_SECRET;
    
    // If secret is configured, check for it
    // Supports: query parameter (?token=SECRET), Authorization header, or X-Cron-Secret header
    if (cronSecret) {
      const queryToken = req.query.token;
      const authHeader = req.headers.authorization;
      const cronSecretHeader = req.headers['x-cron-secret'];
      
      const providedSecret = queryToken || 
                           authHeader?.replace('Bearer ', '') || 
                           cronSecretHeader;
      
      if (providedSecret !== cronSecret) {
        console.warn('[Cron] Unauthorized access attempt to cron endpoint', {
          hasQueryToken: !!queryToken,
          hasAuthHeader: !!authHeader,
          hasCronSecretHeader: !!cronSecretHeader,
          userAgent: req.headers['user-agent']
        });
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid or missing cron secret token'
        });
      }
    }
    
    // Log the source of the request
    const source = req.headers['user-agent']?.includes('GitHub-Actions') 
      ? 'GitHub Actions' 
      : req.headers['x-vercel-cron'] 
        ? 'Vercel Cron' 
        : 'Manual/External';
    
    console.log(`[Cron] Email polling triggered by ${source}`);
    
    // Process emails
    const result = await ctrl.processIncomingEmails();
    
    console.log(`[Cron] Email processing completed: ${result.emailsProcessed || 0} emails processed`);
    
    res.status(200).json({
      success: result.success,
      message: result.message,
      emailsProcessed: result.emailsProcessed || 0,
      errors: result.errors || [],
      timestamp: new Date().toISOString(),
      source: source
    });
  } catch (error) {
    console.error('[Cron] Error processing emails:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing emails via cron',
      error: error.message
    });
  }
});

// All other routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Manual trigger to process emails
router.post('/process', ctrl.processEmails);

// Get polling status
router.get('/status', ctrl.getStatus);

// Test email connection (IMAP or POP3)
router.post('/test-connection', ctrl.testConnection);

module.exports = router;

