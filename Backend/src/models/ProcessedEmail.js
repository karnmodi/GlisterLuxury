const mongoose = require('mongoose');

const processedEmailSchema = new mongoose.Schema({
  emailAddress: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  senderEmail: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  messageId: {
    type: String,
    index: true,
    default: null
  },
  subject: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  repliedAt: {
    type: Date,
    default: Date.now
  },
  uniqueIdentifier: {
    type: String,
    required: true,
    unique: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for fast lookups
processedEmailSchema.index({ emailAddress: 1, senderEmail: 1, messageId: 1 });
processedEmailSchema.index({ emailAddress: 1, uniqueIdentifier: 1 });

// Static method to check if email was already replied to
processedEmailSchema.statics.checkIfReplied = async function(emailAddress, senderEmail, messageId, subject, date) {
  try {
    // Check if database is connected
    if (!this.db || this.db.readyState !== 1) {
      return false; // Database not connected, assume not replied
    }
    
    // Generate unique identifier
    const dateStr = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const uniqueId = messageId 
      ? `${messageId}|${senderEmail.toLowerCase()}|${dateStr}`
      : `${senderEmail.toLowerCase()}|${subject}|${dateStr}`;
    
    const existing = await this.findOne({ 
      emailAddress: emailAddress.toLowerCase().trim(),
      uniqueIdentifier: uniqueId
    });
    
    return !!existing;
  } catch (error) {
    // On error, assume not replied to avoid blocking legitimate emails
    console.error('[ProcessedEmail] Error checking if replied:', error.message);
    return false;
  }
};

// Static method to mark email as replied
processedEmailSchema.statics.markAsReplied = async function(emailAddress, senderEmail, messageId, subject, date) {
  try {
    // Check if database is connected
    if (!this.db || this.db.readyState !== 1) {
      console.warn('[ProcessedEmail] Database not connected, cannot mark email as replied');
      return null; // Database not connected
    }
    
    const dateStr = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const uniqueId = messageId 
      ? `${messageId}|${senderEmail.toLowerCase()}|${dateStr}`
      : `${senderEmail.toLowerCase()}|${subject}|${dateStr}`;
    
    const processedEmail = await this.create({
      emailAddress: emailAddress.toLowerCase().trim(),
      senderEmail: senderEmail.toLowerCase().trim(),
      messageId: messageId || null,
      subject: subject || '',
      date: date || new Date(),
      uniqueIdentifier: uniqueId
    });
    return processedEmail;
  } catch (error) {
    // If unique constraint violation, email was already marked (race condition handled)
    if (error.code === 11000) {
      return null; // Already exists
    }
    // Log other errors but don't throw to prevent crashes
    console.error('[ProcessedEmail] Error marking as replied:', error.message);
    return null;
  }
};

const ProcessedEmail = mongoose.model('ProcessedEmail', processedEmailSchema);

module.exports = ProcessedEmail;

