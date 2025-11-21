const imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const emailLogger = require('../utils/emailLogger');
const autoReplyService = require('./autoReply.service');

// Business email addresses to poll
const BUSINESS_EMAILS = [
  'enquiries@glisterluxury.com',
  'sales@glisterluxury.com',
  'orders@glisterluxury.com',
  'noreply@glisterluxury.com',
  'admin@glisterluxury.com'
];

// Store processed email UIDs to prevent duplicate processing
const processedEmails = new Map(); // email -> Set of UIDs

/**
 * Connect to IMAP server for a specific email address with retry logic
 * @param {string} emailAddress - Email address to connect to
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Object>} IMAP connection object
 */
async function connectToIMAP(emailAddress, retries = 3) {
  const imapConfig = {
    imap: {
      user: emailAddress,
      password: process.env.IMAP_PASSWORD || process.env.EMAIL_PASSWORD || 'GlisterLondon@123',
      host: process.env.IMAP_HOST || 'mail.livemail.co.uk',
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      },
      authTimeout: 15000,
      connTimeout: 15000,
      keepalive: {
        interval: 10000,
        idleInterval: 300000,
        forceNoop: true
      }
    }
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await imap.connect(imapConfig);
      return connection;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      
      // Check if it's a server problem that might be temporary
      if (error.textCode === 'UNAVAILABLE' || error.message.includes('Server problem')) {
        if (isLastAttempt) {
          emailLogger.error(`IMAP failed to connect after ${retries} attempts`, {
            emailAddress,
            error: error.message,
            code: error.code
          });
          throw error;
        }
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        emailLogger.warn(`IMAP connection failed, retrying`, {
          emailAddress,
          attempt,
          retries,
          waitTime,
          error: error.message
        });
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For other errors, throw immediately
      emailLogger.error(`IMAP connection failed`, {
        emailAddress,
        error: error.message,
        code: error.code
      });
      throw error;
    }
  }
}

/**
 * Fetch unread emails from an IMAP inbox
 * @param {string} emailAddress - Email address to fetch from
 * @returns {Promise<Array>} Array of email objects
 */
