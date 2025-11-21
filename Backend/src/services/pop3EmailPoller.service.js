const { simpleParser } = require('mailparser');
const POP3Client = require('node-pop3');
const emailLogger = require('../utils/emailLogger');
const autoReplyService = require('./autoReply.service');

const BUSINESS_EMAILS = [
  'enquiries@glisterluxury.com',
  'sales@glisterluxury.com',
  'orders@glisterluxury.com',
  'noreply@glisterluxury.com',
  'admin@glisterluxury.com'
];

const NOREPLY_PATTERNS = ['noreply', 'no-reply', 'donotreply', 'mailer-daemon'];

// Track processed emails to prevent duplicate auto-replies
// Key: emailAddress, Value: Set of messageIds that have been replied to
const processedEmails = new Map();

// Track replied emails (emails we've sent auto-replies to)
// Key: emailAddress, Value: Set of unique identifiers (sender+subject+date)
const repliedEmails = new Map();

/**
 * Connect to POP3 server
 * @param {string} emailAddress - Email address to connect to
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Object>} POP3 connection object
 */
async function connectToPOP3(emailAddress, retries = 3) {
  const password = process.env.IMAP_PASSWORD || process.env.EMAIL_PASSWORD || 'GlisterLondon@123';
  const host = process.env.POP3_HOST || process.env.IMAP_HOST || 'mail.livemail.co.uk';
  const port = parseInt(process.env.POP3_PORT) || 995;

  if (!host) {
    throw new Error('POP3 host is not configured. Please set POP3_HOST or IMAP_HOST environment variable.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = new POP3Client({
        user: emailAddress,
        password,
        host,
        port,
        tls: port === 995,
        tlsOptions: { rejectUnauthorized: false },
        timeout: 15000
      });
      
      await client._connect();
      return client;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isDnsError = error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo');
      
      if (isDnsError) {
        throw new Error(`DNS lookup failed for ${host}. Please verify POP3_HOST or IMAP_HOST is correct.`);
      }
      
      if (isLastAttempt) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

/**
 * Extract sender email from parsed email
 * @param {Object} parsed - Parsed email object
 * @returns {Object} { email, name }
 */
function extractSender(parsed) {
  if (!parsed.from) return null;

  if (parsed.from.value?.[0]) {
    return {
      email: parsed.from.value[0].address || '',
      name: parsed.from.value[0].name || ''
    };
  }

  if (parsed.from.text) {
    const emailMatch = parsed.from.text.match(/<([^>]+)>/) || 
                      parsed.from.text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      return {
        email: emailMatch[1],
        name: parsed.from.text.replace(/<[^>]+>/, '').trim()
      };
    }
  }

  return null;
}

/**
 * Check if email is an auto-reply
 * @param {Object} headers - Email headers
 * @returns {boolean}
 */
function isAutoReply(headers) {
  if (!headers) return false;
  
  return !!(headers.get?.('auto-submitted') || 
            headers.get?.('x-auto-response-suppress') ||
            headers['auto-submitted'] ||
            headers['x-auto-response-suppress']);
}

/**
 * Check if email is from noreply address
 * @param {string} email - Email address
 * @returns {boolean}
 */
function isNoreplyAddress(email) {
  const lowerEmail = email.toLowerCase();
  return NOREPLY_PATTERNS.some(pattern => lowerEmail.includes(pattern));
}

/**
 * Generate unique identifier for an email to track replies
 * @param {Object} email - Email object
 * @returns {string} Unique identifier
 */
function getEmailIdentifier(email) {
  const sender = email.from?.email || '';
  const subject = email.subject || '';
  const date = email.date ? new Date(email.date).toISOString().split('T')[0] : '';
  return `${sender}|${subject}|${date}`;
}

/**
 * Check if email has already been replied to (deprecated - use database check)
 * @param {string} emailAddress - Business email address
 * @param {Object} email - Email object
 * @returns {boolean} True if already replied
 * @deprecated Use autoReplyService.checkIfAlreadyReplied() instead
 */
function hasBeenRepliedTo(emailAddress, email) {
  // This is kept for backward compatibility but should not be used
  // Database check is now the primary method
  const repliedSet = repliedEmails.get(emailAddress) || new Set();
  const identifier = getEmailIdentifier(email);
  return repliedSet.has(identifier);
}

/**
 * Mark email as replied to
 * @param {string} emailAddress - Business email address
 * @param {Object} email - Email object
 */
function markAsRepliedTo(emailAddress, email) {
  if (!repliedEmails.has(emailAddress)) {
    repliedEmails.set(emailAddress, new Set());
  }
  const identifier = getEmailIdentifier(email);
  repliedEmails.get(emailAddress).add(identifier);
}

/**
 * Fetch unread emails from POP3 server
 * @param {string} emailAddress - Email address to fetch from
 * @returns {Promise<Array>} Array of email objects
 */
