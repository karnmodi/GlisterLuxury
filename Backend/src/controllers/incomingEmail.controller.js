const imapPoller = require('../services/imapEmailPoller.service');
const pop3Poller = require('../services/pop3EmailPoller.service');
const autoReplyService = require('../services/autoReply.service');
const emailLogger = require('../utils/emailLogger');

const EMAIL_POLLING_METHOD = process.env.EMAIL_POLLING_METHOD || 'pop3';
const MAX_PROCESSING_TIME = 2 * 60 * 1000; // 2 minutes
const ACCOUNT_DELAY = 500; // Delay between email accounts (ms)

let pollingStatus = {
  lastChecked: null,
  isRunning: false,
  emailsProcessed: 0,
  errors: []
};

/**
 * Process incoming emails for all business email addresses
 * @returns {Promise<Object>} Processing result
 */
async function processIncomingEmails() {
  const isStuck = pollingStatus.isRunning && 
                  pollingStatus.lastChecked && 
                  (Date.now() - new Date(pollingStatus.lastChecked).getTime()) > MAX_PROCESSING_TIME;
  
  if (pollingStatus.isRunning && !isStuck) {
    return { success: false, message: 'Processing already in progress' };
  }
  
  if (isStuck) {
    emailLogger.warn('Previous processing appears stuck, resetting', {
      lastChecked: pollingStatus.lastChecked,
      elapsed: Date.now() - new Date(pollingStatus.lastChecked).getTime()
    });
  }

  pollingStatus.isRunning = true;
  pollingStatus.lastChecked = new Date();
  pollingStatus.errors = [];
  let totalProcessed = 0;
  const processedEmailsDetails = []; // Track detailed information about processed emails

  // Removed repetitive polling cycle logs

  try {
    const businessEmails = EMAIL_POLLING_METHOD === 'pop3' 
      ? pop3Poller.getBusinessEmails()
      : imapPoller.getBusinessEmails();

    for (const emailAddress of businessEmails) {
      try {
        await new Promise(resolve => setTimeout(resolve, ACCOUNT_DELAY));
        
        let emails = [];
        try {
          emails = EMAIL_POLLING_METHOD === 'pop3'
            ? await pop3Poller.fetchUnreadEmails(emailAddress)
            : await imapPoller.fetchUnreadEmails(emailAddress);
        } catch (fetchError) {
          // Log error but continue with other email addresses
          const isDnsError = fetchError.message?.includes('DNS lookup failed') || fetchError.code === 'ENOTFOUND';
          if (isDnsError) {
            // Only add DNS errors once to avoid spam
            const existingDnsError = pollingStatus.errors.find(
              e => e.email === emailAddress && e.error?.includes('DNS')
            );
            if (!existingDnsError) {
              pollingStatus.errors.push({
                email: emailAddress,
                error: `DNS lookup failed. Please verify POP3_HOST or IMAP_HOST is correct.`,
                timestamp: new Date().toISOString()
              });
            }
          } else {
            pollingStatus.errors.push({
              email: emailAddress,
              error: `Failed to fetch emails: ${fetchError.message}`,
              timestamp: new Date().toISOString()
            });
          }
          continue;
        }
        
        for (const email of emails) {
          try {
            // Track new email received
            processedEmailsDetails.push({
              status: 'received',
              timestamp: new Date().toISOString(),
              receivedFrom: {
                email: email.from.email,
                name: email.from.name,
                subject: email.subject
              },
              receivedAt: emailAddress,
              messageId: email.messageId
            });
            
            const config = await autoReplyService.getAutoReplyConfig(emailAddress);
            
            if (!config || !config.enabled) {
              if (EMAIL_POLLING_METHOD === 'imap') {
                const processedUIDs = imapPoller.getProcessedUIDs(emailAddress);
                processedUIDs.add(email.uid);
                imapPoller.setProcessedUIDs(emailAddress, processedUIDs);
              }
              continue;
            }
            
            if (!config.subject || !config.message) {
              continue;
            }

            const recipientEmail = email.from.email;
            const recipientName = email.from.name || recipientEmail.split('@')[0];

            if (!recipientEmail || !recipientEmail.includes('@')) {
              if (EMAIL_POLLING_METHOD === 'imap') {
                const processedUIDs = imapPoller.getProcessedUIDs(emailAddress);
                processedUIDs.add(email.uid);
                imapPoller.setProcessedUIDs(emailAddress, processedUIDs);
              }
              continue;
            }

            // Check if sender is a business email - skip entirely
            if (autoReplyService.isBusinessEmail(recipientEmail)) {
              if (EMAIL_POLLING_METHOD === 'imap') {
                const processedUIDs = imapPoller.getProcessedUIDs(emailAddress);
                processedUIDs.add(email.uid);
                imapPoller.setProcessedUIDs(emailAddress, processedUIDs);
              }
              continue;
            }

            // Check if we've already replied to this email (database check)
            const alreadyReplied = await autoReplyService.checkIfAlreadyReplied(
              emailAddress,
              recipientEmail,
              email.messageId,
              email.subject,
              email.date
            );
            
            if (alreadyReplied) {
              if (EMAIL_POLLING_METHOD === 'imap') {
                const processedUIDs = imapPoller.getProcessedUIDs(emailAddress);
                processedUIDs.add(email.uid);
                imapPoller.setProcessedUIDs(emailAddress, processedUIDs);
              }
              continue;
            }

            // Mark as replied in database BEFORE sending to prevent race conditions
            const marked = await autoReplyService.markAsReplied(
              emailAddress,
              recipientEmail,
              email.messageId,
              email.subject,
              email.date
            );
            
            if (!marked) {
              // Already marked (race condition) - skip sending
              if (EMAIL_POLLING_METHOD === 'imap') {
                const processedUIDs = imapPoller.getProcessedUIDs(emailAddress);
                processedUIDs.add(email.uid);
                imapPoller.setProcessedUIDs(emailAddress, processedUIDs);
              }
              continue;
            }

            const sent = await autoReplyService.sendAutoReply(
              emailAddress,
              recipientEmail,
              recipientName,
              email.subject,
              email.messageId,
              email.date
            );

            if (sent) {
              totalProcessed++;
              
              // Get auto-reply config to include subject and message preview
              const config = await autoReplyService.getAutoReplyConfig(emailAddress);
              
              // Track detailed information for logging
              processedEmailsDetails.push({
                status: 'sent',
                timestamp: new Date().toISOString(),
                receivedFrom: {
                  email: recipientEmail,
                  name: recipientName,
                  subject: email.subject
                },
                autoReplySent: {
                  from: emailAddress,
                  to: recipientEmail,
                  subject: config?.subject || 'Auto-reply',
                  messagePreview: config?.message ? config.message.substring(0, 100) + '...' : ''
                },
                messageId: email.messageId
              });
              
              // Log auto-reply sent - this is the key event to track
              emailLogger.info('✅ Auto-reply sent', {
                emailAddress,
                recipientEmail,
                recipientName,
                originalSubject: email.subject,
                messageId: email.messageId,
                sentAt: new Date().toISOString()
              });
              
              // Mark as processed (already marked in database above)
              if (EMAIL_POLLING_METHOD === 'pop3') {
                await pop3Poller.markEmailAsReplied(emailAddress, email);
              } else {
                const processedUIDs = imapPoller.getProcessedUIDs(emailAddress);
                processedUIDs.add(email.uid);
                imapPoller.setProcessedUIDs(emailAddress, processedUIDs);
                imapPoller.markEmailAsRead(emailAddress, email.uid).catch(() => {});
              }
            } else {
              // Track failed auto-reply
              processedEmailsDetails.push({
                status: 'failed',
                timestamp: new Date().toISOString(),
                receivedFrom: {
                  email: recipientEmail,
                  name: recipientName,
                  subject: email.subject
                },
                autoReplyFailed: {
                  from: emailAddress,
                  to: recipientEmail,
                  reason: 'Auto-reply send failed'
                },
                messageId: email.messageId
              });
              
              // If send failed, we should remove the mark (optional - for retry logic)
              // For now, we'll keep it marked to prevent duplicate attempts
              emailLogger.logEmailEvent('failed', email, emailAddress, {
                recipientEmail,
                reason: 'Auto-reply send failed'
              });
            }
          } catch (error) {
            emailLogger.error('Error processing email', {
              emailAddress,
              email: email.from?.email,
              subject: email.subject,
              error: error.message
            });
            pollingStatus.errors.push({
              email: emailAddress,
              error: error.message
            });
          }
        }
      } catch (error) {
        emailLogger.error('Error fetching emails for account', {
          emailAddress,
          error: error.message,
          code: error.code
        });
        pollingStatus.errors.push({
          email: emailAddress,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        continue;
      }
    }

    pollingStatus.emailsProcessed = totalProcessed;
    
    return {
      success: true,
      message: `Processed ${totalProcessed} emails`,
      emailsProcessed: totalProcessed,
      errors: pollingStatus.errors
    };
  } catch (error) {
    pollingStatus.errors.push({ error: error.message });
    return {
      success: false,
      message: error.message,
      errors: pollingStatus.errors
    };
  } finally {
    pollingStatus.isRunning = false;
  }
}

/**
 * Manual trigger to process emails
 * POST /api/incoming-email/process
 */
async function processEmails(req, res) {
  try {
    const result = await processIncomingEmails();
    res.status(200).json({
      success: result.success,
      message: result.message,
      emailsProcessed: result.emailsProcessed || 0,
      errors: result.errors || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing emails',
      error: error.message
    });
  }
}

/**
 * Get polling status
 * GET /api/incoming-email/status
 */
async function getStatus(req, res) {
  try {
    res.status(200).json({
      method: EMAIL_POLLING_METHOD.toUpperCase(),
      lastChecked: pollingStatus.lastChecked,
      isRunning: pollingStatus.isRunning,
      emailsProcessed: pollingStatus.emailsProcessed,
      errors: pollingStatus.errors
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error getting status',
      details: error.message
    });
  }
}

/**
 * Test email connection (IMAP or POP3)
 * POST /api/incoming-email/test-connection
 */
async function testConnection(req, res) {
  try {
    const { emailAddress } = req.body;
    
    if (!emailAddress) {
      return res.status(400).json({ error: 'emailAddress is required' });
    }

    const result = EMAIL_POLLING_METHOD === 'pop3'
      ? await pop3Poller.testConnection(emailAddress)
      : await imapPoller.testConnection(emailAddress);
    
    result.method = EMAIL_POLLING_METHOD.toUpperCase();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        method: result.method,
        stats: result.stats
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        method: result.method,
        error: result.error?.message
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Error testing connection',
      method: EMAIL_POLLING_METHOD.toUpperCase(),
      details: error.message
    });
  }
}

module.exports = {
  processEmails,
  getStatus,
  testConnection,
  processIncomingEmails
};
