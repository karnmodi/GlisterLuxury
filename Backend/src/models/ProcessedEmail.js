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
};

// Static method to mark email as replied
processedEmailSchema.statics.markAsReplied = async function(emailAddress, senderEmail, messageId, subject, date) {
  const dateStr = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const uniqueId = messageId 
    ? `${messageId}|${senderEmail.toLowerCase()}|${dateStr}`
    : `${senderEmail.toLowerCase()}|${subject}|${dateStr}`;
  
  try {
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
    throw error;
  }
};

const ProcessedEmail = mongoose.model('ProcessedEmail', processedEmailSchema);

module.exports = ProcessedEmail;

