const ContactInfo = require('../models/ContactInfo');
const ContactInquiry = require('../models/ContactInquiry');
const nodemailer = require('nodemailer');
const autoReplyService = require('../services/autoReply.service');
const { getLogoUrl } = require('../utils/emailHelpers');

// Helper function to validate URL format
function isValidUrl(url) {
	if (!url || url.trim() === '') return true; // Allow empty strings
	try {
		const urlObj = new URL(url);
		return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
	} catch {
		return false;
	}
}

// Helper function to validate WhatsApp number format (E.164)
function isValidWhatsAppNumber(number) {
	if (!number || number.trim() === '') return true; // Allow empty strings
	return /^\+[1-9]\d{1,14}$/.test(number);
}

// Helper function to clean and validate social media data
function validateAndCleanSocialMedia(socialMedia) {
	if (!socialMedia || typeof socialMedia !== 'object') {
		return {};
	}

	const cleaned = {};
	const platforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'pinterest', 'tiktok'];

	platforms.forEach(platform => {
		if (socialMedia[platform] !== undefined) {
			const url = socialMedia[platform];
			if (url && url.trim() !== '') {
				if (!isValidUrl(url)) {
					throw new Error(`Invalid ${platform} URL format. Must be a valid HTTP/HTTPS URL.`);
				}
				cleaned[platform] = url.trim();
			} else {
				cleaned[platform] = '';
			}
		}
	});

	return cleaned;
}

// Helper function to validate phones array structure
function validatePhonesArray(phones) {
	if (!phones) return null;
	if (!Array.isArray(phones)) {
		throw new Error('phones must be an array');
	}
	
	const validTypes = ['landline', 'contact'];
	const cleaned = phones.map((phone, index) => {
		if (!phone || typeof phone !== 'object') {
			throw new Error(`Phone entry at index ${index} must be an object`);
		}
		if (!phone.type || !validTypes.includes(phone.type)) {
			throw new Error(`Phone entry at index ${index} must have type "landline" or "contact"`);
		}
		if (!phone.number || typeof phone.number !== 'string' || phone.number.trim() === '') {
			throw new Error(`Phone entry at index ${index} must have a non-empty number`);
		}
		return {
			type: phone.type,
			number: phone.number.trim(),
			label: phone.label ? phone.label.trim() : undefined
		};
	});
	
	return cleaned;
}