async function fetchUnreadEmails(emailAddress) {
  let connection = null;
  const emails = [];

  try {
    // Connect to IMAP with retry logic
    connection = await connectToIMAP(emailAddress, 2);
    
    // Open INBOX with timeout
    try {
      await Promise.race([
        connection.openBox('INBOX'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout opening INBOX')), 10000)
        )
      ]);
    } catch (timeoutError) {
      if (timeoutError.message === 'Timeout opening INBOX') {
        throw new Error(`Timeout opening INBOX for ${emailAddress}`);
      }
      throw timeoutError;
    }
    
    // Get processed UIDs for this email address
    const processedUIDs = processedEmails.get(emailAddress) || new Set();
    
    // Search for unread emails
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: '',  // Fetch full email body including headers
      struct: true
    };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    emailLogger.debug(`Found unread emails`, {
      emailAddress,
      count: messages.length
    });
    
    // Process each message
    for (const message of messages) {
      const uid = message.attributes.uid;
      
      // Skip if already processed
      if (processedUIDs.has(uid)) {
        continue;
      }
      
      try {
        // Try to get the full email body with headers
        // In imap-simple, when bodies: '' is used, the full email is in message.parts['']
        let parsed = null;
        let bodyPart = null;
        let headers = null;
        
        // Method 1: Try message.parts[''] (full email body with headers)
        if (message.parts && message.parts['']) {
          try {
            bodyPart = message.parts[''];
            parsed = await simpleParser(bodyPart);
            emailLogger.debug(`Parsed email from message.parts`, {
              emailAddress,
              uid
            });
          } catch (e) {
            emailLogger.debug(`Failed to parse from message.parts`, {
              emailAddress,
              uid,
              error: e.message
            });
          }
        }
        
        // Method 2: If that didn't work, fetch full message with bodies: ''
        if (!parsed || !parsed.from) {
          try {
            const fullFetch = await connection.search(['UID', uid], { 
              bodies: '', 
              struct: true 
            });
            
            if (fullFetch && fullFetch.length > 0) {
              const fullMsg = fullFetch[0];
              
              // Try to get the full body from the message
              if (fullMsg.parts && fullMsg.parts['']) {
                bodyPart = fullMsg.parts[''];
                parsed = await simpleParser(bodyPart);
                // Email parsed successfully from full fetch
              }
            }
          } catch (e) {
            // Error fetching full email, will try next method
          }
        }
        
        // Method 3: If still no from field, fetch headers separately and combine with body
        if (!parsed || !parsed.from) {
          try {
            // Fetch headers separately
            const headerFetch = await connection.search(['UNSEEN'], { 
              bodies: 'HEADER',
              struct: true 
            });
            
            if (headerFetch && headerFetch.length > 0) {
              const headerMsg = headerFetch.find(msg => msg.attributes.uid === uid);
              if (headerMsg && headerMsg.parts) {
                // Try different ways to get headers
                if (headerMsg.parts['HEADER']) {
                  headers = headerMsg.parts['HEADER'].toString();
                } else if (headerMsg.parts['']) {
                  headers = headerMsg.parts[''].toString();
                }
              }
            }
            
            // Now get body parts and combine with headers
            const parts = imap.getParts(message.attributes.struct);
            
            // Get the body part (prefer plain text, fallback to html)
            const bodyPartObj = parts.find(part => part.type === 'text' && part.subtype === 'plain') ||
                               parts.find(part => part.type === 'text' && part.subtype === 'html');
            
            if (bodyPartObj) {
              const bodyContent = await connection.getPartData(message, bodyPartObj);
              
              // If we have headers, combine them with body
              if (headers) {
                const fullEmail = headers + '\r\n\r\n' + bodyContent;
                parsed = await simpleParser(fullEmail);
                // Email parsed successfully from headers + body
              } else {
                // Try parsing just the body (might have headers embedded)
                parsed = await simpleParser(bodyContent);
              }
            }
          } catch (e) {
            // Error combining headers and body
          }
        }
        
        if (!parsed) {
          continue;
        }
        
        // Extract sender email - try multiple methods
        let senderEmail = '';
        let senderName = '';
        
        // Removed debug log for parsed email structure
        
        if (parsed.from) {
          // Method 1: Check if it's an array with value property
          if (parsed.from.value && Array.isArray(parsed.from.value) && parsed.from.value.length > 0) {
            senderEmail = parsed.from.value[0].address || '';
            senderName = parsed.from.value[0].name || '';
          }
          // Method 2: Check if it's a single object with address
          else if (parsed.from.address) {
            senderEmail = parsed.from.address;
            senderName = parsed.from.name || '';
          }
          // Method 3: Check text property
          else if (parsed.from.text) {
            // Try to extract email from text like "Name <email@domain.com>"
            const emailMatch = parsed.from.text.match(/<([^>]+)>/) || parsed.from.text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch) {
              senderEmail = emailMatch[1];
              senderName = parsed.from.text.replace(/<[^>]+>/, '').trim();
            } else {
              // If it's just an email address
              if (parsed.from.text.includes('@')) {
                senderEmail = parsed.from.text.trim();
              }
            }
          }
        }
        
        // Fallback: try to get from headers
        if (!senderEmail && parsed.headers) {
          let fromHeader = null;
          
          // Try different ways to access headers
          if (typeof parsed.headers.get === 'function') {
            fromHeader = parsed.headers.get('from');
          } else if (parsed.headers['from']) {
            fromHeader = parsed.headers['from'];
          } else if (Array.isArray(parsed.headers['from'])) {
            fromHeader = parsed.headers['from'][0];
          }
          
          if (fromHeader) {
            const emailMatch = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch) {
              senderEmail = emailMatch[1];
              senderName = fromHeader.replace(/<[^>]+>/, '').trim();
            } else if (fromHeader.includes('@')) {
              senderEmail = fromHeader.trim();
            }
          }
        }
        
        // Validate sender email
        if (!senderEmail || !senderEmail.includes('@')) {
          // Skip this email if we can't get a valid sender
          continue;
        }
        
        // Skip if sender is a business email address
        if (autoReplyService.isBusinessEmail(senderEmail)) {
          processedUIDs.add(uid);
          processedEmails.set(emailAddress, processedUIDs);
          continue;
        }
        
        // Extract recipient emails
        let recipientEmails = [emailAddress];
        if (parsed.to) {
          if (parsed.to.value && Array.isArray(parsed.to.value)) {
            recipientEmails = parsed.to.value.map(addr => addr.address).filter(Boolean);
          } else if (parsed.to.text) {
            const emailMatch = parsed.to.text.match(/<([^>]+)>/) || parsed.to.text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch) {
              recipientEmails = [emailMatch[1]];
            }
          }
        }
        
        // Extract email information
        const emailData = {
          uid: uid,
          messageId: parsed.messageId || `uid-${uid}-${emailAddress}`,
          from: {
            name: senderName || senderEmail.split('@')[0],
            email: senderEmail
          },
          to: recipientEmails.length > 0 ? recipientEmails : [emailAddress],
          subject: parsed.subject || '(No Subject)',
          text: parsed.text || '',
          html: parsed.html || '',
          date: parsed.date || new Date(),
          headers: parsed.headers
        };
        
        // Check if this is a reply to an auto-reply (prevent loops)
        const autoSubmitted = parsed.headers.get('auto-submitted') || 
                             parsed.headers.get('x-auto-response-suppress') ||
                             parsed.headers['auto-submitted'] ||
                             parsed.headers['x-auto-response-suppress'];
        
        if (autoSubmitted) {
          // Mark as processed but don't send auto-reply
          processedUIDs.add(uid);
          processedEmails.set(emailAddress, processedUIDs);
          continue;
        }
        
        // Check if from noreply addresses
        const fromEmail = emailData.from.email.toLowerCase();
        if (fromEmail.includes('noreply') || 
            fromEmail.includes('no-reply') || 
            fromEmail.includes('donotreply') ||
            fromEmail.includes('mailer-daemon')) {
          processedUIDs.add(uid);
          processedEmails.set(emailAddress, processedUIDs);
          continue;
        }
        
        // Log new email received
        emailLogger.info('📧 New email received', {
          emailAddress,
          from: emailData.from.email,
          fromName: emailData.from.name,
          subject: emailData.subject,
          messageId: emailData.messageId,
          uid: emailData.uid,
          date: emailData.date
        });
        
        emails.push(emailData);
        
        // Don't mark as processed or read yet - wait until auto-reply is successfully sent
        // This will be done in the controller after successful auto-reply
        
      } catch (parseError) {
        emailLogger.error(`Error parsing email`, {
          emailAddress,
          uid,
          error: parseError.message
        });
        // Mark as processed even if parsing failed to avoid retrying
        processedUIDs.add(uid);
        processedEmails.set(emailAddress, processedUIDs);
      }
    }
    
    return emails;
  } catch (error) {
    // Handle specific error types
    if (error.textCode === 'UNAVAILABLE' || error.message.includes('Server problem')) {
      emailLogger.warn(`Server temporarily unavailable`, {
        emailAddress,
        error: error.message
      });
      // Return empty array instead of throwing to allow other emails to be processed
      return [];
    }
    
    // For authentication errors, log but don't throw to allow other emails to be processed
    if (error.source === 'authentication') {
      emailLogger.error(`Authentication failed`, {
      emailAddress,
      error: error.message
    });
      return [];
    }
    
    emailLogger.error(`Error fetching emails`, {
      emailAddress,
      error: error.message,
      code: error.code
    });
    // Return empty array instead of throwing to allow other emails to be processed
    return [];
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        // Ignore close errors as they're not critical
        console.debug(`[IMAP Poller] Error closing connection to ${emailAddress}:`, closeError.message);
      }
    }
  }
}

