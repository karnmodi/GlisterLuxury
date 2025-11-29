const Settings = require('../models/Settings');
const ProcessedEmail = require('../models/ProcessedEmail');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const emailLogger = require('../utils/emailLogger');
const { getLogoUrl } = require('../utils/emailHelpers');

// Business email addresses that should not receive auto-replies
const BUSINESS_EMAILS = [
  'enquiries@glisterluxury.com',
  'sales@glisterluxury.com',
  'orders@glisterluxury.com',
  'noreply@glisterluxury.com',
  'admin@glisterluxury.com'
];

/**
 * Get auto-reply configuration for a specific email address
 * @param {string} emailAddress - The email address to get config for
 * @returns {Promise<Object|null>} Auto-reply configuration or null if not found
 */
async function getAutoReplyConfig(emailAddress) {
  try {
    const settings = await Settings.getSettings();
    const normalizedEmail = emailAddress.toLowerCase().trim();
    
    return settings.autoReplySettings?.find(
      setting => setting.emailAddress.toLowerCase().trim() === normalizedEmail
    ) || null;
  } catch (error) {
    emailLogger.error('Error getting auto-reply config', {
      emailAddress,
      error: error.message
    });
    return null;
  }
}

/**
 * Check if email is a business email address
 * @param {string} email - Email address to check
 * @returns {boolean} True if business email
 */
function isBusinessEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalizedEmail = email.toLowerCase().trim();
  return BUSINESS_EMAILS.some(businessEmail => 
    businessEmail.toLowerCase() === normalizedEmail
  );
}

/**
 * Check if email was already replied to
 * @param {string} emailAddress - Business email address
 * @param {string} senderEmail - Sender email address
 * @param {string} messageId - Email message ID
 * @param {string} subject - Email subject
 * @param {Date} date - Email date
 * @returns {Promise<boolean>} True if already replied
 */
async function checkIfAlreadyReplied(emailAddress, senderEmail, messageId, subject, date) {
  try {
    // Check if mongoose is connected using mongoose.connection
    if (mongoose.connection.readyState !== 1) {
      // Database not connected, return false to allow processing
      return false;
    }
    return await ProcessedEmail.checkIfReplied(emailAddress, senderEmail, messageId, subject, date);
  } catch (error) {
    emailLogger.error('Error checking if email was already replied', {
      emailAddress,
      senderEmail,
      error: error.message,
      stack: error.stack
    });
    // On error, assume not replied to avoid blocking legitimate emails
    return false;
  }
}

/**
 * Mark email as replied in database
 * @param {string} emailAddress - Business email address
 * @param {string} senderEmail - Sender email address
 * @param {string} messageId - Email message ID
 * @param {string} subject - Email subject
 * @param {Date} date - Email date
 * @returns {Promise<boolean>} True if successfully marked, false if already exists
 */
async function markAsReplied(emailAddress, senderEmail, messageId, subject, date) {
  try {
    // Check if mongoose is connected using mongoose.connection
    if (mongoose.connection.readyState !== 1) {
      // Database not connected, return false to prevent marking
      emailLogger.warn('Database not connected, cannot mark email as replied', {
        emailAddress,
        senderEmail
      });
      return false;
    }
    const result = await ProcessedEmail.markAsReplied(emailAddress, senderEmail, messageId, subject, date);
    return result !== null; // Returns false if already exists (race condition)
  } catch (error) {
    emailLogger.error('Error marking email as replied', {
      emailAddress,
      senderEmail,
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    // On error, return false to prevent duplicate sends
    return false;
  }
}

/**
 * Replace variables in message text
 * @param {string} text - Text with variables
 * @param {Object} variables - Variables to replace
 * @returns {string} Text with variables replaced
 */
function replaceVariables(text, variables) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, variables[key] || '');
  });
  
  return result;
}

/**
 * Format auto-reply message as HTML email
 * @param {string} message - The message text
 * @param {Object} variables - Variables to replace
 * @param {Object} req - Optional Express request object for logo URL
 * @returns {string} HTML formatted email
 */
