const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'auto-email.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5;

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Rotate log file if it exceeds max size
 */
function rotateLogFile() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > MAX_LOG_SIZE) {
        // Move current log to archive
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveFile = path.join(LOG_DIR, `auto-email-${timestamp}.log`);
        fs.renameSync(LOG_FILE, archiveFile);
        
        // Keep only last N log files
        const logFiles = fs.readdirSync(LOG_DIR)
          .filter(file => file.startsWith('auto-email-') && file.endsWith('.log'))
          .map(file => ({
            name: file,
            path: path.join(LOG_DIR, file),
            time: fs.statSync(path.join(LOG_DIR, file)).mtime
          }))
          .sort((a, b) => b.time - a.time);
        
        // Remove old log files
        if (logFiles.length > MAX_LOG_FILES) {
          logFiles.slice(MAX_LOG_FILES).forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (error) {
              // Ignore deletion errors
            }
          });
        }
      }
    }
  } catch (error) {
    // Ignore rotation errors
  }
}

/**
 * Write log entry to file
 * @param {string} level - Log level (INFO, ERROR, WARN, DEBUG)
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function writeLog(level, message, data = null) {
  try {
    rotateLogFile();
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(LOG_FILE, logLine, { encoding: 'utf8' });
  } catch (error) {
    // Fallback to console if file write fails
    console.error(`[Email Logger] Failed to write log:`, error.message);
  }
}

/**
 * Log info message
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
function info(message, data = null) {
  writeLog('INFO', message, data);
}

/**
 * Log error message
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
function error(message, data = null) {
  writeLog('ERROR', message, data);
}

/**
 * Log warning message
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
function warn(message, data = null) {
  writeLog('WARN', message, data);
}

/**
 * Log debug message
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
function debug(message, data = null) {
  writeLog('DEBUG', message, data);
}

/**
 * Log email processing event
 * @param {string} event - Event type (fetched, processed, replied, failed)
 * @param {Object} emailData - Email data
 * @param {string} emailAddress - Business email address
 * @param {Object} additionalData - Additional data
 */
function logEmailEvent(event, emailData, emailAddress, additionalData = {}) {
  const logData = {
    event,
    emailAddress,
    email: {
      from: emailData.from?.email,
      to: emailData.to,
      subject: emailData.subject,
      messageId: emailData.messageId,
      uid: emailData.uid,
      date: emailData.date
    },
    ...additionalData
  };
  
  info(`Email ${event}`, logData);
}

/**
 * Log auto-reply event
 * @param {string} event - Event type (sent, failed, retry)
 * @param {string} emailAddress - Business email address
 * @param {string} recipientEmail - Recipient email
 * @param {Object} additionalData - Additional data
 */
function logAutoReply(event, emailAddress, recipientEmail, additionalData = {}) {
  const logData = {
    event,
    emailAddress,
    recipientEmail,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  // For 'sent' events, create a more detailed log message
  if (event === 'sent') {
    const recipientName = additionalData.recipientName || recipientEmail.split('@')[0];
    info(`✅ Auto-reply sent to ${recipientName} (${recipientEmail}) from ${emailAddress}`, logData);
  } else {
    info(`Auto-reply ${event}`, logData);
  }
}

module.exports = {
  info,
  error,
  warn,
  debug,
  logEmailEvent,
  logAutoReply
};