// Contact Info CRUD operations
async function createContactInfo(req, res) {
	try {
		const { socialMedia, businessWhatsApp, phones, ...restData } = req.body;

		// Validate WhatsApp number if provided
		if (businessWhatsApp !== undefined && !isValidWhatsAppNumber(businessWhatsApp)) {
			return res.status(400).json({ 
				message: 'WhatsApp number must be in E.164 format (e.g., +1234567890) with country code' 
			});
		}

		// Validate and clean phones array if provided
		let cleanedPhones = null;
		if (phones !== undefined) {
			try {
				cleanedPhones = validatePhonesArray(phones);
			} catch (err) {
				return res.status(400).json({ message: err.message });
			}
		}

		// Validate and clean social media URLs
		let cleanedSocialMedia = {};
		if (socialMedia !== undefined) {
			try {
				cleanedSocialMedia = validateAndCleanSocialMedia(socialMedia);
			} catch (err) {
				return res.status(400).json({ message: err.message });
			}
		}

		// Prepare data for creation
		const contactData = {
			...restData,
			...(Object.keys(cleanedSocialMedia).length > 0 && { socialMedia: cleanedSocialMedia }),
			...(businessWhatsApp !== undefined && { businessWhatsApp: businessWhatsApp.trim() }),
			...(cleanedPhones !== null && { phones: cleanedPhones })
		};

		const contactInfo = await ContactInfo.create(contactData);
		return res.status(201).json(contactInfo);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listContactInfo(req, res) {
	try {
		const { type, isActive } = req.query;
		const filter = {};
		
		// Type filter
		if (type) {
			filter.type = type;
		}
		
		// Active filter - if user is not admin, only show active items
		if (!req.user || req.user.role !== 'admin') {
			filter.isActive = true;
		} else if (isActive !== undefined) {
			filter.isActive = isActive === 'true';
		}
		
		const items = await ContactInfo.find(filter)
			.sort({ type: 1, displayOrder: 1 })
			.lean();
		return res.json(items);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getContactInfo(req, res) {
	try {
		const item = await ContactInfo.findById(req.params.id).lean();
		if (!item) return res.status(404).json({ message: 'Contact info not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateContactInfo(req, res) {
	try {
		const { socialMedia, businessWhatsApp, phones, ...restData } = req.body;

		// Validate WhatsApp number if provided
		if (businessWhatsApp !== undefined && !isValidWhatsAppNumber(businessWhatsApp)) {
			return res.status(400).json({ 
				message: 'WhatsApp number must be in E.164 format (e.g., +1234567890) with country code' 
			});
		}

		// Get existing contact info for merging
		const existing = await ContactInfo.findById(req.params.id).lean();
		if (!existing) {
			return res.status(404).json({ message: 'Contact info not found' });
		}

		// Validate and clean social media URLs if provided
		let updateData = { ...restData };
		
		if (socialMedia !== undefined) {
			try {
				// Merge existing social media with new updates
				const existingSocialMedia = existing.socialMedia || {};
				const mergedSocialMedia = { ...existingSocialMedia, ...socialMedia };
				const cleanedSocialMedia = validateAndCleanSocialMedia(mergedSocialMedia);
				updateData.socialMedia = cleanedSocialMedia;
			} catch (err) {
				return res.status(400).json({ message: err.message });
			}
		}

		// Validate and clean phones array if provided
		if (phones !== undefined) {
			try {
				const cleanedPhones = validatePhonesArray(phones);
				updateData.phones = cleanedPhones;
			} catch (err) {
				return res.status(400).json({ message: err.message });
			}
		}

		if (businessWhatsApp !== undefined) {
			updateData.businessWhatsApp = businessWhatsApp.trim();
		}

		const item = await ContactInfo.findByIdAndUpdate(
			req.params.id, 
			updateData, 
			{ new: true, runValidators: true }
		);
		if (!item) return res.status(404).json({ message: 'Contact info not found' });
		return res.json(item);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteContactInfo(req, res) {
	try {
		const result = await ContactInfo.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'Contact info not found' });
		return res.json({ message: 'Contact info deleted successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

/**
 * Helper function to send admin notification email for contact inquiries
 */
async function sendContactInquiryEmail(inquiry) {
	try {
		// Configure email transporter for FastHost SMTP - authenticate with enquiries@glisterluxury.com
		const enquiriesEmail = process.env.EMAIL_FROM_ENQUIRIES || 'enquiries@glisterluxury.com';
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST || 'smtp.livemail.co.uk',
			port: parseInt(process.env.EMAIL_PORT) || 587,
			secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
			auth: {
				user: enquiriesEmail, // Authenticate with enquiries email address
				pass: process.env.EMAIL_PASSWORD
			},
			tls: {
				rejectUnauthorized: false // Set to true in production if you have valid SSL
			}
		});

		// Admin notification email
		const logoUrl = getLogoUrl();
		const adminEmailHTML = `
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
					.header-title {
						color: #D4AF37;
						font-size: 24px;
						font-weight: 600;
						margin: 15px 0 10px 0;
						letter-spacing: 1px;
					}
					.header-subtitle {
						color: #ffffff;
						font-size: 16px;
						font-weight: 300;
					}
					.content { 
						background-color: #ffffff; 
						padding: 30px 20px; 
					}
					.inquiry-details { 
						background-color: #ffffff; 
						padding: 20px; 
						margin: 20px 0; 
						border-radius: 8px;
						border: 1px solid #e5e5e5;
						box-shadow: 0 2px 4px rgba(0,0,0,0.05);
					}
					.inquiry-details h2 {
						color: #2C2C2C;
						font-size: 18px;
						margin-bottom: 15px;
						padding-bottom: 10px;
						border-bottom: 2px solid #D4AF37;
					}
					.inquiry-details p {
						margin: 8px 0;
						line-height: 1.8;
					}
					.alert-box { 
						background-color: #fff3cd; 
						border-left: 4px solid #D4AF37; 
						padding: 15px; 
						margin: 20px 0;
						border-radius: 4px;
					}
					.alert-box strong {
						color: #856404;
					}
					.message-box { 
						background-color: #f5f5f5; 
						padding: 15px; 
						border-radius: 4px; 
						border-left: 3px solid #2C2C2C; 
						margin: 15px 0;
					}
					.message-box p {
						margin: 0;
						white-space: pre-wrap;
						line-height: 1.8;
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
					@media only screen and (max-width: 600px) {
						.email-wrapper { width: 100% !important; }
						.header { padding: 30px 15px; }
						.content { padding: 20px 15px; }
						.inquiry-details { padding: 15px; }
						.footer { padding: 20px 15px; }
					}
				</style>
			</head>
			<body>
				<div class="email-wrapper">
					<div class="header">
						<div class="logo-container">
							<img src="${logoUrl}" alt="Glister Luxury" class="logo" />
						</div>
						<div class="header-title">📧 NEW CONTACT REQUEST</div>
						<div class="header-subtitle">Contact Inquiry Received</div>
					</div>
					<div class="content">
						<div class="alert-box">
							<strong>⚡ Action Required:</strong> A new contact request has been submitted and requires your attention.
						</div>
						
						<div class="inquiry-details">
							<h2>Inquiry Information</h2>
							<p><strong>Submitted Date:</strong> ${new Date(inquiry.createdAt).toLocaleString('en-GB', {
								day: 'numeric',
								month: 'long',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}</p>
							<p><strong>Category:</strong> <span style="background-color: #e7f3ff; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${inquiry.category.replace(/_/g, ' ').toUpperCase()}</span></p>
							<p><strong>Status:</strong> <span style="background-color: #fff3cd; padding: 4px 8px; border-radius: 4px;">NEW</span></p>
							<p><strong>Inquiry ID:</strong> ${inquiry._id}</p>
						</div>

						<div class="inquiry-details">
							<h2>Contact Details</h2>
							<p><strong>Name:</strong> ${inquiry.name}</p>
							<p><strong>Email:</strong> <a href="mailto:${inquiry.email}">${inquiry.email}</a></p>
							${inquiry.phone ? `<p><strong>Phone:</strong> <a href="tel:${inquiry.phone}">${inquiry.phone}</a></p>` : '<p><strong>Phone:</strong> Not provided</p>'}
						</div>

						<div class="inquiry-details">
							<h2>Subject</h2>
							<p style="font-size: 16px; font-weight: bold; color: #2C2C2C;">${inquiry.subject}</p>
						</div>

						<div class="inquiry-details">
							<h2>Message</h2>
							<div class="message-box">
								<p style="white-space: pre-wrap; margin: 0;">${inquiry.message}</p>
							</div>
						</div>

						<div class="alert-box">
							<strong>💡 Next Steps:</strong> Please review this inquiry and respond to the customer at your earliest convenience.
						</div>
					</div>
					<div class="footer">
						<p>This is an automated notification email from Glister Luxury.</p>
						<p>&copy; ${new Date().getFullYear()} Glister Luxury. All rights reserved.</p>
					</div>
				</div>
			</body>
			</html>
		`;

		// Send admin notification from enquiries@glisterluxury.com (matches authentication)
		const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USERNAME;
		const adminRecipients = [adminEmail, 'londonglister@gmail.com'].filter(Boolean);
		await transporter.sendMail({
			from: `Glister Luxury <${enquiriesEmail}>`,
			to: adminRecipients,
			subject: `📧 New Contact Request - ${inquiry.subject} - ${inquiry.name}`,
			html: adminEmailHTML
		});

		console.log('[Contact Inquiry] Admin notification email sent successfully');
	} catch (emailError) {
		console.error('[Contact Inquiry] Email sending failed:', emailError);
		// Don't throw error - we don't want to fail the inquiry submission if email fails
	}
}

/**
 * Helper function to send customer confirmation email for contact inquiries
 */
async function sendContactInquiryConfirmationEmail(inquiry) {
	try {
		// Configure email transporter for FastHost SMTP - authenticate with enquiries@glisterluxury.com
		const enquiriesEmail = process.env.EMAIL_FROM_ENQUIRIES || 'enquiries@glisterluxury.com';
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST || 'smtp.livemail.co.uk',
			port: parseInt(process.env.EMAIL_PORT) || 587,
			secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
			auth: {
				user: enquiriesEmail, // Authenticate with enquiries email address
				pass: process.env.EMAIL_PASSWORD
			},
			tls: {
				rejectUnauthorized: false // Set to true in production if you have valid SSL
			}
		});

		// Customer confirmation email
		const logoUrl = getLogoUrl();
		const customerEmailHTML = `
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
					.header-title {
						color: #ffffff;
						font-size: 20px;
						font-weight: 400;
						margin-top: 20px;
					}
					.content { 
						background-color: #ffffff; 
						padding: 30px 20px; 
					}
					.content p {
						margin: 15px 0;
						line-height: 1.8;
						color: #333333;
					}
					.confirmation-box { 
						background-color: #ffffff; 
						padding: 20px; 
						margin: 20px 0; 
						border-radius: 8px; 
						border-left: 4px solid #D4AF37;
						box-shadow: 0 2px 4px rgba(0,0,0,0.05);
					}
					.confirmation-box h2 {
						margin-top: 0;
						color: #2C2C2C;
						font-size: 20px;
						margin-bottom: 15px;
					}
					.inquiry-summary { 
						background-color: #f5f5f5; 
						padding: 20px; 
						border-radius: 4px; 
						margin: 20px 0;
						border: 1px solid #e5e5e5;
					}
					.inquiry-summary h3 {
						margin-top: 0;
						color: #2C2C2C;
						font-size: 16px;
						margin-bottom: 15px;
					}
					.inquiry-summary p {
						margin: 8px 0;
						line-height: 1.8;
					}
					.info-box { 
						background-color: #e7f3ff; 
						border-left: 4px solid #2196F3; 
						padding: 20px; 
						margin: 20px 0;
						border-radius: 4px;
					}
					.info-box h3 {
						margin-top: 0;
						color: #2C2C2C;
						font-size: 16px;
					}
					.info-box ol {
						margin: 10px 0;
						padding-left: 20px;
					}
					.info-box li {
						margin: 8px 0;
						line-height: 1.6;
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
							<img src="${logoUrl}" alt="Glister Luxury" class="logo" />
						</div>
						<div class="header-text">The Soul of Interior</div>
						<div class="header-title">Thank You for Contacting Us</div>
					</div>
					<div class="content">
						<p>Dear ${inquiry.name},</p>
						
						<div class="confirmation-box">
							<h2 style="margin-top: 0; color: #2C2C2C;">Your Request Has Been Received</h2>
							<p>Thank you for contacting Glister Luxury. We have successfully received your inquiry and our team will review it shortly.</p>
						</div>

						<div class="inquiry-summary">
							<h3 style="margin-top: 0; color: #2C2C2C;">Your Inquiry Summary</h3>
							<p><strong>Inquiry ID:</strong> ${inquiry._id}</p>
							<p><strong>Category:</strong> ${inquiry.category.replace(/_/g, ' ').charAt(0).toUpperCase() + inquiry.category.replace(/_/g, ' ').slice(1)}</p>
							<p><strong>Subject:</strong> ${inquiry.subject}</p>
							<p><strong>Submitted Date:</strong> ${new Date(inquiry.createdAt).toLocaleString('en-GB', {
								day: 'numeric',
								month: 'long',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}</p>
							<p><strong>Status:</strong> <span style="background-color: #fff3cd; padding: 4px 8px; border-radius: 4px; font-weight: bold;">NEW</span></p>
						</div>

						<div class="info-box">
							<h3 style="margin-top: 0;">What Happens Next?</h3>
							<ol style="margin: 10px 0; padding-left: 20px;">
								<li>Our team will review your inquiry</li>
								<li>We'll respond to you at <strong>${inquiry.email}</strong> as soon as possible</li>
								<li>Typically, we respond within 24-48 hours during business days</li>
							</ol>
						</div>

						<p>If you have any urgent questions or need immediate assistance, please don't hesitate to contact us directly.</p>

						<p style="margin-top: 30px;">
							Best regards,<br>
							<strong>The Glister Luxury Team</strong><br>
							<em>The Soul of Interior</em>
						</p>
					</div>
					<div class="footer">
						<p>This is an automated confirmation email. Please do not reply to this email.</p>
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

		// Send customer confirmation from enquiries@glisterluxury.com (matches authentication)
		await transporter.sendMail({
			from: `Glister Luxury <${enquiriesEmail}>`,
			to: inquiry.email,
			subject: `Thank You for Your Inquiry - Glister Luxury`,
			html: customerEmailHTML
		});

		console.log('[Contact Inquiry] Customer confirmation email sent successfully');
	} catch (emailError) {
		console.error('[Contact Inquiry] Customer confirmation email sending failed:', emailError);
		// Don't throw error - we don't want to fail the inquiry submission if email fails
	}
}

// Contact Inquiry operations
async function submitInquiry(req, res) {
	try {
		const { name, email, phone, category, subject, message } = req.body;

		if (!name || !email || !subject || !message) {
			return res.status(400).json({
				message: 'Name, email, subject, and message are required'
			});
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ message: 'Invalid email format' });
		}

		const inquiry = await ContactInquiry.create({
			name: name.trim(),
			email: email.trim().toLowerCase(),
			phone: phone ? phone.trim() : undefined,
			category: category || 'general_inquiry',
			subject: subject.trim(),
			message: message.trim(),
			status: 'new'
		});
		
		// Send email notifications (admin and customer)
		try {
			// Send admin notification
			await sendContactInquiryEmail(inquiry);
		} catch (emailError) {
			console.error('[Contact Inquiry] Admin email sending failed:', emailError);
			// Don't fail the inquiry submission if email fails
		}

		try {
			// Try to send auto-reply first (if enabled)
			const enquiriesEmail = process.env.EMAIL_FROM_ENQUIRIES || 'enquiries@glisterluxury.com';
			const autoReplySent = await autoReplyService.sendAutoReply(
				enquiriesEmail,
				inquiry.email,
				inquiry.name,
				inquiry.subject
			);
			
			// If auto-reply is not enabled or failed, send default confirmation email
			if (!autoReplySent) {
			await sendContactInquiryConfirmationEmail(inquiry);
			}
		} catch (emailError) {
			console.error('[Contact Inquiry] Customer confirmation email sending failed:', emailError);
			// Don't fail the inquiry submission if email fails
		}
		
		return res.status(201).json({ 
			message: 'Inquiry submitted successfully',
			inquiry 
		});
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function listInquiries(req, res) {
	try {
		const { status, q, sortBy, category } = req.query;
		const filter = {};
		
		// Status filter
		if (status) {
			filter.status = status;
		}
		
		// Category filter
		if (category) {
			filter.category = category;
		}
		
		// Search filter
		if (q) {
			filter.$or = [
				{ name: { $regex: q, $options: 'i' } },
				{ email: { $regex: q, $options: 'i' } },
				{ subject: { $regex: q, $options: 'i' } },
				{ message: { $regex: q, $options: 'i' } },
			];
		}
		
		// Build sort object
		let sort = { createdAt: -1 }; // Default sort by newest first
		if (sortBy) {
			switch (sortBy) {
				case 'status':
					sort = { status: 1, createdAt: -1 };
					break;
				case 'oldest':
					sort = { createdAt: 1 };
					break;
				case 'name':
					sort = { name: 1 };
					break;
				case 'category':
					sort = { category: 1, createdAt: -1 };
					break;
			}
		}
		
		const inquiries = await ContactInquiry.find(filter).sort(sort).lean();
		return res.json(inquiries);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
}

async function getInquiry(req, res) {
	try {
		const inquiry = await ContactInquiry.findById(req.params.id).lean();
		if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
		return res.json(inquiry);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function updateInquiry(req, res) {
	try {
		const { status, adminNotes } = req.body;
		
		const updateData = {};
		if (status !== undefined) updateData.status = status;
		if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
		
		const inquiry = await ContactInquiry.findByIdAndUpdate(
			req.params.id,
			updateData,
			{ new: true, runValidators: true }
		);
		
		if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
		return res.json(inquiry);
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

async function deleteInquiry(req, res) {
	try {
		const result = await ContactInquiry.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ message: 'Inquiry not found' });
		return res.json({ message: 'Inquiry deleted successfully' });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
}

module.exports = {
	createContactInfo,
	listContactInfo,
	getContactInfo,
	updateContactInfo,
	deleteContactInfo,
	submitInquiry,
	listInquiries,
	getInquiry,
	updateInquiry,
	deleteInquiry
};

