const ContactInfo = require('../models/ContactInfo');
const ContactInquiry = require('../models/ContactInquiry');
const nodemailer = require('nodemailer');

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

// Contact Info CRUD operations
async function createContactInfo(req, res) {
	try {
		const { socialMedia, businessWhatsApp, ...restData } = req.body;

		// Validate WhatsApp number if provided
		if (businessWhatsApp !== undefined && !isValidWhatsAppNumber(businessWhatsApp)) {
			return res.status(400).json({ 
				message: 'WhatsApp number must be in E.164 format (e.g., +1234567890) with country code' 
			});
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
			...(businessWhatsApp !== undefined && { businessWhatsApp: businessWhatsApp.trim() })
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
		const { socialMedia, businessWhatsApp, ...restData } = req.body;

		// Validate WhatsApp number if provided
		if (businessWhatsApp !== undefined && !isValidWhatsAppNumber(businessWhatsApp)) {
			return res.status(400).json({ 
				message: 'WhatsApp number must be in E.164 format (e.g., +1234567890) with country code' 
			});
		}

		// Validate and clean social media URLs if provided
		let updateData = { ...restData };
		
		if (socialMedia !== undefined) {
			try {
				// Get existing contact info to merge with existing social media
				const existing = await ContactInfo.findById(req.params.id).lean();
				if (!existing) {
					return res.status(404).json({ message: 'Contact info not found' });
				}

				// Merge existing social media with new updates
				const existingSocialMedia = existing.socialMedia || {};
				const mergedSocialMedia = { ...existingSocialMedia, ...socialMedia };
				const cleanedSocialMedia = validateAndCleanSocialMedia(mergedSocialMedia);
				updateData.socialMedia = cleanedSocialMedia;
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
		// Configure email transporter
		const transporter = nodemailer.createTransport({
			service: process.env.EMAIL_SERVICE || 'gmail',
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD
			}
		});

		// Admin notification email
		const adminEmailHTML = `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background-color: #2C2C2C; color: #D4AF37; padding: 20px; text-align: center; }
					.content { background-color: #f9f9f9; padding: 20px; }
					.inquiry-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
					.alert-box { background-color: #fff3cd; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; }
					.message-box { background-color: #f5f5f5; padding: 15px; border-radius: 4px; border-left: 3px solid #2C2C2C; margin: 15px 0; }
					.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>📧 NEW CONTACT REQUEST</h1>
						<p>Contact Inquiry Received</p>
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
						<p>This is an automated notification email from Glister London.</p>
						<p>&copy; ${new Date().getFullYear()} Glister London. All rights reserved.</p>
					</div>
				</div>
			</body>
			</html>
		`;

		// Send admin notification
		const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USERNAME;
		await transporter.sendMail({
			from: `Glister London <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
			to: adminEmail,
			subject: `📧 New Contact Request - ${inquiry.subject} - ${inquiry.name}`,
			html: adminEmailHTML
		});

		console.log('[Contact Inquiry] Admin notification email sent successfully');
	} catch (emailError) {
		console.error('[Contact Inquiry] Email sending failed:', emailError);
		// Don't throw error - we don't want to fail the inquiry submission if email fails
	}
}

// Contact Inquiry operations
async function submitInquiry(req, res) {
	try {
		const { name, email, phone, subject, message } = req.body;
		
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
			subject: subject.trim(),
			message: message.trim(),
			status: 'new'
		});
		
		// Send email notification to admin
		try {
			await sendContactInquiryEmail(inquiry);
		} catch (emailError) {
			console.error('[Contact Inquiry] Email sending failed:', emailError);
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
		const { status, q, sortBy } = req.query;
		const filter = {};
		
		// Status filter
		if (status) {
			filter.status = status;
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