function formatAutoReplyHTML(message, variables, req = null) {
  const formattedMessage = replaceVariables(message, variables);
  const htmlMessage = formattedMessage.replace(/\n/g, '<br>').replace(/\r/g, '');
  const logoUrl = getLogoUrl(req);
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #333333; 
          background-color: #f5f5f5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .email-wrapper { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
        }
        .header { 
          background: linear-gradient(135deg, #2C2C2C 0%, #1a1a1a 100%); 
          padding: 40px 20px; 
          text-align: center;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .logo-container {
          margin-bottom: 20px;
        }
        .logo { 
          max-width: 120px; 
          height: auto; 
          display: block;
          margin: 0 auto;
        }
        .header-text {
          color: #D4AF37;
          font-size: 18px;
          font-weight: 300;
          letter-spacing: 2px;
          margin-top: 15px;
        }
        .content { 
          background-color: #ffffff; 
          padding: 30px 20px; 
        }
        .message-box { 
          background-color: #ffffff; 
          border-left: 4px solid #D4AF37; 
          padding: 20px; 
          margin: 20px 0; 
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .message-box p {
          margin: 0;
          line-height: 1.8;
          color: #333333;
        }
        .footer { 
          text-align: center; 
          padding: 30px 20px; 
          color: #666666; 
          font-size: 13px;
          background-color: #f9f9f9;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .footer p {
          margin: 8px 0;
          line-height: 1.6;
        }
        .footer a {
          color: #2C2C2C;
          text-decoration: none;
          font-weight: 500;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        @media only screen and (max-width: 600px) {
          .email-wrapper { width: 100% !important; }
          .header { padding: 30px 15px; }
          .content { padding: 20px 15px; }
          .footer { padding: 20px 15px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <div class="logo-container">
            <img src="${logoUrl}" alt="Glister Luxury" class="logo" style="max-width: 120px; height: auto; display: block; margin: 0 auto;" />
          </div>
          <div class="header-text">The Soul of Interior</div>
        </div>
        <div class="content">
          <div class="message-box">
            <p style="white-space: pre-wrap;">${htmlMessage}</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this email.</p>
          <p>If you have any questions, feel free to reach out:</p>
          <p>
            <a href="mailto:enquiries@glisterluxury.com">enquiries@glisterluxury.com</a> (All purposes) | 
            <a href="mailto:sales@glisterluxury.com">sales@glisterluxury.com</a> (Business purposes)
          </p>
          <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} Glister Luxury. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create email transporter
 * @param {string} emailAddress - Email address for authentication
 * @returns {Object} Nodemailer transporter
 */
function createTransporter(emailAddress) {
  const password = process.env.EMAIL_PASSWORD || process.env.IMAP_PASSWORD;
  
  if (!password) {
    throw new Error('EMAIL_PASSWORD or IMAP_PASSWORD is not configured');
  }
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.livemail.co.uk',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: emailAddress,
      pass: password
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
}

/**
 * Check if error is a temporary failure that should be retried
 * @param {Error} error - Error object
 * @returns {boolean} True if error is temporary
 */
function isTemporaryError(error) {
  if (!error) return false;
  
  // Convert all error properties to strings safely
  const errorCode = String(error.code || '');
  const errorMessage = String(error.message || '');
  const responseCode = error.responseCode ? String(error.responseCode) : '';
  const response = error.response ? String(error.response) : '';
  
  // Check for authentication errors (usually not temporary)
  const authErrors = ['Invalid login', 'authentication failed', '535', '5.7.8'];
  const isAuthError = authErrors.some(auth => 
    errorMessage.toLowerCase().includes(auth.toLowerCase())
  );
  
  // Authentication errors with temporary codes might still be temporary
  if (isAuthError && !errorMessage.includes('454') && !errorMessage.includes('4.7.0')) {
    return false; // Permanent auth error
  }
  
  // Check for temporary failure codes
  const temporaryCodes = ['454', '4.7.0', '4.7.1', '4.2.2', 'ETIMEDOUT', 'ECONNRESET'];
  const isTemporaryCode = temporaryCodes.some(code => 
    errorCode.includes(code) || 
    errorMessage.includes(code) || 
    (responseCode && responseCode.includes(code)) ||
    (response && response.includes(code)) ||
    errorMessage.includes('Temporary failure') ||
    errorMessage.includes('try again later')
  );
  
  return isTemporaryCode;
}

/**
 * Send auto-reply email with retry logic
 * @param {string} emailAddress - The business email address that received the original email
 * @param {string} recipientEmail - The email address to send auto-reply to
 * @param {string} recipientName - The name of the recipient
 * @param {string} originalSubject - The original email subject (optional)
 * @param {string} messageId - The email message ID (optional)
 * @param {Date} emailDate - The email date (optional)
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<boolean>} Success status
 */
async function sendAutoReply(emailAddress, recipientEmail, recipientName, originalSubject = '', messageId = '', emailDate = null, retries = 3) {
  try {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return false;
    }
    
    const config = await getAutoReplyConfig(emailAddress);
    
    if (!config?.enabled || !config.subject || !config.message) {
      return false;
    }
    
    const variables = {
      name: recipientName || 'Valued Customer',
      email: recipientEmail,
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      originalSubject: originalSubject || 'your inquiry'
    };
    
    const subject = replaceVariables(config.subject, variables);
    const htmlMessage = formatAutoReplyHTML(config.message, variables);
    
    // Retry logic for temporary failures
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const transporter = createTransporter(emailAddress);
        
        await transporter.sendMail({
          from: `Glister Luxury <${emailAddress}>`,
          to: recipientEmail,
          subject,
          html: htmlMessage,
          headers: {
            'Auto-Submitted': 'auto-replied',
            'X-Auto-Response-Suppress': 'All'
          }
        });
        
        // Auto-reply sent - logging is done in the controller
        return true;
      } catch (error) {
        const isTemporary = isTemporaryError(error);
        const isLastAttempt = attempt === retries;
        
        if (isTemporary && !isLastAttempt) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          emailLogger.warn(`Temporary SMTP failure, retrying`, {
            emailAddress,
            recipientEmail,
            attempt,
            retries,
            delay,
            error: error.message
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's not temporary or it's the last attempt, throw the error
        if (isLastAttempt || !isTemporary) {
          throw error;
        }
      }
    }
    
    return false;
  } catch (error) {
    const isTemporary = isTemporaryError(error);
    const errorType = isTemporary ? 'Temporary SMTP failure' : 'SMTP error';
    
    emailLogger.logAutoReply('failed', emailAddress, recipientEmail, {
      errorType,
      error: error.message,
      code: error.code,
      responseCode: error.responseCode,
      isTemporary,
      message: error.message?.includes('Invalid login') || error.message?.includes('authentication')
        ? 'Authentication error - verify EMAIL_PASSWORD is correct'
        : `${errorType} sending auto-reply`
    });
    
    return false;
  }
}

module.exports = {
  getAutoReplyConfig,
  sendAutoReply,
  replaceVariables,
  formatAutoReplyHTML,
  isBusinessEmail,
  checkIfAlreadyReplied,
  markAsReplied
};