/**
 * Test IMAP connection for an email address
 * @param {string} emailAddress - Email address to test
 * @returns {Promise<Object>} Connection test result
 */
async function testConnection(emailAddress) {
  let connection = null;
  
  try {
    connection = await connectToIMAP(emailAddress);
    await connection.openBox('INBOX');
    
    // Get mailbox stats using imap-simple API
    const searchCriteria = ['ALL'];
    const fetchOptions = { bodies: '', struct: true };
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    // Count unread emails
    const unreadCriteria = ['UNSEEN'];
    const unreadMessages = await connection.search(unreadCriteria, fetchOptions);
    
    return {
      success: true,
      message: 'Connection successful',
      stats: {
        total: messages.length,
        unread: unreadMessages.length,
        read: messages.length - unreadMessages.length
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error
    };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
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
 * Get processed UIDs for an email address
 * @param {string} emailAddress - Email address
 * @returns {Set} Set of processed UIDs
 */
function getProcessedUIDs(emailAddress) {
  return processedEmails.get(emailAddress) || new Set();
}

/**
 * Set processed UIDs for an email address
 * @param {string} emailAddress - Email address
 * @param {Set} uids - Set of UIDs to store
 */
function setProcessedUIDs(emailAddress, uids) {
  processedEmails.set(emailAddress, uids);
}

/**
 * Mark email as read (reconnect and mark)
 * @param {string} emailAddress - Email address
 * @param {number} uid - Email UID
 */
async function markEmailAsRead(emailAddress, uid) {
  let connection = null;
  try {
    connection = await connectToIMAP(emailAddress, 1);
    await connection.openBox('INBOX');
    await connection.addFlags(uid, '\\Seen');
    // Email marked as read (no log needed)
  } catch (error) {
    emailLogger.error(`Failed to mark email as read`, {
      emailAddress,
      uid,
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        // Ignore
      }
    }
  }
}

module.exports = {
  fetchUnreadEmails,
  testConnection,
  getBusinessEmails,
  connectToIMAP,
  getProcessedUIDs,
  setProcessedUIDs,
  markEmailAsRead
};

