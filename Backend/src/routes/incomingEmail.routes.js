const router = require('express').Router();
const ctrl = require('../controllers/incomingEmail.controller');
const { protect, authorize } = require('../middleware/auth');

// Public cron endpoint for Vercel cron jobs
// Vercel cron jobs automatically call this endpoint
// GET /api/incoming-email/cron
// Note: Vercel cron jobs are already protected by Vercel infrastructure
router.get('/cron', async (req, res) => {
  try {
    // Optional: Check for authorization if CRON_SECRET is set
    // This provides an extra layer of security
    const cronSecret = process.env.CRON_SECRET || process.env.EMAIL_POLLING_SECRET;
    
    // If secret is configured, check for it
    // Vercel cron jobs can include custom headers via vercel.json configuration
    if (cronSecret) {
      const authHeader = req.headers.authorization;
      const queryToken = req.query.token;
      const providedSecret = authHeader?.replace('Bearer ', '') || queryToken;
      
      if (providedSecret !== cronSecret) {
        console.warn('[Cron] Unauthorized access attempt to cron endpoint');
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid or missing cron secret token'
        });
      }
    }
    
    console.log('[Cron] Email polling triggered by cron job');
    
    // Process emails
    const result = await ctrl.processIncomingEmails();
    
    console.log(`[Cron] Email processing completed: ${result.emailsProcessed || 0} emails processed`);
    
    res.status(200).json({
      success: result.success,
      message: result.message,
      emailsProcessed: result.emailsProcessed || 0,
      errors: result.errors || [],
      timestamp: new Date().toISOString()
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