async function fetchUnreadEmails(emailAddress) {
  let client = null;
  
  try {
    client = await connectToPOP3(emailAddress);
    const list = await client.LIST();
    
    if (list.length === 0) return [];

    const emails = [];
    const processedSet = processedEmails.get(emailAddress) || new Set();
    
    for (const msgInfo of list) {
      const msgNumber = parseInt(msgInfo[0]);
      
      try {
        const rawEmail = await client.RETR(msgNumber);
        const parsed = await simpleParser(rawEmail);
        
        const sender = extractSender(parsed);
        if (!sender?.email || !sender.email.includes('@')) {
          continue;
        }
        
        // Skip if sender is a business email address
        if (autoReplyService.isBusinessEmail(sender.email)) {
          continue;
        }
        
        if (isAutoReply(parsed.headers) || isNoreplyAddress(sender.email)) {
          continue;
        }
        
        const messageId = parsed.messageId || `pop3-${msgNumber}-${emailAddress}`;
        
        // Skip if already processed
        if (processedSet.has(messageId)) {
          continue;
        }
        
        const emailData = {
          uid: msgNumber,
          messageId,
          from: {
            name: sender.name || sender.email.split('@')[0],
            email: sender.email
          },
          to: parsed.to?.value?.map(addr => addr.address) || [emailAddress],
          subject: parsed.subject || '(No Subject)',
          text: parsed.text || '',
          html: parsed.html || '',
          date: parsed.date || new Date(),
          headers: parsed.headers
        };
        
        // Check if we've already replied to this email (database check)
        const alreadyReplied = await autoReplyService.checkIfAlreadyReplied(
          emailAddress,
          emailData.from.email,
          emailData.messageId,
          emailData.subject,
          emailData.date
        );
        
        if (alreadyReplied) {
          processedSet.add(messageId);
          continue;
        }
        
        // Log new email received
        emailLogger.info('📧 New email received', {
          emailAddress,
          from: emailData.from.email,
          fromName: emailData.from.name,
          subject: emailData.subject,
          messageId: emailData.messageId,
          date: emailData.date
        });
        
        emails.push(emailData);
      } catch (error) {
        // Silently skip individual message errors
        continue;
      }
    }
    
    // Update processed emails map
    processedEmails.set(emailAddress, processedSet);
    
    return emails;
  } catch (error) {
    // Only log connection errors, not individual message errors
    const isDnsError = error.message?.includes('DNS lookup failed') || error.code === 'ENOTFOUND';
    const host = process.env.POP3_HOST || process.env.IMAP_HOST || 'mail.livemail.co.uk';
    
    if (isDnsError) {
      emailLogger.error(`POP3 DNS error for ${emailAddress}`, {
        emailAddress,
        host,
        error: error.message,
        code: error.code,
        message: 'Cannot resolve host. Please verify POP3_HOST or IMAP_HOST is correct in your .env file.'
      });
    } else {
      emailLogger.error(`POP3 connection error for ${emailAddress}`, {
        emailAddress,
        error: error.message,
        code: error.code
      });
    }
    return [];
  } finally {
    if (client) {
      try {
        await client.quit();
      } catch (error) {
        // Ignore close errors
      }
    }
  }
}

/**
 * Test POP3 connection
 * @param {string} emailAddress - Email address to test
 * @returns {Promise<Object>} Connection test result
 */
async function testConnection(emailAddress) {
  let client = null;
  
  try {
    const host = process.env.POP3_HOST || process.env.IMAP_HOST || 'mail.livemail.co.uk';
    
    // Check if host is configured
    if (!host || host === 'mail.livemail.co.uk') {
      return {
        success: false,
        message: 'POP3 host not configured. Please set POP3_HOST or IMAP_HOST environment variable with your FastHost POP3 server hostname.',
        error: { code: 'CONFIG_ERROR' }
      };
    }
    
    client = await connectToPOP3(emailAddress, 1);
    const list = await client.LIST();
    
    return {
      success: true,
      message: 'Connection successful',
      stats: {
        total: list.length,
        unread: list.length
      }
    };
  } catch (error) {
    const isDnsError = error.code === 'ENOTFOUND' || error.message?.includes('DNS lookup failed');
    const host = process.env.POP3_HOST || process.env.IMAP_HOST || 'mail.livemail.co.uk';
    
    return {
      success: false,
      message: isDnsError 
        ? `DNS lookup failed for ${host}. Please verify POP3_HOST or IMAP_HOST is correct. Check your FastHost email settings for the correct POP3 server hostname.`
        : error.message,
      error: {
        code: isDnsError ? 'DNS_ERROR' : error.code,
        message: error.message
      }
    };
  } finally {
    if (client) {
      try {
        await client.quit();
      } catch (error) {
        // Ignore close errors
      }
    }
  }
}

/**
 * Get all business email addresses
 * @returns {Array<string>} Array of business email addresses
 */
function getBusinessEmails() {
  return BUSINESS_EMAILS;
}

/**
 * Mark email as replied to (prevents duplicate replies)
 * @param {string} emailAddress - Business email address
 * @param {Object} email - Email object
 */
async function markEmailAsReplied(emailAddress, email) {
  // Mark in database (primary tracking)
  await autoReplyService.markAsReplied(
    emailAddress,
    email.from.email,
    email.messageId,
    email.subject,
    email.date
  );
  
  // Also mark in-memory for backward compatibility
  markAsRepliedTo(emailAddress, email);
  // Also mark messageId as processed
  if (!processedEmails.has(emailAddress)) {
    processedEmails.set(emailAddress, new Set());
  }
  if (email.messageId) {
    processedEmails.get(emailAddress).add(email.messageId);
  }
}

/**
 * Get replied emails set for an email address (for checking duplicates)
 * @param {string} emailAddress - Business email address
 * @returns {Set} Set of replied email identifiers
 */
function getRepliedEmails(emailAddress) {
  return repliedEmails.get(emailAddress) || new Set();
}

module.exports = {
  connectToPOP3,
  fetchUnreadEmails,
  testConnection,
  getBusinessEmails,
  markEmailAsReplied,
  getRepliedEmails
};
